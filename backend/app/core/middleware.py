import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from starlette.types import ASGIApp

from app.core.logging_config import correlation_id_var


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """Accepts an inbound X-Request-ID (useful if a frontend/proxy already
    assigns one) or mints a fresh one, threads it through contextvars for
    the duration of the request, and echoes it back in the response.
    """

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next) -> Response:
        correlation_id = request.headers.get("x-request-id") or str(uuid.uuid4())
        token = correlation_id_var.set(correlation_id)
        try:
            response = await call_next(request)
        finally:
            correlation_id_var.reset(token)
        response.headers["X-Request-ID"] = correlation_id
        # The API's own browser headers, set here rather than in a second
        # middleware: every extra BaseHTTPMiddleware layer wraps the SSE
        # stream again. None of these responses is a page, so: never sniff a
        # JSON body or an image into something executable, never be framed,
        # and never hand a URL (they can carry conversation ids) to anyone.
        # No Cross-Origin-Resource-Policy - the app on clardentity.ai loads
        # generated pictures from this origin in <img> tags, and same-site
        # would block exactly that.
        for name, value in _SECURITY_HEADERS:
            response.headers.setdefault(name, value)
        return response


_SECURITY_HEADERS = (
    ("X-Content-Type-Options", "nosniff"),
    ("X-Frame-Options", "DENY"),
    ("Referrer-Policy", "no-referrer"),
)
