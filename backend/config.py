import os
from datetime import timedelta

class Config:
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    MAIL_SERVER = os.environ.get('MAIL_SERVER') or 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')

class DevelopmentConfig(Config):
    DEBUG = True
    # Fallback values are fine here — this only runs on a developer's own
    # machine, never on a server anyone else can reach.
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-only-secret-key'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'dev-only-jwt-secret'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///edupulse_dev.db'

class ProductionConfig(Config):
    DEBUG = False
    # No fallback here on purpose. This repo is public, so any hardcoded
    # value here would be a published secret — anyone could forge a valid
    # login token for any user without ever having a password.
    SECRET_KEY = os.environ.get('SECRET_KEY')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')

    @staticmethod
    def validate():
        """Called from create_app() only when ProductionConfig is actually
        selected, so importing this module for local dev never requires
        these to be set. Fails loudly at startup rather than running with
        a missing/blank secret."""
        missing = [k for k in ('SECRET_KEY', 'JWT_SECRET_KEY', 'DATABASE_URL')
                   if not os.environ.get(k)]
        if missing:
            raise RuntimeError(
                f"Missing required environment variable(s) for production: {', '.join(missing)}. "
                f"Set these in your hosting platform's environment settings — see backend/.env.example."
            )

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
