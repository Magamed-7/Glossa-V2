export class ApiError extends Error {
  constructor(code, message, status, field) {
    super(message);
    this.code = code;
    this.status = status;
    this.field = field;
  }
}

// FastAPI отвечает {"error": {code, message, status}}; Django DRF — {"email": ["..."]} или {"detail": "..."}.
// Кастомного обработчика исключений в Django нет (см. Frontend/Plan/API_CONTRACT.md), поэтому парсер
// должен понимать оба формата.
export function fromEnvelope(body, status) {
  if (body && body.error && body.error.code) {
    return new ApiError(body.error.code, body.error.message, status);
  }

  if (body && typeof body === "object") {
    if (body.detail) return new ApiError("DETAIL", String(body.detail), status);

    const field = Object.keys(body)[0];
    if (field) {
      const value = body[field];
      const text = Array.isArray(value) ? value[0] : String(value);
      return new ApiError("FIELD_ERROR", text, status, field);
    }
  }

  return new ApiError("UNKNOWN", "Request failed", status);
}

export function networkError() {
  return new ApiError("NETWORK", "No connection to the server", 0);
}
