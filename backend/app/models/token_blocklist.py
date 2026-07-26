from app import db
from datetime import datetime


class TokenBlocklist(db.Model):
    """Revoked JWTs. A row here means that token's jti can no longer be
    used, even though it hasn't expired yet -- this is what makes a real
    /auth/logout possible (previously logout only cleared the token
    client-side; the token itself stayed valid for the rest of its 24h
    life if anyone still had a copy of it)."""
    __tablename__ = 'token_blocklist'

    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False, index=True, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
