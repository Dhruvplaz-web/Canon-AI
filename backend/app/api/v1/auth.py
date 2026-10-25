"""Authentication routes and dependency injection for RBAC and tenant context."""

from collections.abc import Callable

import jwt
from fastapi import APIRouter, Cookie, Depends, Header, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db, set_tenant_context
from app.core.security import (
    create_access_token,
    decode_access_token,
    verify_password,
)
from app.models.workspace import User
from app.schemas.auth import LoginRequest, LoginResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_token_from_request(
    authorization: str | None = Header(None),
    access_token: str | None = Cookie(None),
) -> str | None:
    """Extracts bearer token from httpOnly cookie or Authorization header."""
    if access_token:
        return access_token
    if authorization and authorization.startswith("Bearer "):
        return authorization.split(" ")[1]
    return None


def get_current_user(
    token: str | None = Depends(get_token_from_request),
    db: Session = Depends(get_db),
) -> User:
    """
    Validates JWT token, resolves authenticated user, and sets the
    PostgreSQL Row-Level Security tenant context on the session.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "Authentication credentials required",
                    "details": {},
                }
            },
        )

    try:
        payload = decode_access_token(token)
        user_id_raw = payload.get("sub")
        workspace_id_raw = payload.get("workspace_id")
        if not user_id_raw or not workspace_id_raw:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "error": {
                        "code": "INVALID_TOKEN",
                        "message": "Token payload missing required claims",
                        "details": {},
                    }
                },
            )
        try:
            import uuid

            user_id = uuid.UUID(str(user_id_raw))
            workspace_id = uuid.UUID(str(workspace_id_raw))
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "error": {
                        "code": "INVALID_TOKEN",
                        "message": "Token claims are not valid UUID identifiers",
                        "details": {},
                    }
                },
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "INVALID_TOKEN",
                    "message": "Signature verification failed or token expired",
                    "details": {},
                }
            },
        )

    # Enforce tenant isolation for user query
    set_tenant_context(db, workspace_id)
    user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "USER_NOT_FOUND",
                    "message": "Authenticated user does not exist or is inactive",
                    "details": {},
                }
            },
        )

    return user


def require_role(*permitted_roles: str) -> Callable[[User], User]:
    """Role-based access control guard asserting current user has permitted role."""

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in permitted_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": {
                        "code": "FORBIDDEN",
                        "message": f"Action requires one of roles: {', '.join(permitted_roles)} (current: {current_user.role})",
                        "details": {"role": current_user.role},
                    }
                },
            )
        return current_user

    return role_checker


@router.post("/login", response_model=LoginResponse, summary="User login")
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Authenticates user, issues JWT access token, and attaches it as an
    httpOnly, secure cookie for seamless single-origin proxying.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "INVALID_CREDENTIALS",
                    "message": "Invalid email or password",
                    "details": {},
                }
            },
        )

    token_data = {
        "sub": str(user.id),
        "workspace_id": str(user.workspace_id),
        "role": user.role,
        "email": user.email,
    }
    access_token = create_access_token(token_data)

    # Attach httpOnly secure cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            workspace_id=str(user.workspace_id),
        ),
    )


@router.post("/logout", summary="User logout")
def logout(response: Response):
    """Clears authentication session cookie."""
    response.delete_cookie(key="access_token", path="/")
    return {"status": "logged_out"}


@router.get("/me", response_model=UserResponse, summary="Get current user context")
def get_me(current_user: User = Depends(get_current_user)):
    """Returns profile for currently authenticated user."""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        workspace_id=str(current_user.workspace_id),
    )
