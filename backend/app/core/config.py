"""Canon Backend Configuration Module."""

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment or .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ENVIRONMENT: str = Field(default="development")
    LOG_LEVEL: str = Field(default="INFO")

    # Database
    DATABASE_URL: str = Field(default="postgresql://postgres:postgres@localhost:5432/canon")
    DIRECT_URL: str = Field(default="postgresql://postgres:postgres@localhost:5432/canon")

    # Security & JWT
    JWT_SECRET_KEY: str = Field(default="change-me-to-a-secure-random-256-bit-key-in-production")
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=120)
    COOKIE_SECURE: bool = Field(default=False)
    COOKIE_SAMESITE: str = Field(default="lax")

    # LLM Provider
    LLM_PROVIDER: str = Field(default="mock")
    LLM_API_KEY: str = Field(default="")
    GROQ_API_KEY: str = Field(default="")
    LLM_MODEL: str = Field(default="mock-model")

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = Field(
        default=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://canon-web.vercel.app",
        ]
    )

    # Limits
    MAX_UPLOAD_SIZE_BYTES: int = Field(default=15728640)  # 15 MB


settings = Settings()
