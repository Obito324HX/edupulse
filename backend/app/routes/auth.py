import socket
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from flask_mail import Message
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from app import db, mail, limiter
from app.models.user import User
from app.models.institution import Institution
from app.models.token_blocklist import TokenBlocklist

auth_bp = Blueprint('auth', __name__)

RESET_TOKEN_SALT = 'password-reset'
RESET_TOKEN_MAX_AGE_SECONDS = 3600  # 1 hour

def _reset_serializer():
    return URLSafeTimedSerializer(current_app.config['SECRET_KEY'])

@auth_bp.route('/register', methods=['POST'])
@limiter.limit('10 per hour')
def register():
    data = request.get_json()

    required_fields = ['first_name', 'last_name', 'email', 'password', 'role', 'join_code']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    # Public self-registration must never be able to grant staff or platform
    # access. Lecturer / institution_admin accounts are created by an
    # already-trusted admin via POST /users/staff (see users.py), and
    # super_admin accounts are never created through a public endpoint.
    SELF_REGISTERABLE_ROLES = {'student', 'parent'}
    if data['role'] not in SELF_REGISTERABLE_ROLES:
        return jsonify({'error': 'This role cannot be self-registered. Contact your institution administrator.'}), 403

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409

    # The institution is resolved server-side from the join code — never
    # trust a client-supplied institution_id directly, or anyone could
    # claim to belong to any school on the platform.
    institution = Institution.query.filter_by(join_code=data['join_code'].strip().upper()).first()
    if not institution:
        return jsonify({'error': 'Invalid join code. Check with your institution for the correct code.'}), 400

    user = User(
        first_name=data['first_name'],
        last_name=data['last_name'],
        email=data['email'],
        role=data['role'],
        institution_id=institution.id,
        phone=data.get('phone')
    )
    user.set_password(data['password'])

    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        'message': 'User created successfully',
        'user': user.to_dict(),
        'access_token': access_token
    }), 201

@auth_bp.route('/login', methods=['POST'])
@limiter.limit('8 per minute')
def login():
    data = request.get_json()

    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=data['email']).first()

    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401

    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 403

    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
        'access_token': access_token
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({'user': user.to_dict()}), 200

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    # Actually revokes the token server-side (adds its jti to the
    # blocklist) instead of just relying on the client to forget it.
    # Without this, a token copied off a stolen/shared device stayed
    # valid for its full 24h lifetime even after the user "logged out".
    jti = get_jwt()['jti']
    db.session.add(TokenBlocklist(jti=jti))
    db.session.commit()
    return jsonify({'message': 'Logged out successfully'}), 200

@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
@limiter.limit('10 per hour')
def change_password():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    data = request.get_json()

    if not user.check_password(data.get('current_password', '')):
        return jsonify({'error': 'Current password is incorrect'}), 400

    user.set_password(data['new_password'])
    db.session.commit()

    return jsonify({'message': 'Password changed successfully'}), 200

@auth_bp.route('/forgot-password', methods=['POST'])
@limiter.limit('5 per hour')
def forgot_password():
    data = request.get_json()
    email = (data or {}).get('email', '').strip().lower()

    # Always return the same generic response whether or not the email
    # exists, so this endpoint can't be used to check which emails are
    # registered on the platform.
    generic_response = jsonify({
        'message': 'If an account with that email exists, a password reset link has been sent.'
    }), 200

    if not email:
        return generic_response

    user = User.query.filter(db.func.lower(User.email) == email).first()
    if not user or not user.is_active:
        return generic_response

    token = _reset_serializer().dumps(user.id, salt=RESET_TOKEN_SALT)
    reset_link = f"{current_app.config['FRONTEND_URL']}/reset-password?token={token}"

    try:
        msg = Message(
            subject='Reset your EduPulse password',
            recipients=[user.email],
            body=(
                f"Hi {user.first_name},\n\n"
                f"We received a request to reset your EduPulse password. "
                f"Click the link below to choose a new one — it expires in 1 hour:\n\n"
                f"{reset_link}\n\n"
                f"If you didn't request this, you can safely ignore this email."
            )
        )
        # flask_mail opens the SMTP connection with smtplib.SMTP(host, port)
        # and passes no timeout at all -- if that connection can't complete
        # (blocked port, unreachable host, slow network) it hangs
        # indefinitely instead of raising an error. That hang used to run
        # past gunicorn's 30s worker timeout and get the entire worker
        # SIGKILLed mid-request, which is why this looked like a random
        # crash instead of a clean, catchable error. Setting a default
        # socket timeout here makes it fail fast (10s) and land in the
        # except below like it always should have.
        previous_timeout = socket.getdefaulttimeout()
        socket.setdefaulttimeout(10)
        try:
            mail.send(msg)
        finally:
            socket.setdefaulttimeout(previous_timeout)
    except Exception:
        # Don't leak SMTP/config errors to the client, and don't let a mail
        # failure reveal whether the account exists either — log it
        # server-side so it shows up in Render's logs for debugging.
        current_app.logger.exception('Failed to send password reset email')

    return generic_response

@auth_bp.route('/reset-password', methods=['POST'])
@limiter.limit('10 per hour')
def reset_password():
    data = request.get_json()
    token = (data or {}).get('token')
    new_password = (data or {}).get('new_password')

    if not token or not new_password:
        return jsonify({'error': 'Token and new_password are required'}), 400

    if len(new_password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400

    try:
        user_id = _reset_serializer().loads(token, salt=RESET_TOKEN_SALT, max_age=RESET_TOKEN_MAX_AGE_SECONDS)
    except SignatureExpired:
        return jsonify({'error': 'This reset link has expired. Request a new one.'}), 400
    except BadSignature:
        return jsonify({'error': 'This reset link is invalid.'}), 400

    user = User.query.get(user_id)
    if not user or not user.is_active:
        return jsonify({'error': 'This reset link is invalid.'}), 400

    user.set_password(new_password)
    db.session.commit()

    return jsonify({'message': 'Password reset successfully. You can now log in.'}), 200
