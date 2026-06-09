from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User

users_bp = Blueprint('users', __name__)

def get_current_user():
    user_id = get_jwt_identity()
    return User.query.get(user_id)

@users_bp.route('/', methods=['GET'])
@jwt_required()
def get_users():
    current_user = get_current_user()

    if current_user.role == 'super_admin':
        users = User.query.all()
    elif current_user.role in ['institution_admin', 'lecturer']:
        users = User.query.filter_by(institution_id=current_user.institution_id).all()
    else:
        return jsonify({'error': 'Unauthorized'}), 403

    return jsonify({'users': [u.to_dict() for u in users]}), 200

@users_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    current_user = get_current_user()
    user = User.query.get_or_404(user_id)

    if current_user.role not in ['super_admin', 'institution_admin', 'lecturer'] and current_user.id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    return jsonify({'user': user.to_dict()}), 200

@users_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    current_user = get_current_user()
    user = User.query.get_or_404(user_id)

    if current_user.id != user_id and current_user.role not in ['super_admin', 'institution_admin']:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()

    user.first_name = data.get('first_name', user.first_name)
    user.last_name = data.get('last_name', user.last_name)
    user.phone = data.get('phone', user.phone)
    user.profile_picture = data.get('profile_picture', user.profile_picture)

    db.session.commit()

    return jsonify({'message': 'User updated successfully', 'user': user.to_dict()}), 200

@users_bp.route('/<int:user_id>/deactivate', methods=['PUT'])
@jwt_required()
def deactivate_user(user_id):
    current_user = get_current_user()

    if current_user.role not in ['super_admin', 'institution_admin']:
        return jsonify({'error': 'Unauthorized'}), 403

    user = User.query.get_or_404(user_id)
    user.is_active = False
    db.session.commit()

    return jsonify({'message': 'User deactivated successfully'}), 200

@users_bp.route('/students', methods=['GET'])
@jwt_required()
def get_students():
    current_user = get_current_user()

    if current_user.role == 'super_admin':
        students = User.query.filter_by(role='student').all()
    elif current_user.role in ['institution_admin', 'lecturer']:
        students = User.query.filter_by(role='student', institution_id=current_user.institution_id).all()
    else:
        return jsonify({'error': 'Unauthorized'}), 403

    return jsonify({'students': [s.to_dict() for s in students]}), 200
