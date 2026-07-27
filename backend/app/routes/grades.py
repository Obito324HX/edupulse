from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.grade import Grade
from app.models.user import User
from app.models.course import Course, Enrollment
from app.models.alert import Alert, Notification
from sqlalchemy import func

grades_bp = Blueprint('grades', __name__)

def get_current_user():
    user_id = int(get_jwt_identity())
    return User.query.get(user_id)

def same_institution_or_super(current_user, target_institution_id):
    if current_user.role == 'super_admin':
        return True
    return current_user.institution_id is not None and current_user.institution_id == target_institution_id

def check_and_create_alert(student_id, course_id):
    grades = Grade.query.filter_by(student_id=student_id, course_id=course_id).all()
    if not grades:
        return

    course = Course.query.get(course_id)
    institution = course.institution if course else None
    threshold = institution.grade_alert_threshold if institution else 50
    severe_threshold = institution.grade_alert_severe_threshold if institution else 40

    avg = sum(g.percentage() for g in grades) / len(grades)

    existing_alert = Alert.query.filter_by(
        student_id=student_id,
        course_id=course_id,
        alert_type='low_grade',
        resolved=False
    ).first()

    if avg < threshold:
        severity = 'high' if avg < severe_threshold else 'medium'

        if not existing_alert:
            alert = Alert(
                student_id=student_id,
                course_id=course_id,
                alert_type='low_grade',
                message=f'Student average has dropped to {avg:.1f}%. Immediate attention required.',
                severity=severity
            )
            db.session.add(alert)

            notification = Notification(
                user_id=student_id,
                title='Academic Alert',
                message=f'Your average in this course is {avg:.1f}%. Please seek help immediately.',
                type='alert'
            )
            db.session.add(notification)
            db.session.commit()
        elif severity == 'high' and existing_alert.severity != 'high':
            # Student was already flagged but has since worsened past the
            # severe threshold. Escalate the existing alert rather than
            # leaving it stuck at its original (now stale) severity.
            existing_alert.severity = 'high'
            existing_alert.message = f'Student average has dropped further to {avg:.1f}%. Immediate attention required.'

            notification = Notification(
                user_id=student_id,
                title='Academic Alert',
                message=f'Your average in this course has dropped further to {avg:.1f}%. Please seek help immediately.',
                type='alert'
            )
            db.session.add(notification)
            db.session.commit()

@grades_bp.route('/', methods=['POST'])
@jwt_required()
def add_grade():
    current_user = get_current_user()

    if current_user.role not in ['lecturer', 'institution_admin', 'super_admin']:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()

    required_fields = ['student_id', 'course_id', 'assignment_name', 'score', 'max_score', 'type']
    for field in required_fields:
        if data.get(field) is None:
            return jsonify({'error': f'{field} is required'}), 400

    course = Course.query.get_or_404(data['course_id'])
    student = User.query.get_or_404(data['student_id'])

    if not same_institution_or_super(current_user, course.institution_id):
        return jsonify({'error': 'Unauthorized'}), 403
    if student.institution_id != course.institution_id:
        return jsonify({'error': 'Student does not belong to this course\'s institution'}), 400

    grade = Grade(
        student_id=data['student_id'],
        course_id=data['course_id'],
        assignment_name=data['assignment_name'],
        score=data['score'],
        max_score=data['max_score'],
        type=data['type'],
        entered_by=current_user.id,
        comment=data.get('comment')
    )

    db.session.add(grade)
    db.session.commit()

    check_and_create_alert(data['student_id'], data['course_id'])

    return jsonify({'message': 'Grade added successfully', 'grade': grade.to_dict()}), 201

@grades_bp.route('/student/<int:student_id>', methods=['GET'])
@jwt_required()
def get_student_grades(student_id):
    current_user = get_current_user()
    student = User.query.get_or_404(student_id)

    if current_user.id != student_id:
        if current_user.role not in ['lecturer', 'institution_admin', 'super_admin']:
            return jsonify({'error': 'Unauthorized'}), 403
        if not same_institution_or_super(current_user, student.institution_id):
            return jsonify({'error': 'Unauthorized'}), 403

    grades = Grade.query.filter_by(student_id=student_id).all()
    return jsonify({'grades': [g.to_dict() for g in grades]}), 200

@grades_bp.route('/course/<int:course_id>', methods=['GET'])
@jwt_required()
def get_course_grades(course_id):
    current_user = get_current_user()

    if current_user.role not in ['lecturer', 'institution_admin', 'super_admin']:
        return jsonify({'error': 'Unauthorized'}), 403

    course = Course.query.get_or_404(course_id)
    if not same_institution_or_super(current_user, course.institution_id):
        return jsonify({'error': 'Unauthorized'}), 403

    grades = Grade.query.filter_by(course_id=course_id).all()
    return jsonify({'grades': [g.to_dict() for g in grades]}), 200

@grades_bp.route('/student/<int:student_id>/summary', methods=['GET'])
@jwt_required()
def get_student_summary(student_id):
    current_user = get_current_user()
    student = User.query.get_or_404(student_id)

    if current_user.id != student_id:
        if current_user.role not in ['lecturer', 'institution_admin', 'super_admin']:
            return jsonify({'error': 'Unauthorized'}), 403
        if not same_institution_or_super(current_user, student.institution_id):
            return jsonify({'error': 'Unauthorized'}), 403

    enrollments = Enrollment.query.filter_by(student_id=student_id).all()
    summary = []

    for enrollment in enrollments:
        grades = Grade.query.filter_by(student_id=student_id, course_id=enrollment.course_id).all()
        if grades:
            avg = sum(g.percentage() for g in grades) / len(grades)
            status = 'good' if avg >= 70 else 'average' if avg >= 50 else 'at_risk'
        else:
            avg = None
            status = 'no_grades'

        summary.append({
            'course_id': enrollment.course_id,
            'average': round(avg, 2) if avg is not None else None,
            'status': status,
            'total_grades': len(grades)
        })

    return jsonify({'summary': summary}), 200

@grades_bp.route('/<int:grade_id>', methods=['PUT'])
@jwt_required()
def update_grade(grade_id):
    current_user = get_current_user()

    if current_user.role not in ['lecturer', 'institution_admin', 'super_admin']:
        return jsonify({'error': 'Unauthorized'}), 403

    grade = Grade.query.get_or_404(grade_id)
    course = Course.query.get_or_404(grade.course_id)

    if not same_institution_or_super(current_user, course.institution_id):
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()

    grade.score = data.get('score', grade.score)
    grade.max_score = data.get('max_score', grade.max_score)
    grade.comment = data.get('comment', grade.comment)

    db.session.commit()

    check_and_create_alert(grade.student_id, grade.course_id)

    return jsonify({'message': 'Grade updated successfully', 'grade': grade.to_dict()}), 200
