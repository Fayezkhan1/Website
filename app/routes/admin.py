from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from app.database import get_supabase_client
from app.auth_middleware import token_required, role_required

bp = Blueprint('admin', __name__, url_prefix='/api/admin')

def log_complaint_action(supabase, complaint_id, action, performed_by, from_status, to_status, notes=None):
    """Helper function to log complaint actions"""
    try:
        history_data = {
            'complaint_id': complaint_id,
            'action': action,
            'performed_by': performed_by,
            'from_status': from_status,
            'to_status': to_status,
            'notes': notes,
            'created_at': datetime.utcnow().isoformat()
        }
        supabase.table('complaint_history').insert(history_data).execute()
    except Exception as e:
        # Log to console but don't fail the operation if history table doesn't exist
        print(f"Warning: Could not log complaint action: {e}")

def check_complaint_frequency(supabase, category, location):
    """Check frequency of similar complaints"""
    # Get complaints from last 7 days with same category and location
    seven_days_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
    result = supabase.table('complaints').select('id').eq('category', category).eq('location', location).gte('created_at', seven_days_ago).execute()
    return len(result.data) if result.data else 0

@bp.route('/complaints', methods=['GET'])
@token_required
@role_required(['admin'])
def get_all_complaints():
    supabase = get_supabase_client()
    
    # Get user's admin role - workaround for schema cache issue
    user = supabase.table('users').select('name').eq('id', request.user['user_id']).execute()
    user_name = user.data[0]['name'] if user.data else ''
    
    # Determine admin_role from name (temporary workaround)
    admin_role = None
    if 'Validator' in user_name:
        admin_role = 'validator'
    elif 'Supervisor' in user_name:
        admin_role = 'supervisor'
    elif 'Warden' in user_name:
        admin_role = 'warden'
    elif 'Dean' in user_name:
        admin_role = 'dean'
    
    # Filter options
    status = request.args.get('status')
    category = request.args.get('category')
    priority = request.args.get('priority')
    
    # Get ALL emergency complaints (both active and resolved) - visible to all admins
    emergency_query = supabase.table('complaints').select('*').eq('is_emergency', True)
    emergency_result = emergency_query.order('created_at', desc=True).execute()
    emergency_complaints = emergency_result.data if emergency_result.data else []
    
    # Get regular complaints based on role
    query = supabase.table('complaints').select('*').eq('is_emergency', False)
    
    # Role-based filtering for non-emergency complaints
    if admin_role == 'validator':
        # Validators see pending complaints
        query = query.eq('status', 'pending')
    elif admin_role == 'supervisor':
        # Supervisors see validated and assigned complaints
        query = query.in_('status', ['validated', 'assigned'])
    elif admin_role in ['dean', 'warden']:
        # Deans and wardens see escalated complaints
        if not status:
            query = query.eq('status', 'escalated')
    
    if status:
        query = query.eq('status', status)
    if category:
        query = query.eq('category', category)
    if priority:
        query = query.eq('priority', priority)
    
    result = query.order('created_at', desc=True).execute()
    regular_complaints = result.data if result.data else []
    
    # Combine: emergencies first, then regular complaints
    all_complaints = emergency_complaints + regular_complaints
    
    # Add student information to each complaint
    for complaint in all_complaints:
        if complaint.get('user_id'):
            try:
                user_info = supabase.table('users').select('name, student_id, email').eq('id', complaint['user_id']).execute()
                if user_info.data:
                    complaint['student_name'] = user_info.data[0].get('name', 'Unknown')
                    complaint['student_id'] = user_info.data[0].get('student_id', 'N/A')
                    complaint['student_email'] = user_info.data[0].get('email', 'N/A')
            except Exception as e:
                print(f"Error fetching user info: {e}")
                complaint['student_name'] = 'Unknown'
                complaint['student_id'] = 'N/A'
    
    return jsonify({'complaints': all_complaints, 'admin_role': admin_role}), 200

