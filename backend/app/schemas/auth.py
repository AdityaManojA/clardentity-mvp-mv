import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    display_name: str | None = None
    # The tick on the sign-up form. Required: an account cannot be created
    # without it, and the version accepted is stored on the row so the record
    # says what was agreed to rather than merely that something was.
    accepted_terms: bool = False


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)


class RefreshRequest(BaseModel):
    refresh_token: str


class GoogleOAuthRequest(BaseModel):
    id_token: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    # Matches RegisterRequest: bcrypt silently truncates past 72 bytes, so a
    # longer password would appear to be accepted and then not work.
    password: str = Field(min_length=8, max_length=72)


class UserPublic(BaseModel):
    id: uuid.UUID
    email: str
    display_name: str | None
    # None until the first-run welcome questions are answered or skipped; the
    # client routes a signed-in user with None through them before the app.
    onboarding_completed_at: datetime | None = None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AuthResponse(TokenResponse):
    user: UserPublic
