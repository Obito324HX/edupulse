from app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # super_admin, institution_admin, lecturer, student, parent
    institution_id = db.Column(db.Integer, db.ForeignKey('institutions.id'), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    profile_picture = db.Column(db.String(256), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    grades = db.relationship('Grade', foreign_keys='Grade.student_id', backref='student', lazy=True)
    attendance = db.relationship('Attendance', foreign_keys='Attendance.student_id', backref='student', lazy=True)
    alerts = db.relationship('Alert', foreign_keys='Alert.student_id', backref='student', lazy=True)
    notifications = db.relationship('Notification', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'email': self.email,
            'role': self.role,
            'institution_id': self.institution_id,
            'is_active': self.is_active,
            'profile_picture': self.profile_picture,
            'phone': self.phone,
            'created_at': self.created_at.isoformat()
        }