@bp.route('/complaints/<complaint_id>/validate', methods=['POST'])
@token_required
@role_required(['admin'])
def validate_complaint(complaint_id):
    """Validator validates and prioritizes complaint"""
    data = request.get_json()
    supabase = get_supabase_client()
    
    # Check user is validator - workaround for schema cache issue
    user = supabase.table('users').select('name').eq('id', request.user['user_id']).execute()
    user_name = user.data[0]['name'] if user.data else ''
    if 'Validator' not in user_name:
        return jsonify({'error': 'Only validators can validate complaints'}), 403
    
    # Get complaint
    complaint = supabase.table('complaints').select('*').eq('id', complaint_id).execute()
    if not complaint.data:
        return jsonify({'error': 'Complaint not found'}), 404
    
    complaint_data = complaint.data[0]
    
    # Check frequency
    frequency = check_complaint_frequency(supabase, complaint_data['category'], complaint_data['location'])
    
    # Auto-escalate if high frequency (more than 3 similar complaints in 7 days)
    if frequency > 3:
        priority = 'high'
    else:
        priority = data.get('priority', complaint_data['priority'])
    
    # Update to 'validated' status
    update_data = {
        'status': 'validated',
        'priority': priority,
        'validated_by': request.user['user_id'],
        'validated_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat()
    }
    
    result = supabase.table('complaints').update(update_data).eq('id', complaint_id).execute()
    
    # Log the validation
    log_complaint_action(
        supabase,
        complaint_id,
        'validated',
        request.user['user_id'],
        complaint_data['status'],
        'validated',
        f'Validated with priority: {priority}'
    )
    
    return jsonify({'message': 'Complaint validated', 'complaint': result.data[0]}), 200

@bp.route('/complaints/<complaint_id>/assign', methods=['POST'])
@token_required
@role_required(['admin'])
def assign_complaint(complaint_id):
    """Supervisor assigns complaint to worker with deadline"""
    data = request.get_json()
    supabase = get_supabase_client()
    
    # Check user is supervisor - workaround for schema cache issue
    user = supabase.table('users').select('name').eq('id', request.user['user_id']).execute()
    user_name = user.data[0]['name'] if user.data else ''
    if 'Supervisor' not in user_name:
        return jsonify({'error': 'Only supervisors can assign complaints'}), 403
    
    if 'worker_id' not in data:
        return jsonify({'error': 'Worker ID is required'}), 400
    
    # Verify worker exists
    worker = supabase.table('users').select('*').eq('id', data['worker_id']).eq('role', 'worker').execute()
    if not worker.data:
        return jsonify({'error': 'Worker not found'}), 404
    
    # Get complaint
    complaint = supabase.table('complaints').select('*').eq('id', complaint_id).execute()
    if not complaint.data:
        return jsonify({'error': 'Complaint not found'}), 404
    
    complaint_data = complaint.data[0]
    
    # Set deadline (default 2 days) - Note: deadline column exists but schema cache issue
    # Deadline is stored in database but not updated here due to Supabase schema cache
    try:
        deadline_days = int(data.get('deadline_days', 2))
    except (ValueError, TypeError):
        deadline_days = 2
    # deadline = (datetime.utcnow() + timedelta(days=deadline_days)).isoformat()
    
    # Update without deadline to avoid schema cache issues
    update_data = {
        'assigned_to': data['worker_id'],
        'status': 'assigned',
        'updated_at': datetime.utcnow().isoformat()
    }
    
    result = supabase.table('complaints').update(update_data).eq('id', complaint_id).execute()
    
    return jsonify({'message': 'Complaint assigned successfully', 'complaint': result.data[0]}), 200

