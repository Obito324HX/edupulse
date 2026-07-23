from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.institution import Institution, generate_join_code
from app.models.user import User
from app.models.course import Course
from app.models.grade import Grade, Attendance
from app.models.alert import Alert

institutions_bp = Blueprint('institutions', __name__)

def get_current_user():
    user_id = int(get_jwt_identity())
    return User.query.get(user_id)

def can_see_join_code(current_user, institution_id):
    if current_user.role == 'super_admin':
        return True
    return current_user.role == 'institution_admin' and current_user.institution_id == institution_id

def _compute_pulse(institution_id=None):
    """A single 0-100 'pulse' score: half attendance rate, half average
    grade, minus a penalty for unresolved alerts (5 points each, capped
    at 40). institution_id=None scopes across every institution, for
    super_admin's network-wide view.
    """
    grade_q = Grade.query
    attendance_q = Attendance.query
    alert_q = Alert.query.filter_by(resolved=False)

    if institution_id is not None:
        grade_q = grade_q.join(Course, Grade.course_id == Course.id).filter(Course.institution_id == institution_id)
        attendance_q = attendance_q.join(Course, Attendance.course_id == Course.id).filter(Course.institution_id == institution_id)
        alert_q = alert_q.join(User, Alert.student_id == User.id).filter(User.institution_id == institution_id)

    grades = grade_q.all()
    attendance_records = attendance_q.all()
    unresolved_alerts = alert_q.count()

    grade_average = round(sum(g.percentage() for g in grades) / len(grades), 1) if grades else None
    present = len([a for a in attendance_records if a.status == 'present'])
    attendance_rate = round((present / len(attendance_records)) * 100, 1) if attendance_records else None

    # If there's genuinely no data yet (a brand new institution), don't
    # pretend to have a score -- let the frontend show an empty state
    # instead of a misleading 0 or 100.
    if grade_average is None and attendance_rate is None:
        return {'pulse': None, 'grade_average': None, 'attendance_rate': None, 'unresolved_alerts': unresolved_alerts}

    components = [c for c in [grade_average, attendance_rate] if c is not None]
    base = sum(components) / len(components)
    penalty = min(unresolved_alerts * 5, 40)
    pulse = max(0, min(100, round(base - penalty)))

    return {
        'pulse': pulse,
        'grade_average': grade_average,
        'attendance_rate': attendance_rate,
        'unresolved_alerts': unresolved_alerts
    }

@institutions_bp.route('/pulse', methods=['GET'])
@jwt_required()
def get_pulse():
    current_user = get_current_user()
    if current_user.role not in ['institution_admin', 'super_admin']:
        return jsonify({'error': 'Unauthorized'}), 403

    # super_admin has no institution_id -- that's what makes this the
    # network-wide score instead of a single school's.
    scope_id = None if current_user.role == 'super_admin' else current_user.institution_id
    return jsonify(_compute_pulse(scope_id)), 200

@institutions_bp.route('/', methods=['GET'])
@jwt_required()
def get_institutions():
    current_user = get_current_user()

    if current_user.role != 'super_admin':
        return jsonify({'error': 'Unauthorized'}), 403

    institutions = Institution.query.all()
    return jsonify({'institutions': [i.to_dict(include_join_code=True) for i in institutions]}), 200

@institutions_bp.route('/<int:institution_id>', methods=['GET'])
@jwt_required()
def get_institution(institution_id):
    current_user = get_current_user()

    if current_user.role != 'super_admin' and current_user.institution_id != institution_id:
        return jsonify({'error': 'Unauthorized'}), 403

    institution = Institution.query.get_or_404(institution_id)
    return jsonify({'institution': institution.to_dict(include_join_code=can_see_join_code(current_user, institution_id))}), 200

@institutions_bp.route('/lookup/<string:code>', methods=['GET'])
def lookup_institution_by_code(code):
    """Public, unauthenticated: lets the registration form show 'Joining:
    <School Name>' before the user submits, without exposing anything
    beyond the name for a valid code."""
    institution = Institution.query.filter_by(join_code=code.upper()).first()
    if not institution:
        return jsonify({'error': 'Invalid join code'}), 404
    return jsonify({'institution': {'id': institution.id, 'name': institution.name}}), 200

@institutions_bp.route('/', methods=['POST'])
@jwt_required()
def create_institution():
    current_user = get_current_user()

    if current_user.role != 'super_admin':
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()

    required_fields = ['name', 'email']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    if Institution.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Institution with this email already exists'}), 409

    institution = Institution(
        name=data['name'],
        email=data['email'],
        location=data.get('location'),
        phone=data.get('phone'),
        subscription_status='trial'
    )

    db.session.add(institution)
    db.session.commit()

    return jsonify({'message': 'Institution created successfully', 'institution': institution.to_dict(include_join_code=True)}), 201

@institutions_bp.route('/<int:institution_id>/regenerate-code', methods=['POST'])
@jwt_required()
def regenerate_join_code(institution_id):
    current_user = get_current_user()

    if not can_see_join_code(current_user, institution_id):
        return jsonify({'error': 'Unauthorized'}), 403

    institution = Institution.query.get_or_404(institution_id)

    new_code = generate_join_code()
    while Institution.query.filter_by(join_code=new_code).first():
        new_code = generate_join_code()
    institution.join_code = new_code

    db.session.commit()

    return jsonify({'message': 'Join code regenerated', 'join_code': institution.join_code}), 200

@institutions_bp.route('/<int:institution_id>', methods=['PUT'])
@jwt_required()
def update_institution(institution_id):
    current_user = get_current_user()

    if current_user.role not in ['super_admin', 'institution_admin']:
        return jsonify({'error': 'Unauthorized'}), 403
    if current_user.role != 'super_admin' and current_user.institution_id != institution_id:
        return jsonify({'error': 'Unauthorized'}), 403

    institution = Institution.query.get_or_404(institution_id)
    data = request.get_json()

    institution.name = data.get('name', institution.name)
    institution.location = data.get('location', institution.location)
    institution.phone = data.get('phone', institution.phone)
    institution.logo = data.get('logo', institution.logo)

    threshold_fields = [
        'grade_alert_threshold', 'grade_alert_severe_threshold',
        'absence_alert_threshold', 'absence_alert_severe_threshold'
    ]
    for field in threshold_fields:
        if field in data:
            value = data[field]
            if not isinstance(value, int) or not (0 <= value <= 100):
                return jsonify({'error': f'{field} must be a whole number between 0 and 100'}), 400
            setattr(institution, field, value)

    if current_user.role == 'super_admin':
        institution.subscription_status = data.get('subscription_status', institution.subscription_status)

    db.session.commit()

    return jsonify({'message': 'Institution updated successfully', 'institution': institution.to_dict()}), 200

@institutions_bp.route('/<int:institution_id>/stats', methods=['GET'])
@jwt_required()
def get_institution_stats(institution_id):
    current_user = get_current_user()

    if current_user.role != 'super_admin' and current_user.institution_id != institution_id:
        return jsonify({'error': 'Unauthorized'}), 403

    total_students = User.query.filter_by(institution_id=institution_id, role='student').count()
    total_lecturers = User.query.filter_by(institution_id=institution_id, role='lecturer').count()

    return jsonify({
        'stats': {
            'total_students': total_students,
            'total_lecturers': total_lecturers,
        }
    }), 200
