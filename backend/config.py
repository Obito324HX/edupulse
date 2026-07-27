import os
from datetime import timedelta

class Config:
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    # Render blocks raw outbound SMTP on free instances (confirmed: gmail
    # SMTP connections fail at the TCP layer with "Network is unreachable"
    # before ever reaching login), so email goes out over Resend's HTTPS
    # API instead of smtplib. RESEND_FROM_EMAIL defaults to Resend's shared
    # test sender, which only delivers to the email address on your own
    # Resend account -- once you own a domain, verify it in Resend and set
    # RESEND_FROM_EMAIL to something like "no-reply@yourdomain.com" to send
    # to real users.
    RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
    RESEND_FROM_EMAIL = os.environ.get('RESEND_FROM_EMAIL') or 'EduPulse <onboarding@resend.dev>'
    # Used to build the link inside password reset emails. Defaults to the
    # live deployment so this works out of the box on Render; override
    # locally if you're testing against a dev frontend.
    FRONTEND_URL = os.environ.get('FRONTEND_URL') or 'https://edupulse-one.vercel.app'

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
