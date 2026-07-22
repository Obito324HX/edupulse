from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.course import Course, Department, Enrollment
from app.models.user import User

courses_bp = Blueprint('courses', __name__)

def get_current_user():
    user_id = int(get_jwt_identity())
    return User.query.get(user_id)

def same_institution_or_super(current_user, target_institution_id):
    if current_user.role == 'super_admin':
        return True
    return current_user.institution_id is not None and current_user.institution_id == target_institution_id

@courses_bp.route('/departments', methods=['GET'])
@jwt_required()
def get_departments():
    current_user = get_current_user()
    departments = Department.query.filter_by(institution_id=current_user.institution_id).all()
    return jsonify({'departments': [d.to_dict() for d in departments]}), 200

@courses_bp.route('/departments', methods=['POST'])
@jwt_required()
def create_department():
    current_user = get_current_user()

    if current_user.role not in ['super_admin', 'institution_admin']:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()

    if not data.get('name'):
        return jsonify({'error': 'Department name is required'}), 400

    department = Department(
        name=data['name'],
        institution_id=current_user.institution_id
    )

    db.session.add(department)
    db.session.commit()

    return jsonify({'message': 'Department created successfully', 'department': department.to_dict()}), 201

@courses_bp.route('/', methods=['GET'])
@jwt_required()
def get_courses():
    current_user = get_current_user()

    if current_user.role == 'student':
        enrollments = Enrollment.query.filter_by(student_id=current_user.id).all()
        course_ids = [e.course_id for e in enrollments]
        courses = Course.query.filter(Course.id.in_(course_ids)).all()
    elif current_user.role == 'lecturer':
        courses = Course.query.filter_by(lecturer_id=current_user.id).all()
    else:
        courses = Course.query.filter_by(institution_id=current_user.institution_id).all()

    return jsonify({'courses': [c.to_dict() for c in courses]}), 200

@courses_bp.route('/', methods=['POST'])
@jwt_required()
def create_course():
    current_user = get_current_user()

    if current_user.role not in ['super_admin', 'institution_admin']:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()

    required_fields = ['name', 'code', 'department_id']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    course = Course(
        name=data['name'],
        code=data['code'],
        department_id=data['department_id'],
        institution_id=current_user.institution_id,
        lecturer_id=data.get('lecturer_id'),
        semester=data.get('semester'),
        year=data.get('year')
    )

    db.session.add(course)
    db.session.commit()

    return jsonify({'message': 'Course created successfully', 'course': course.to_dict()}), 201

@courses_bp.route('/<int:course_id>', methods=['PUT'])
@jwt_required()
def update_course(course_id):
    current_user = get_current_user()

    if current_user.role not in ['super_admin', 'institution_admin']:
        return jsonify({'error': 'Unauthorized'}), 403

    course = Course.query.get_or_404(course_id)

    if not same_institution_or_super(current_user, course.institution_id):
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    course.code = data.get('code', course.code)
    course.lecturer_id = data.get('lecturer_id', course.lecturer_id)
    course.semester = data.get('semester', course.semester)
    course.year = data.get('year', course.year)

    db.session.commit()

    return jsonify({'message': 'Course updated successfully', 'course': course.to_dict()}), 200

@courses_bp.route('/<int:course_id>/enroll', methods=['POST'])
@jwt_required()
def enroll_student(course_id):
    current_user = get_current_user()

    if current_user.role not in ['super_admin', 'institution_admin']:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    student_id = data.get('student_id')

    course = Course.query.get_or_404(course_id)
    if not same_institution_or_super(current_user, course.institution_id):
        return jsonify({'error': 'Unauthorized'}), 403

    student = User.query.get_or_404(student_id)
    if student.institution_id != course.institution_id:
        return jsonify({'error': 'Student does not belong to this course\'s institution'}), 400

    existing = Enrollment.query.filter_by(student_id=student_id, course_id=course_id).first()
    if existing:
        return jsonify({'error': 'Student already enrolled'}), 409

    enrollment = Enrollment(student_id=student_id, course_id=course_id)
    db.session.add(enrollment)
    db.session.commit()

    return jsonify({'message': 'Student enrolled successfully', 'enrollment': enrollment.to_dict()}), 201

@courses_bp.route('/<int:course_id>/students', methods=['GET'])
@jwt_required()
def get_course_students(course_id):
    current_user = get_current_user()

    if current_user.role not in ['super_admin', 'institution_admin', 'lecturer']:
        return jsonify({'error': 'Unauthorized'}), 403

    course = Course.query.get_or_404(course_id)
    if not same_institution_or_super(current_user, course.institution_id):
        return jsonify({'error': 'Unauthorized'}), 403

    enrollments = Enrollment.query.filter_by(course_id=course_id).all()
    student_ids = [e.student_id for e in enrollments]
    students = User.query.filter(User.id.in_(student_ids)).all()

    return jsonify({'students': [s.to_dict() for s in students]}), 200
