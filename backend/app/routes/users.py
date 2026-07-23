from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.institution import Institution

users_bp = Blueprint('users', __name__)

def get_current_user():
    user_id = int(get_jwt_identity())
    return User.query.get(user_id)

def same_institution_or_super(current_user, target_institution_id):
    """True if current_user may act on a record belonging to target_institution_id:
    super_admin can act on anything, everyone else only within their own institution."""
    if current_user.role == 'super_admin':
        return True
    return current_user.institution_id is not None and current_user.institution_id == target_institution_id

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

    if current_user.id == user_id:
        return jsonify({'user': user.to_dict()}), 200

    if current_user.role not in ['super_admin', 'institution_admin', 'lecturer']:
        return jsonify({'error': 'Unauthorized'}), 403

    if not same_institution_or_super(current_user, user.institution_id):
        return jsonify({'error': 'Unauthorized'}), 403

    return jsonify({'user': user.to_dict()}), 200

@users_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    current_user = get_current_user()
    user = User.query.get_or_404(user_id)

    if current_user.id != user_id:
        if current_user.role not in ['super_admin', 'institution_admin']:
            return jsonify({'error': 'Unauthorized'}), 403
        if not same_institution_or_super(current_user, user.institution_id):
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

    if not same_institution_or_super(current_user, user.institution_id):
        return jsonify({'error': 'Unauthorized'}), 403

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

@users_bp.route('/staff', methods=['POST'])
@jwt_required()
def create_staff():
    """Admin-only staff account creation. This is the replacement for letting
    /auth/register hand out lecturer/institution_admin roles to anyone who asks."""
    current_user = get_current_user()

    if current_user.role not in ['super_admin', 'institution_admin']:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()

    required_fields = ['first_name', 'last_name', 'email', 'password', 'role']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    role = data['role']
    allowed_roles = {'lecturer', 'institution_admin'}
    if role not in allowed_roles:
        return jsonify({'error': f'role must be one of {sorted(allowed_roles)}'}), 400

    if current_user.role == 'institution_admin':
        # institution_admins may only create staff within their own institution
        institution_id = current_user.institution_id
    else:
        institution_id = data.get('institution_id')
        try:
            institution_id = int(institution_id) if institution_id is not None else None
        except (TypeError, ValueError):
            institution_id = None
        if not institution_id or not Institution.query.get(institution_id):
            return jsonify({'error': 'A valid institution_id is required'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409

    user = User(
        first_name=data['first_name'],
        last_name=data['last_name'],
        email=data['email'],
        role=role,
        institution_id=institution_id,
        phone=data.get('phone')
    )
    user.set_password(data['password'])

    db.session.add(user)
    db.session.commit()

    return jsonify({'message': 'Staff account created successfully', 'user': user.to_dict()}), 201