@bp.route('/complaints/<complaint_id>/verify', methods=['POST'])
@token_required
@role_required(['admin'])
def verify_complaint(complaint_id):
    data = request.get_json()
    
    if 'approved' not in data:
        return jsonify({'error': 'Approval status is required'}), 400
    
    supabase = get_supabase_client()
    
    update_data = {
        'status': 'resolved' if data['approved'] else 'in_progress',
        'verified_by': request.user['user_id'],
        'verification_notes': data.get('notes'),
        'updated_at': datetime.utcnow().isoformat()
    }
    
    result = supabase.table('complaints').update(update_data).eq('id', complaint_id).execute()
    
    if not result.data:
        return jsonify({'error': 'Complaint not found'}), 404
    
    return jsonify({'message': 'Verification completed', 'complaint': result.data[0]}), 200

@bp.route('/workers', methods=['GET'])
@token_required
@role_required(['admin'])
def get_workers():
    supabase = get_supabase_client()
    
    result = supabase.table('users').select('id, name, email, student_id').eq('role', 'worker').execute()
    
    return jsonify({'workers': result.data}), 200

@bp.route('/stats', methods=['GET'])
@token_required
@role_required(['admin'])
def get_stats():
    supabase = get_supabase_client()
    
    # Get complaint statistics
    all_complaints = supabase.table('complaints').select('status, priority').execute()
    
    stats = {
        'total': len(all_complaints.data),
        'pending': len([c for c in all_complaints.data if c['status'] == 'pending']),
        'in_progress': len([c for c in all_complaints.data if c['status'] == 'in_progress']),
        'resolved': len([c for c in all_complaints.data if c['status'] == 'resolved']),
        'high_priority': len([c for c in all_complaints.data if c['priority'] == 'high'])
    }
    
    return jsonify({'stats': stats}), 200


