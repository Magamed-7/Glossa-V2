from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.model_messenger import ConversationMessages, ConversationParticipants, Conversations
from app.models.model_profile import UserProfiles
from app.models.model_user import Users


async def get_or_create_direct_conversation(user_id: int, other_user_id: int, db: AsyncSession):
    if user_id == other_user_id:
        raise AppError(code='CANNOT_MESSAGE_SELF', message='You cannot start a conversation with yourself', status_code=400)

    other_user = await db.get(Users, other_user_id)
    if other_user is None:
        raise AppError(code='USER_NOT_FOUND', message='User not found', status_code=404)

    mine = select(ConversationParticipants.conversation_id).where(ConversationParticipants.user_id == user_id)
    theirs = select(ConversationParticipants.conversation_id).where(ConversationParticipants.user_id == other_user_id)

    existing_id = await db.scalar(
        select(Conversations.id)
        .where(Conversations.is_group.is_(False), Conversations.id.in_(mine), Conversations.id.in_(theirs))
    )

    if existing_id is not None:
        return await db.get(Conversations, existing_id)

    conversation = Conversations(is_group=False)
    db.add(conversation)
    await db.flush()

    db.add(ConversationParticipants(conversation_id=conversation.id, user_id=user_id))
    db.add(ConversationParticipants(conversation_id=conversation.id, user_id=other_user_id))
    await db.commit()
    await db.refresh(conversation)
    return conversation


async def is_participant(conversation_id: int, user_id: int, db: AsyncSession):
    result = await db.execute(
        select(ConversationParticipants).where(
            ConversationParticipants.conversation_id == conversation_id,
            ConversationParticipants.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def get_participant_ids(conversation_id: int, db: AsyncSession):
    result = await db.execute(
        select(ConversationParticipants.user_id).where(ConversationParticipants.conversation_id == conversation_id)
    )
    return [row[0] for row in result.all()]


async def get_other_participant(conversation_id: int, user_id: int, db: AsyncSession):
    result = await db.execute(
        select(Users, UserProfiles)
        .join(ConversationParticipants, ConversationParticipants.user_id == Users.id)
        .outerjoin(UserProfiles, UserProfiles.user_id == Users.id)
        .where(
            ConversationParticipants.conversation_id == conversation_id,
            ConversationParticipants.user_id != user_id,
        )
        .limit(1)
    )
    row = result.first()
    if row is None:
        return None

    user, profile = row
    return {'id': user.id, 'username': user.username, 'photo_url': profile.photo_url if profile else None}


async def get_last_message(conversation_id: int, db: AsyncSession):
    result = await db.execute(
        select(ConversationMessages)
        .where(ConversationMessages.conversation_id == conversation_id)
        .order_by(ConversationMessages.id.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_unread_count(conversation_id: int, user_id: int, db: AsyncSession):
    participant = await is_participant(conversation_id, user_id, db)
    if participant is None:
        return 0

    query = select(func.count()).select_from(ConversationMessages).where(
        ConversationMessages.conversation_id == conversation_id,
        ConversationMessages.sender_id != user_id,
    )
    if participant.last_read_message_id is not None:
        query = query.where(ConversationMessages.id > participant.last_read_message_id)

    return await db.scalar(query) or 0


async def get_my_conversations(user_id: int, db: AsyncSession):
    conversation_ids = select(ConversationParticipants.conversation_id).where(
        ConversationParticipants.user_id == user_id
    )
    result = await db.execute(
        select(Conversations)
        .where(Conversations.id.in_(conversation_ids))
        .order_by(Conversations.last_message_at.desc())
    )
    return result.scalars().all()


async def create_message(
    conversation_id: int,
    sender_id: int,
    db: AsyncSession,
    type: str = 'text',
    text: str | None = None,
    attachment_url: str | None = None,
    attachment_name: str | None = None,
    attachment_duration_seconds: int | None = None,
):
    message = ConversationMessages(
        conversation_id=conversation_id,
        sender_id=sender_id,
        type=type,
        text=text,
        attachment_url=attachment_url,
        attachment_name=attachment_name,
        attachment_duration_seconds=attachment_duration_seconds,
    )
    db.add(message)

    conversation = await db.get(Conversations, conversation_id)
    conversation.last_message_at = func.now()

    sender_participant = await is_participant(conversation_id, sender_id, db)

    await db.commit()
    await db.refresh(message)

    if sender_participant is not None:
        sender_participant.last_read_message_id = message.id
        await db.commit()

    return message


async def get_messages(conversation_id: int, db: AsyncSession, before_id: int | None = None, limit: int = 30):
    query = select(ConversationMessages).where(ConversationMessages.conversation_id == conversation_id)
    if before_id is not None:
        query = query.where(ConversationMessages.id < before_id)
    query = query.order_by(ConversationMessages.id.desc()).limit(limit)

    result = await db.execute(query)
    messages = result.scalars().all()
    return list(reversed(messages))


async def mark_read(conversation_id: int, user_id: int, db: AsyncSession):
    participant = await is_participant(conversation_id, user_id, db)
    if participant is None:
        return None

    latest = await get_last_message(conversation_id, db)
    if latest is not None:
        participant.last_read_message_id = latest.id
        await db.commit()

    return participant
