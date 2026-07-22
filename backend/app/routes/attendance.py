from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.grade import Attendance
from app.models.user import User
from app.models.course import Course
from app.models.alert import Alert, Notification
from datetime import date

attendance_bp = Blueprint('attendance', __name__)

def get_current_user():
    user_id = int(get_jwt_identity())
    return User.query.get(user_id)

def same_institution_or_super(current_user, target_institution_id):
    if current_user.role == 'super_admin':
        return True
    return current_user.institution_id is not None and current_user.institution_id == target_institution_id

def check_attendance_alert(student_id, course_id):
    records = Attendance.query.filter_by(student_id=student_id, course_id=course_id).all()
    if len(records) < 5:
        return

    absences = len([r for r in records if r.status == 'absent'])
    absence_rate = (absences / len(records)) * 100

    existing_alert = Alert.query.filter_by(
        student_id=student_id,
        course_id=course_id,
        alert_type='poor_attendance',
        resolved=False
    ).first()

    if absence_rate > 30 and not existing_alert:
        severity = 'high' if absence_rate > 50 else 'medium'
        alert = Alert(
            student_id=student_id,
            course_id=course_id,
            alert_type='poor_attendance',
            message=f'Student absence rate is {absence_rate:.1f}%. This exceeds the allowed threshold.',
            severity=severity
        )
        db.session.add(alert)

        notification = Notification(
            user_id=student_id,
            title='Attendance Warning',
            message=f'Your absence rate is {absence_rate:.1f}%. Please attend classes regularly.',
            type='alert'
        )
        db.session.add(notification)
        db.session.commit()

@attendance_bp.route('/', methods=['POST'])
@jwt_required()
def mark_attendance():
    current_user = get_current_user()

    if current_user.role not in ['lecturer', 'institution_admin', 'super_admin']:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()

    required_fields = ['student_id', 'course_id', 'status', 'date']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    course = Course.query.get_or_404(data['course_id'])
    student = User.query.get_or_404(data['student_id'])

    if not same_institution_or_super(current_user, course.institution_id):
        return jsonify({'error': 'Unauthorized'}), 403
    if student.institution_id != course.institution_id:
        return jsonify({'error': 'Student does not belong to this course\'s institution'}), 400

    attendance_date = date.fromisoformat(data['date'])

    existing = Attendance.query.filter_by(
        student_id=data['student_id'],
        course_id=data['course_id'],
        date=attendance_date
    ).first()

    if existing:
        existing.status = data['status']
        db.session.commit()
        check_attendance_alert(data['student_id'], data['course_id'])
        return jsonify({'message': 'Attendance updated', 'attendance': existing.to_dict()}), 200

    attendance = Attendance(
        student_id=data['student_id'],
        course_id=data['course_id'],
        date=attendance_date,
        status=data['status'],
        marked_by=current_user.id
    )

    db.session.add(attendance)
    db.session.commit()

    check_attendance_alert(data['student_id'], data['course_id'])

    return jsonify({'message': 'Attendance marked successfully', 'attendance': attendance.to_dict()}), 201

@attendance_bp.route('/student/<int:student_id>', methods=['GET'])
@jwt_required()
def get_student_attendance(student_id):
    current_user = get_current_user()
    student = User.query.get_or_404(student_id)

    if current_user.id != student_id:
        if current_user.role not in ['lecturer', 'institution_admin', 'super_admin']:
            return jsonify({'error': 'Unauthorized'}), 403
        if not same_institution_or_super(current_user, student.institution_id):
            return jsonify({'error': 'Unauthorized'}), 403

    course_id = request.args.get('course_id')

    if course_id:
        records = Attendance.query.filter_by(student_id=student_id, course_id=course_id).all()
    else:
        records = Attendance.query.filter_by(student_id=student_id).all()

    return jsonify({'attendance': [r.to_dict() for r in records]}), 200

@attendance_bp.route('/course/<int:course_id>/summary', methods=['GET'])
@jwt_required()
def get_course_attendance_summary(course_id):
    current_user = get_current_user()

    if current_user.role not in ['lecturer', 'institution_admin', 'super_admin']:
        return jsonify({'error': 'Unauthorized'}), 403

    course = Course.query.get_or_404(course_id)
    if not same_institution_or_super(current_user, course.institution_id):
        return jsonify({'error': 'Unauthorized'}), 403

    records = Attendance.query.filter_by(course_id=course_id).all()

    summary = {}
    for record in records:
        if record.student_id not in summary:
            summary[record.student_id] = {'present': 0, 'absent': 0, 'late': 0, 'total': 0}
        summary[record.student_id][record.status] += 1
        summary[record.student_id]['total'] += 1

    result = []
    for student_id, counts in summary.items():
        attendance_rate = (counts['present'] / counts['total']) * 100 if counts['total'] > 0 else 0
        result.append({
            'student_id': student_id,
            'present': counts['present'],
            'absent': counts['absent'],
            'late': counts['late'],
            'total': counts['total'],
            'attendance_rate': round(attendance_rate, 2)
        })

    return jsonify({'summary': result}), 200
