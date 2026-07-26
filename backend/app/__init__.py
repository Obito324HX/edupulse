import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_mail import Mail
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from config import config

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
mail = Mail()

# Rate limiter -- protects /login, /register, and password-reset requests
# from brute-force / spam. Storage defaults to in-memory, which is fine for
# a single-process dev server or a single Render worker, but does NOT share
# state across multiple gunicorn workers or dynos. If you scale past one
# worker, set RATELIMIT_STORAGE_URI to a shared Redis instance or these
# limits will only apply per-process, not globally.
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=os.environ.get('RATELIMIT_STORAGE_URI', 'memory://'),
    default_limits=[],
)


def create_app(config_name='default'):
    app = Flask(__name__)
    selected_config = config[config_name]
    if hasattr(selected_config, 'validate'):
        selected_config.validate()
    app.config.from_object(selected_config)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    mail.init_app(app)
    limiter.init_app(app)

    # Locked to the actual frontend origin(s) instead of "*". Set
    # CORS_ORIGINS (comma-separated) in production if you add more
    # frontends (a custom domain alongside the Vercel one, for example).
    allowed_origins = [o.strip() for o in os.environ.get(
        'CORS_ORIGINS',
        f"{app.config['FRONTEND_URL']},http://localhost:5173,http://127.0.0.1:5173"
    ).split(',') if o.strip()]
    CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

    @app.after_request
    def set_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        # This is a JSON API, not a page that renders HTML/scripts -- deny
        # everything by default so a token-stealing script has nowhere to
        # execute even if some future endpoint accidentally reflects input.
        response.headers['Content-Security-Policy'] = "default-src 'none'; frame-ancestors 'none'"
        if not app.debug:
            response.headers['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains'
        return response

    from app.models.token_blocklist import TokenBlocklist

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        jti = jwt_payload['jti']
        return db.session.query(TokenBlocklist.id).filter_by(jti=jti).first() is not None

    from app.routes.auth import auth_bp
    from app.routes.users import users_bp
    from app.routes.institutions import institutions_bp
    from app.routes.courses import courses_bp
    from app.routes.grades import grades_bp
    from app.routes.attendance import attendance_bp
    from app.routes.alerts import alerts_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(institutions_bp, url_prefix='/api/institutions')
    app.register_blueprint(courses_bp, url_prefix='/api/courses')
    app.register_blueprint(grades_bp, url_prefix='/api/grades')
    app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
    app.register_blueprint(alerts_bp, url_prefix='/api/alerts')

    return app
