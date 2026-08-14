from fastapi import APIRouter, Depends
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.db.database import get_db
from app.services import data_export, pdf_export

router_export = APIRouter(prefix='/export', tags=['Export'])


@router_export.get('/me')
async def export_my_data(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    export = await data_export.build_user_export(current_user.id, db)

    export['account'] = {
        'id': current_user.id,
        'username': current_user.username,
        'email': current_user.email,
        'role': current_user.role,
        'is_verified': current_user.is_verified,
        'created_at': current_user.created_at,
    }

    return export


@router_export.get('/me/pdf', response_class=Response)
async def export_my_data_pdf(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Generate and return a styled PDF report of the current user's data."""
    export = await data_export.build_user_export(current_user.id, db)

    # Attach account info so pdf_export can read it
    export['account'] = {
        'id': current_user.id,
        'username': current_user.username,
        'email': current_user.email,
        'role': current_user.role,
        'is_verified': current_user.is_verified,
        'created_at': current_user.created_at,
    }

    pdf_bytes = pdf_export.build_pdf(export, current_user)

    filename = f"glossa-report-{current_user.username}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_bytes)),
        },
    )
