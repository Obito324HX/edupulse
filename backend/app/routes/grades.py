from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.grade import Grade
from app.models.user import User
from app.models.course import Enrollment
from app.models.alert import Alert, Notification
from sqlalchemy import func

grades_bp = Blueprint('grades', __name__)

def get_current_user():
    user_id = get_jwt_identity()
    return User.query.get(user_id)

def check_and_create_alert(student_id, course_id):
    grades = Grade.query.filter_by(student_id=student_id, course_id=course_id).all()
    if not grades:
        return

    avg = sum(g.percentage() for g in grades) / len(grades)

    existing_alert = Alert.query.filter_by(
        student_id=student_id,
        course_id=course_id,
        resolved=False
    ).first()

    if avg < 50 and not existing_alert:
        severity = 'high' if avg < 40 else 'medium'
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

    if current_user.id != student_id and current_user.role not in ['lecturer', 'institution_admin', 'super_admin']:
        return jsonify({'error': 'Unauthorized'}), 403

    grades = Grade.query.filter_by(student_id=student_id).all()
    return jsonify({'grades': [g.to_dict() for g in grades]}), 200

@grades_bp.route('/course/<int:course_id>', methods=['GET'])
@jwt_required()
def get_course_grades(course_id):
    current_user = get_current_user()

    if current_user.role not in ['lecturer', 'institution_admin', 'super_admin']:
        return jsonify({'error': 'Unauthorized'}), 403

    grades = Grade.query.filter_by(course_id=course_id).all()
    return jsonify({'grades': [g.to_dict() for g in grades]}), 200

@grades_bp.route('/student/<int:student_id>/summary', methods=['GET'])
@jwt_required()
def get_student_summary(student_id):
    current_user = get_current_user()

    if current_user.id != student_id and current_user.role not in ['lecturer', 'institution_admin', 'super_admin']:
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
    data = request.get_json()

    grade.score = data.get('score', grade.score)
    grade.max_score = data.get('max_score', grade.max_score)
    grade.comment = data.get('comment', grade.comment)

    db.session.commit()

    check_and_create_alert(grade.student_id, grade.course_id)

    return jsonify({'message': 'Grade updated successfully', 'grade': grade.to_dict()}), 200
