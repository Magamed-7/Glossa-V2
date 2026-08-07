import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


class AppError(Exception):
    def __init__(self, code: str, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.code = code
        self.message = message
        self.status_code = status_code


def error_response(code: str, message: str, status_code: int):
    return JSONResponse(
        status_code=status_code,
        content={'error': {'code': code, 'message': message, 'status': status_code}},
    )


async def app_error_handler(request: Request, exc: AppError):
    return error_response(exc.code, exc.message, exc.status_code)


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return error_response('HTTP_ERROR', str(exc.detail), exc.status_code)


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return error_response(
        'VALIDATION_ERROR', 'Invalid request data', status.HTTP_422_UNPROCESSABLE_CONTENT
    )


async def unhandled_exception_handler(request: Request, exc: Exception):
    # Без этого перехватчика необработанное исключение долетает до Starlette'овского
    # ServerErrorMiddleware (он оборачивает CORSMiddleware снаружи) и отдаёт голый
    # текстовый 500 без CORS-заголовков — браузер блокирует такой ответ как непрозрачный,
    # и fetch() падает с сетевой ошибкой, а не с реальным кодом/сообщением. Регистрация
    # через add_exception_handler держит обработку внутри обычного стека middleware,
    # так что CORSMiddleware успевает проставить заголовки на JSON-ответ.
    logger.exception('Unhandled exception on %s %s', request.method, request.url.path, exc_info=exc)
    return error_response(
        'INTERNAL_ERROR', 'Something went wrong on our end.', status.HTTP_500_INTERNAL_SERVER_ERROR
    )


def register_exception_handlers(app: FastAPI):
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
