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

UPLOAD_CHUNK_SIZE = 1024 * 1024
MAX_UPLOAD_SIZE = 5 * 1024 * 1024


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


def upload_file(bucket: str, file_bytes: bytes, filename: str, content_type: str, allowed_types: set[str]):
    if content_type not in allowed_types:
        raise AppError(code='UNSUPPORTED_FILE_TYPE', message='Unsupported file type', status_code=400)

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
