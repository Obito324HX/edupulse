from app import db
from datetime import datetime

class Institution(db.Model):
    __tablename__ = 'institutions'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(100), nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    logo = db.Column(db.String(256), nullable=True)
    subscription_status = db.Column(db.String(20), default='trial')  # trial, active, suspended, expired
    subscription_end = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    users = db.relationship('User', backref='institution', lazy=True)
    departments = db.relationship('Department', backref='institution', lazy=True)
    courses = db.relationship('Course', backref='institution', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'location': self.location,
            'email': self.email,
            'phone': self.phone,
            'logo': self.logo,
            'subscription_status': self.subscription_status,
            'subscription_end': self.subscription_end.isoformat() if self.subscription_end else None,
            'created_at': self.created_at.isoformat()
        }
