from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.alert import Alert, Notification
from app.models.user import User
from datetime import datetime

alerts_bp = Blueprint('alerts', __name__)

def get_current_user():
    user_id = int(get_jwt_identity())
    return User.query.get(user_id)

@alerts_bp.route('/', methods=['GET'])
@jwt_required()
def get_alerts():
    current_user = get_current_user()

    if current_user.role == 'student':
        alerts = Alert.query.filter_by(student_id=current_user.id).all()
    elif current_user.role in ['lecturer', 'institution_admin', 'super_admin']:
        alerts = Alert.query.join(User, Alert.student_id == User.id).filter(
            User.institution_id == current_user.institution_id
        ).all()
    else:
        return jsonify({'error': 'Unauthorized'}), 403

    return jsonify({'alerts': [a.to_dict() for a in alerts]}), 200

@alerts_bp.route('/<int:alert_id>/resolve', methods=['PUT'])
@jwt_required()
def resolve_alert(alert_id):
    current_user = get_current_user()

    if current_user.role not in ['lecturer', 'institution_admin', 'super_admin']:
        return jsonify({'error': 'Unauthorized'}), 403

    alert = Alert.query.get_or_404(alert_id)
    alert.resolved = True
    alert.resolved_by = current_user.id
    alert.resolved_at = datetime.utcnow()

    db.session.commit()

    return jsonify({'message': 'Alert resolved successfully', 'alert': alert.to_dict()}), 200

@alerts_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    current_user = get_current_user()
    notifications = Notification.query.filter_by(user_id=current_user.id).order_by(
        Notification.created_at.desc()
    ).all()

    return jsonify({'notifications': [n.to_dict() for n in notifications]}), 200

@alerts_bp.route('/notifications/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(notification_id):
    current_user = get_current_user()
    notification = Notification.query.get_or_404(notification_id)

    if notification.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    notification.read = True
    db.session.commit()

    return jsonify({'message': 'Notification marked as read'}), 200

@alerts_bp.route('/notifications/read-all', methods=['PUT'])
@jwt_required()
def mark_all_read():
    current_user = get_current_user()
    Notification.query.filter_by(user_id=current_user.id, read=False).update({'read': True})
    db.session.commit()

    return jsonify({'message': 'All notifications marked as read'}), 200

@alerts_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_alert_stats():
    current_user = get_current_user()

    if current_user.role not in ['institution_admin', 'super_admin']:
        return jsonify({'error': 'Unauthorized'}), 403

    total_alerts = Alert.query.join(User, Alert.student_id == User.id).filter(
        User.institution_id == current_user.institution_id
    ).count()

    unresolved_alerts = Alert.query.join(User, Alert.student_id == User.id).filter(
        User.institution_id == current_user.institution_id,
        Alert.resolved == False
    ).count()

    high_severity = Alert.query.join(User, Alert.student_id == User.id).filter(
        User.institution_id == current_user.institution_id,
        Alert.severity == 'high',
        Alert.resolved == False
    ).count()

    return jsonify({
        'stats': {
            'total_alerts': total_alerts,
            'unresolved_alerts': unresolved_alerts,
            'high_severity': high_severity
        }
    }), 200
