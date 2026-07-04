from __future__ import annotations
from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, field_validator

DEFAULT_MODULES = ["headers", "info_disclosure", "csrf", "xss", "sqli", "open_redirect"]


# ── Auth ────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def username_min_length(cls, value: str) -> str:
        if len(value.strip()) < 3:
            raise ValueError("El nombre de usuario debe tener al menos 3 caracteres")
        return value.strip()

    @field_validator("password")
    @classmethod
    def password_min_length(cls, value: str) -> str:
        if len(value) < 6:
            raise ValueError("La contraseña debe tener al menos 6 caracteres")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    email: str
    username: str
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── API Keys ─────────────────────────────────────────────────────────────────

class ApiKeyCreate(BaseModel):
    name: str
    scopes: list[str] = DEFAULT_MODULES
    expires_days: int | None = None


class ApiKeyOut(BaseModel):
    id: int
    name: str
    key_prefix: str
    scopes: list[str]
    is_active: bool
    created_at: datetime
    last_used_at: datetime | None
    expires_at: datetime | None

    model_config = {"from_attributes": True}


class ApiKeyCreated(ApiKeyOut):
    raw_key: str


# ── Scanner ──────────────────────────────────────────────────────────────────

class ScanCreate(BaseModel):
    target_url: str
    modules: list[str] = DEFAULT_MODULES
    depth: int = 1
    timeout: int = 10

    @field_validator("timeout")
    @classmethod
    def timeout_range(cls, value: int) -> int:
        return max(5, min(value, 30))

    @field_validator("depth")
    @classmethod
    def depth_range(cls, value: int) -> int:
        return max(1, min(value, 3))


class VulnerabilityOut(BaseModel):
    id: int
    module: str
    severity: str
    title: str
    description: str
    evidence: str | None
    remediation: str
    url: str
    parameter: str | None

    model_config = {"from_attributes": True}


class ScanOut(BaseModel):
    id: int
    target_url: str
    status: str
    modules: list[str]
    depth: int
    timeout: int
    progress: int
    risk_score: int
    ai_summary: str | None
    error_message: str | None
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None
    vulnerabilities: list[VulnerabilityOut] = []

    model_config = {"from_attributes": True}


class ScanSummary(BaseModel):
    id: int
    target_url: str
    status: str
    risk_score: int
    created_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


# ── Antispam ─────────────────────────────────────────────────────────────────

class SpamCheckRequest(BaseModel):
    author: str
    content: str
    client_ip: str | None = None


class SpamCheckResult(BaseModel):
    is_spam: bool
    reason: str | None
    score: int
    detail: str


class SpamLogOut(BaseModel):
    id: int
    user_email: str | None
    author: str
    content: str
    is_spam: bool
    reason: str | None
    score: int
    client_ip: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── IDS ───────────────────────────────────────────────────────────────────────

class IdsAlertOut(BaseModel):
    id: int
    level: str
    type: str
    source_ip: str
    description: str
    timestamp: datetime

    model_config = {"from_attributes": True}


# ── Shield ────────────────────────────────────────────────────────────────────

class ShieldRequest(BaseModel):
    author: str
    content: str
    client_ip: str


class ShieldResponse(BaseModel):
    safe: bool
    verdict: str
    checks: dict[str, Any]


# ── Admin ─────────────────────────────────────────────────────────────────────

class AdminOverview(BaseModel):
    total_users: int
    total_scans: int
    total_ids_alerts: int
    total_spam_logs: int
    spam_blocked_24h: int
    ids_alerts_24h: int
