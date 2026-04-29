from datetime import datetime, timedelta
from functools import wraps

import jwt
from django.conf import settings
from django.http import JsonResponse


def create_access_token(user_id: int) -> str:
    exp = datetime.utcnow() + timedelta(hours=settings.JWT_ACCESS_TOKEN_EXPIRES_HOURS)
    payload = {"user_id": user_id, "exp": exp}
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    return token


def get_jwt_identity(request):
    return getattr(request, "jwt_user_id", None)


def jwt_required(view_func):
    @wraps(view_func)
    def wrapped(request, *args, **kwargs):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith("Bearer "):
            return JsonResponse({"success": False, "message": "Missing token"}, status=401)
        token = auth_header.split(" ", 1)[1]
        try:
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        except jwt.ExpiredSignatureError:
            return JsonResponse({"success": False, "message": "Token has expired"}, status=401)
        except jwt.InvalidTokenError:
            return JsonResponse({"success": False, "message": "Invalid token"}, status=401)
        user_id = payload.get("user_id")
        if not user_id:
            return JsonResponse({"success": False, "message": "Invalid token"}, status=401)
        request.jwt_user_id = user_id
        return view_func(request, *args, **kwargs)

    return wrapped
