"""Pydantic schemas for authentication and user identity."""

from pydantic import BaseModel, ConfigDict, EmailStr


class LoginRequest(BaseModel):
    """User login request payload."""

    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Authenticated user profile representation."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    role: str
    workspace_id: str


class LoginResponse(BaseModel):
    """Successful login response containing access token and user metadata."""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse
