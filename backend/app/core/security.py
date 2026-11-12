from uuid import UUID

import jwt
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient

from app.core.config import settings


bearer_scheme = HTTPBearer(auto_error=False)
jwks_client = PyJWKClient(
    f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
)


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Security(bearer_scheme),
) -> UUID:
    """Validate a Supabase access token and return its user id."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A Supabase access token is required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        token = credentials.credentials
        signing_key = jwks_client.get_signing_key_from_jwt(token).key
        claims = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256", "ES256"],
            audience=settings.SUPABASE_JWT_AUDIENCE,
            issuer=f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1",
        )
        return UUID(str(claims["sub"]))
    except (jwt.PyJWTError, KeyError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Supabase access token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
