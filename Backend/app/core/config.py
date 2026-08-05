import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    DATABASE_URL: str = os.getenv('DATABASE_URL')
    DB_ECHO: bool = os.getenv('DB_ECHO', 'False') == 'True'

    JWT_SECRET_KEY: str = os.environ['JWT_SECRET_KEY']
    JWT_ALGORITHM: str = os.getenv('JWT_ALGORITHM', 'HS256')
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '30'))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv('REFRESH_TOKEN_EXPIRE_DAYS', '7'))

    REDIS_URL: str = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

    MINIO_ROOT_USER: str = os.getenv('MINIO_ROOT_USER', 'glossa')
    MINIO_ROOT_PASSWORD: str = os.getenv('MINIO_ROOT_PASSWORD', '')
    MINIO_ENDPOINT: str = os.getenv('MINIO_ENDPOINT', 'http://localhost:9000')
    MINIO_PUBLIC_ENDPOINT: str = os.getenv('MINIO_PUBLIC_ENDPOINT', 'http://localhost:9000')

    BASE_URL: str = os.getenv('BASE_URL', 'http://127.0.0.1:8000')
    CORS_ORIGINS: list[str] = os.getenv('CORS_ORIGINS', 'http://localhost:5173').split(',')

    TG_BOT: str = os.getenv('TG_BOT', '')
    TELEGRAM_BOT_USERNAME: str = os.getenv('TELEGRAM_BOT_USERNAME', 'Glossahelperbot')

    CELERY_BROKER_URL: str = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/1')
    CELERY_RESULT_BACKEND: str = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/1')

    STRIPE_SECRET_KEY: str = os.getenv('STRIPE_SECRET_KEY', '')
    STRIPE_WEBHOOK_SECRET: str = os.getenv('STRIPE_WEBHOOK_SECRET', '')
    STRIPE_SUCCESS_URL: str = os.getenv('STRIPE_SUCCESS_URL', 'http://localhost:5173/payment/success')
    STRIPE_CANCEL_URL: str = os.getenv('STRIPE_CANCEL_URL', 'http://localhost:5173/payment/cancel')

    EMAIL_HOST: str = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
    EMAIL_PORT: int = int(os.getenv('EMAIL_PORT', '587'))
    EMAIL_USE_TLS: bool = os.getenv('EMAIL_USE_TLS', 'True') == 'True'
    EMAIL_HOST_USER: str = os.getenv('EMAIL_HOST_USER')
    EMAIL_HOST_PASSWORD: str = os.getenv('EMAIL_HOST_PASSWORD')
    DEFAULT_FROM_EMAIL: str = os.getenv('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER)

    LLM_API_KEY: str = os.getenv('LLM_API_KEY', '')
    LLM_BASE_URL: str = os.getenv('LLM_BASE_URL', 'https://api.groq.com/openai/v1')
    # Список через запятую — call_llm идёт по нему по порядку и берёт первую модель этого
    # провайдера, которая реально ответила, а не падает на первой же перегруженной/снятой модели.
    LLM_MODELS: list[str] = [
        m.strip()
        for m in os.getenv(
            'LLM_MODELS',
            'llama-3.3-70b-versatile,openai/gpt-oss-120b,qwen/qwen3.6-27b,'
            'openai/gpt-oss-20b,llama-3.1-8b-instant',
        ).split(',')
        if m.strip()
    ]

    # Второй провайдер (тоже со своим списком моделей) — call_llm переходит на него, только
    # если ВСЕ модели основного провайдера подряд отказали, а не в норме. Необязателен: если
    # ключ не задан, работает только основной провайдер.
    LLM_FALLBACK_API_KEY: str = os.getenv('LLM_FALLBACK_API_KEY', '')
    LLM_FALLBACK_BASE_URL: str = os.getenv(
        'LLM_FALLBACK_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta/openai/'
    )
    LLM_FALLBACK_MODELS: list[str] = [
        m.strip()
        for m in os.getenv(
            'LLM_FALLBACK_MODELS',
            'gemini-flash-latest,gemini-3.6-flash,gemini-3.5-flash,'
            'gemini-3.5-flash-lite,gemini-flash-lite-latest',
        ).split(',')
        if m.strip()
    ]

    ELASTICSEARCH_URL: str = os.getenv('ELASTICSEARCH_URL', 'http://localhost:9200')
    ELASTIC_PASSWORD: str = os.getenv('ELASTIC_PASSWORD', '')


settings = Settings()