@bp.route('/complaints/check-escalations', methods=['POST'])
@token_required
@role_required(['admin'])
def check_escalations():
    """Check and escalate overdue complaints (run periodically)"""
    supabase = get_supabase_client()
    
    # Get complaints past deadline
    now = datetime.utcnow().isoformat()
    overdue = supabase.table('complaints').select('*').in_('status', ['assigned', 'in_progress']).lt('deadline', now).execute()
    
    escalated_count = 0
    for complaint in overdue.data:
        # Escalate to warden
        update_data = {
            'status': 'escalated',
            'escalated_to': 'warden',
            'escalated_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        supabase.table('complaints').update(update_data).eq('id', complaint['id']).execute()
        
        # Log escalation
        log_complaint_action(supabase, complaint['id'], 'escalated', None,
                            complaint['status'], 'escalated',
                            'Automatically escalated due to missed deadline')
        
        escalated_count += 1
    
    return jsonify({'message': f'Escalated {escalated_count} complaints', 'count': escalated_count}), 200

@bp.route('/complaints/check-unassigned', methods=['POST'])
@token_required
@role_required(['admin'])
def check_unassigned_complaints():
    """Check for validated complaints not assigned within 2 minutes and escalate to warden (TESTING: 2 minutes instead of 2 days)"""
    supabase = get_supabase_client()
    
    # Calculate the cutoff time (2 minutes ago for testing - change to days=2 for production)
    two_minutes_ago = (datetime.utcnow() - timedelta(minutes=2)).isoformat()
    
    # Get validated complaints older than 2 minutes that haven't been escalated
    unassigned = supabase.table('complaints').select('*').eq('status', 'validated').lt('validated_at', two_minutes_ago).is_('escalated_at', 'null').execute()
    
    escalated_count = 0
    escalated_complaints = []
    
    for complaint in (unassigned.data or []):
        # Skip if already escalated
        if complaint.get('escalated_at'):
            continue
            
        # Escalate to warden
        update_data = {
            'status': 'escalated',
            'escalated_to': 'warden',
            'escalated_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        result = supabase.table('complaints').update(update_data).eq('id', complaint['id']).execute()
        
        # Log escalation
        log_complaint_action(
            supabase, 
            complaint['id'], 
            'auto_escalated_unassigned', 
            None,
            'validated', 
            'escalated',
            'Automatically escalated to warden - not assigned within 2 minutes (TESTING MODE)'
        )
        
        # Create notification for warden
        # Get wardens
        wardens = supabase.table('users').select('id').eq('role', 'admin').execute()
        for warden in (wardens.data or []):
            warden_user = supabase.table('users').select('name').eq('id', warden['id']).execute()
            if warden_user.data and 'Warden' in warden_user.data[0].get('name', ''):
                notification_data = {
                    'user_id': warden['id'],
                    'complaint_id': complaint['id'],
                    'message': f'Complaint "{complaint["title"]}" escalated - not assigned within 2 minutes (TESTING)',
                    'is_read': False,
                    'created_at': datetime.utcnow().isoformat()
                }
                supabase.table('notifications').insert(notification_data).execute()
        
        escalated_count += 1
        escalated_complaints.append({
            'id': complaint['id'],
            'title': complaint['title'],
            'validated_at': complaint.get('validated_at')
        })
    
    return jsonify({
        'message': f'Escalated {escalated_count} unassigned complaints to warden',
        'count': escalated_count,
        'complaints': escalated_complaints
    }), 200

@bp.route('/complaints/<complaint_id>/escalate', methods=['POST'])
@token_required
@role_required(['admin'])
def manual_escalate(complaint_id):
    """Manually escalate complaint to higher authority"""
    data = request.get_json()
    supabase = get_supabase_client()
    
    escalate_to = data.get('escalate_to', 'warden')  # dean or warden
    
    if escalate_to not in ['dean', 'warden']:
        return jsonify({'error': 'Invalid escalation target'}), 400
    
    complaint = supabase.table('complaints').select('*').eq('id', complaint_id).execute()
    if not complaint.data:
        return jsonify({'error': 'Complaint not found'}), 404
    
    complaint_data = complaint.data[0]
    
    update_data = {
        'status': 'escalated',
        'escalated_to': escalate_to,
        'escalated_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat()
    }
    
    result = supabase.table('complaints').update(update_data).eq('id', complaint_id).execute()
    
    # Log action
    log_complaint_action(supabase, complaint_id, 'escalated', request.user['user_id'],
                        complaint_data['status'], 'escalated',
                        f"Manually escalated to {escalate_to}")
    
    return jsonify({'message': f'Complaint escalated to {escalate_to}', 'complaint': result.data[0]}), 200

@bp.route('/complaints/<complaint_id>/history', methods=['GET'])
@token_required
@role_required(['admin'])
def get_complaint_history(complaint_id):
    """Get complaint action history"""
    supabase = get_supabase_client()
    
    result = supabase.table('complaint_history').select('*').eq('complaint_id', complaint_id).order('created_at', desc=True).execute()
    
    return jsonify({'history': result.data}), 200

@bp.route('/dashboard', methods=['GET'])
@token_required
@role_required(['admin'])
def admin_dashboard():
    """Get dashboard stats based on admin role"""
    supabase = get_supabase_client()
    
    # Get user's admin role - workaround for schema cache issue
    user = supabase.table('users').select('name').eq('id', request.user['user_id']).execute()
    user_name = user.data[0]['name'] if user.data else ''
    
    # Determine admin_role from name (temporary workaround)
    admin_role = None
    if 'Validator' in user_name:
        admin_role = 'validator'
    elif 'Supervisor' in user_name:
        admin_role = 'supervisor'
    elif 'Warden' in user_name:
        admin_role = 'warden'
    elif 'Dean' in user_name:
        admin_role = 'dean'
    
    stats = {}
    
    if admin_role == 'validator':
        pending = supabase.table('complaints').select('id').eq('status', 'pending').execute()
        stats = {
            'pending_validation': len(pending.data) if pending.data else 0,
            'role': 'validator'
        }
    elif admin_role == 'supervisor':
        in_progress = supabase.table('complaints').select('id').eq('status', 'in_progress').execute()
        assigned = supabase.table('complaints').select('id').eq('status', 'assigned').execute()
        stats = {
            'pending_assignment': len(in_progress.data) if in_progress.data else 0,
            'assigned': len(assigned.data) if assigned.data else 0,
            'role': 'supervisor'
        }
    elif admin_role in ['dean', 'warden']:
        escalated = supabase.table('complaints').select('id').eq('status', 'escalated').execute()
        stats = {
            'escalated_complaints': len(escalated.data) if escalated.data else 0,
            'role': admin_role
        }
    
    return jsonify({'stats': stats}), 200

@bp.route('/workers/performance', methods=['GET'])
@token_required
@role_required(['admin'])
def get_worker_performance():
    """Get all workers with their ratings and performance metrics"""
    supabase = get_supabase_client()
    
    # Get all workers with their stats
    workers = supabase.table('users').select('*').eq('role', 'worker').order('average_rating', desc=True).execute()
    
    worker_data = []
    for worker in workers.data:
        # Get assigned tasks
        assigned = supabase.table('complaints').select('id').eq('assigned_to', worker['id']).execute()
        
        # Get completed tasks
        completed = supabase.table('complaints').select('id').eq('assigned_to', worker['id']).eq('status', 'completed').execute()
        
        # Get in progress tasks
        in_progress = supabase.table('complaints').select('id').eq('assigned_to', worker['id']).eq('status', 'in_progress').execute()
        
        # Get recent ratings
        recent_ratings = supabase.table('worker_ratings').select('*').eq('worker_id', worker['id']).order('created_at', desc=True).limit(5).execute()
        
        worker_data.append({
            'id': worker['id'],
            'name': worker['name'],
            'email': worker['email'],
            'student_id': worker.get('student_id'),
            'average_rating': worker.get('average_rating', 0),
            'total_ratings': worker.get('total_ratings', 0),
            'completed_tasks': worker.get('completed_tasks', 0),
            'assigned_tasks': len(assigned.data) if assigned.data else 0,
            'in_progress_tasks': len(in_progress.data) if in_progress.data else 0,
            'recent_ratings': recent_ratings.data if recent_ratings.data else []
        })
    
    return jsonify({'workers': worker_data}), 200

@bp.route('/workers/<worker_id>/details', methods=['GET'])
@token_required
@role_required(['admin'])
def get_worker_details(worker_id):
    """Get detailed information about a specific worker"""
    supabase = get_supabase_client()
    
    # Get worker info
    worker = supabase.table('users').select('*').eq('id', worker_id).eq('role', 'worker').execute()
    
    if not worker.data:
        return jsonify({'error': 'Worker not found'}), 404
    
    # Get all ratings
    ratings = supabase.table('worker_ratings').select('*').eq('worker_id', worker_id).order('created_at', desc=True).execute()
    
    # Get all tasks
    tasks = supabase.table('complaints').select('*').eq('assigned_to', worker_id).order('created_at', desc=True).execute()
    
    # Calculate stats
    completed_tasks = [t for t in tasks.data if t['status'] == 'completed']
    in_progress_tasks = [t for t in tasks.data if t['status'] == 'in_progress']
    assigned_tasks = [t for t in tasks.data if t['status'] == 'assigned']
    
    return jsonify({
        'worker': worker.data[0],
        'ratings': ratings.data,
        'tasks': tasks.data,
        'stats': {
            'total_assigned': len(tasks.data),
            'completed': len(completed_tasks),
            'in_progress': len(in_progress_tasks),
            'pending': len(assigned_tasks)
        }
    }), 200

@bp.route('/complaints/emergency', methods=['GET'])
@token_required
@role_required(['admin'])
def get_emergency_complaints():
    """Get emergency complaints for warden or validator"""
    supabase = get_supabase_client()
    
    # Get user's admin role
    user = supabase.table('users').select('name, hostel').eq('id', request.user['user_id']).execute()
    user_name = user.data[0]['name'] if user.data else ''
    user_hostel = user.data[0].get('hostel') if user.data else None
    
    # Determine admin_role from name
    admin_role = None
    if 'Validator' in user_name:
        admin_role = 'validator'
    elif 'Warden' in user_name:
        admin_role = 'warden'
    elif 'Dean' in user_name:
        admin_role = 'dean'
    
    if admin_role not in ['warden', 'validator', 'dean']:
        return jsonify({'error': 'Only wardens and validators can view emergency complaints'}), 403
    
    # Get filter parameters
    status_filter = request.args.get('status')  # 'emergency' or 'resolved'
    hostel_filter = request.args.get('hostel')
    
    # Build query - get all emergency complaints first
    query = supabase.table('complaints').select('*').eq('is_emergency', True)
    
    # Apply status filter
    if status_filter:
        query = query.eq('status', status_filter)
    
    # Order by created_at descending
    result = query.order('created_at', desc=True).execute()
    
    # Get user details and filter by hostel
    complaints = []
    for complaint in result.data:
        # Get student details
        user_result = supabase.table('users').select('name, student_id, hostel, room_number').eq('id', complaint['user_id']).execute()
        
        if user_result.data:
            student_data = user_result.data[0]
            student_hostel = student_data.get('hostel', '')
            
            # Filter by hostel if needed
            if user_hostel and student_hostel != user_hostel:
                continue
            
            if hostel_filter and student_hostel != hostel_filter:
                continue
            
            complaint['student_name'] = student_data.get('name', 'Unknown')
            complaint['student_id'] = student_data.get('student_id', '')
            complaint['hostel'] = student_hostel
            complaint['room_number'] = student_data.get('room_number', '')
            complaints.append(complaint)
    
    return jsonify({
        'complaints': complaints,
        'admin_role': admin_role
    }), 200

@bp.route('/complaints/<complaint_id>/resolve-emergency', methods=['POST'])
@token_required
@role_required(['admin'])
def resolve_emergency_complaint(complaint_id):
    """Any admin can resolve an emergency complaint"""
    data = request.get_json()
    supabase = get_supabase_client()
    
    # Get complaint
    complaint = supabase.table('complaints').select('*').eq('id', complaint_id).execute()
    if not complaint.data:
        return jsonify({'error': 'Emergency complaint not found'}), 404
    
    complaint_data = complaint.data[0]
    
    # Verify it's an emergency complaint
    if not complaint_data.get('is_emergency'):
        return jsonify({'error': 'This complaint is not an emergency type'}), 400
    
    # Check if already resolved
    if complaint_data['status'] == 'resolved':
        return jsonify({'error': 'This emergency complaint has already been resolved'}), 400
    
    # Update complaint to resolved
    update_data = {
        'status': 'resolved',
        'resolved_by': request.user['user_id'],
        'resolved_at': datetime.utcnow().isoformat(),
        'resolution_notes': data.get('resolution_notes', ''),
        'updated_at': datetime.utcnow().isoformat()
    }
    
    result = supabase.table('complaints').update(update_data).eq('id', complaint_id).execute()
    
    if not result.data:
        return jsonify({'error': 'Failed to resolve emergency complaint'}), 500
    
    # Create notification for student
    notification_data = {
        'user_id': complaint_data['user_id'],
        'complaint_id': complaint_id,
        'message': f'Your emergency complaint "{complaint_data["title"]}" has been resolved',
        'is_read': False,
        'created_at': datetime.utcnow().isoformat()
    }
    
    supabase.table('notifications').insert(notification_data).execute()
    
    # Log action
    log_complaint_action(supabase, complaint_id, 'emergency_resolved', request.user['user_id'],
                        'emergency', 'resolved',
                        data.get('resolution_notes', 'Emergency resolved by warden'))
    
    return jsonify({
        'message': 'Emergency complaint resolved successfully',
        'complaint': result.data[0]
    }), 200
