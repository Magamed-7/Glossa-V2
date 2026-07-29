import uuid

import boto3

from app.core.config import settings

s3_client = boto3.client(
    's3',
    endpoint_url=settings.MINIO_ENDPOINT,
    aws_access_key_id=settings.MINIO_ROOT_USER,
    aws_secret_access_key=settings.MINIO_ROOT_PASSWORD,
)


def upload_file(bucket: str, file_bytes: bytes, filename: str, content_type: str):
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
