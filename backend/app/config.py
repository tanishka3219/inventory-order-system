import os
from pydantic import BaseModel

class Settings(BaseModel):
    # Database connection string
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/inventory_db"
    )

    # Secret key for JWT or session security
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "supersecretkeychangeinproduction123"
    )

    # Token expiration time (minutes)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    )

    # CORS origins (frontend domains allowed to call backend)
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")

settings = Settings()
