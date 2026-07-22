from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_mail import Mail
from config import config

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
mail = Mail()

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
    CORS(app, resources={r"/api/*": {"origins": "*"}})

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
