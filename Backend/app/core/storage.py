import io
import os
import uuid

import boto3

from app.core.config import settings
from app.core.errors import AppError

s3_client = boto3.client(
    's3',
    endpoint_url=settings.MINIO_ENDPOINT,
    aws_access_key_id=settings.MINIO_ROOT_USER,
    aws_secret_access_key=settings.MINIO_ROOT_PASSWORD,
)

ALLOWED_IMAGE_TYPES = {'image/jpeg', 'image/png', 'image/webp'}
ALLOWED_AUDIO_TYPES = {'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/x-m4a'}
ALLOWED_CHAT_FILE_TYPES = ALLOWED_IMAGE_TYPES | ALLOWED_AUDIO_TYPES | {
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'text/plain',
    'video/mp4',
    'video/webm',
}

UPLOAD_CHUNK_SIZE = 1024 * 1024
MAX_UPLOAD_SIZE = 5 * 1024 * 1024

AVATAR_MAX_SIDE = 512
PICTURE_MAX_SIDE = 1280
PICTURE_QUALITY = 82
KEEP_AS_IS_SIZE = 200 * 1024


async def read_upload(file):
    chunks = []
    total = 0

    while True:
        chunk = await file.read(UPLOAD_CHUNK_SIZE)

        if not chunk:
            break

        total += len(chunk)

        if total > MAX_UPLOAD_SIZE:
            raise AppError(code='FILE_TOO_LARGE', message='File exceeds the maximum allowed size', status_code=400)

        chunks.append(chunk)

    return b''.join(chunks)


def shrink_image(file_bytes: bytes, filename: str, content_type: str, max_side: int):
    if content_type not in ALLOWED_IMAGE_TYPES:
        return file_bytes, filename, content_type

    try:
        from PIL import Image, ImageOps
    except ModuleNotFoundError:
        return file_bytes, filename, content_type

    try:
        image = ImageOps.exif_transpose(Image.open(io.BytesIO(file_bytes)))
    except Exception:
        return file_bytes, filename, content_type

    if max(image.size) <= max_side and len(file_bytes) <= KEEP_AS_IS_SIZE:
        return file_bytes, filename, content_type

    image.thumbnail((max_side, max_side), Image.LANCZOS)
    buffer = io.BytesIO()
    image.convert('RGB').save(buffer, format='JPEG', quality=PICTURE_QUALITY, optimize=True, progressive=True)
    shrunk = buffer.getvalue()

    if len(shrunk) >= len(file_bytes):
        return file_bytes, filename, content_type

    return shrunk, os.path.splitext(filename)[0] + '.jpg', 'image/jpeg'


def upload_file(
    bucket: str,
    file_bytes: bytes,
    filename: str,
    content_type: str,
    allowed_types: set[str],
    max_side: int | None = None,
):
    if content_type not in allowed_types:
        raise AppError(code='UNSUPPORTED_FILE_TYPE', message='Unsupported file type', status_code=400)

    if max_side:
        file_bytes, filename, content_type = shrink_image(file_bytes, filename, content_type, max_side)

    key = f'{uuid.uuid4()}_{filename}'

    s3_client.put_object(
        Bucket=bucket,
        Key=key,
        Body=file_bytes,
        ContentType=content_type,
    )

    return get_file_url(bucket, key)


def get_file_url(bucket: str, key: str):
    return f'{settings.MINIO_PUBLIC_ENDPOINT}/{bucket}/{key}'
