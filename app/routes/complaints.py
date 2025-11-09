from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from app.database import get_supabase_client
from app.auth_middleware import token_required, role_required

bp = Blueprint('complaints', __name__, url_prefix='/api/complaints')

@bp.route('/', methods=['POST'])
@token_required
@role_required(['resident'])
def create_complaint():
    data = request.get_json()
    
    required_fields = ['title', 'description', 'category', 'location']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    supabase = get_supabase_client()
    
    # Check for emergency keywords
    emergency_keywords = ['fire', 'water leakage', 'short circuit', 'medical emergency', 'urgent', 'emergency']
    is_emergency = any(keyword in data['description'].lower() for keyword in emergency_keywords)
    
    complaint_data = {
        'user_id': request.user['user_id'],
        'title': data['title'],
        'description': data['description'],
        'category': data['category'],
        'location': data['location'],
        'status': 'pending',
        'priority': 'high' if is_emergency else data.get('priority', 'medium'),
        'is_emergency': is_emergency,
        'image_url': data.get('image_url'),
        'upvote_count': 1,  # Start with 1 (the filer)
        'created_at': datetime.utcnow().isoformat()
    }
    
    result = supabase.table('complaints').insert(complaint_data).execute()
    
    return jsonify({
        'message': 'Complaint filed successfully',
        'complaint': result.data[0]
    }), 201

@bp.route('/emergency', methods=['POST'])
@token_required
@role_required(['resident'])
def create_emergency_complaint():
    """Create an emergency complaint that bypasses normal validation"""
    data = request.get_json()
    
    required_fields = ['title', 'description', 'category', 'location']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    supabase = get_supabase_client()
    
    # Get student's hostel for notification routing
    user = supabase.table('users').select('hostel, name').eq('id', request.user['user_id']).execute()
    if not user.data:
        return jsonify({'error': 'User not found'}), 404
    
    student_hostel = user.data[0].get('hostel')
    student_name = user.data[0].get('name')
    
    # Create emergency complaint
    complaint_data = {
        'user_id': request.user['user_id'],
        'title': data['title'],
        'description': data['description'],
        'category': data['category'],
        'location': data['location'],
        'status': 'emergency',
        'is_emergency': True,
        'image_url': data.get('image_url'),
        'created_at': datetime.utcnow().isoformat()
    }
    
    result = supabase.table('complaints').insert(complaint_data).execute()
    
    if not result.data:
        return jsonify({'error': 'Failed to create emergency complaint'}), 500
    
    complaint = result.data[0]
    complaint_id = complaint['id']
    
    # Find warden for this hostel
    warden = supabase.table('users').select('id').eq('role', 'admin').ilike('name', '%Warden%').eq('hostel', student_hostel).execute()
    
    # Find validator for this hostel
    validator = supabase.table('users').select('id').eq('role', 'admin').ilike('name', '%Validator%').eq('hostel', student_hostel).execute()
    
    # Create notifications
    notifications = []
    
    if warden.data:
        notifications.append({
            'user_id': warden.data[0]['id'],
            'complaint_id': complaint_id,
            'message': f'🚨 EMERGENCY: {data["title"]} in {data["location"]} by {student_name}',
            'is_read': False,
            'created_at': datetime.utcnow().isoformat()
        })
    
    if validator.data:
        notifications.append({
            'user_id': validator.data[0]['id'],
            'complaint_id': complaint_id,
            'message': f'🚨 EMERGENCY (FYI): {data["title"]} in {data["location"]} by {student_name}',
            'is_read': False,
            'created_at': datetime.utcnow().isoformat()
        })
    
    if notifications:
        supabase.table('notifications').insert(notifications).execute()
    
    return jsonify({
        'message': 'Emergency complaint submitted successfully',
        'complaint': complaint
    }), 201

@bp.route('/', methods=['GET'])
@token_required
def get_complaints():
    supabase = get_supabase_client()
    
    if request.user['role'] == 'resident':
        # Residents see only their complaints
        result = supabase.table('complaints').select('*').eq('user_id', request.user['user_id']).order('created_at', desc=True).execute()
    else:
        # Admin and workers see all complaints
        result = supabase.table('complaints').select('*').order('created_at', desc=True).execute()
    
    return jsonify({'complaints': result.data}), 200

@bp.route('/<complaint_id>', methods=['GET'])
@token_required
def get_complaint(complaint_id):
    supabase = get_supabase_client()
    
    result = supabase.table('complaints').select('*').eq('id', complaint_id).execute()
    
    if not result.data:
        return jsonify({'error': 'Complaint not found'}), 404
    
    complaint = result.data[0]
    
    # Check permissions
    if request.user['role'] == 'resident' and complaint['user_id'] != request.user['user_id']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    return jsonify({'complaint': complaint}), 200

@bp.route('/<complaint_id>/status', methods=['PATCH'])
@token_required
def update_status(complaint_id):
    data = request.get_json()
    
    if 'status' not in data:
        return jsonify({'error': 'Status is required'}), 400
    
    supabase = get_supabase_client()
    
    update_data = {
        'status': data['status'],
        'updated_at': datetime.utcnow().isoformat()
    }
    
    result = supabase.table('complaints').update(update_data).eq('id', complaint_id).execute()
    
    if not result.data:
        return jsonify({'error': 'Complaint not found'}), 404
    
    return jsonify({'message': 'Status updated', 'complaint': result.data[0]}), 200

@bp.route('/by-location', methods=['POST'])
@token_required
def get_complaints_by_location():
    """Get existing complaints in the same hostel"""
    data = request.get_json()
    hostel = data.get('location')  # This will be the hostel name
    
    if not hostel:
        return jsonify({'error': 'Hostel is required'}), 400
    
    supabase = get_supabase_client()
    user_id = request.user['user_id']
    
    # Get complaints from same hostel with pending/in_progress status
    # Search for complaints where location starts with the hostel name
    complaints_result = supabase.table('complaints').select('*').ilike('location', f'{hostel}%').in_('status', ['pending', 'validated', 'assigned', 'in_progress']).order('upvote_count', desc=True).execute()
    
    # Check which complaints the user has already upvoted
    upvoted_result = supabase.table('complaint_upvotes').select('complaint_id').eq('user_id', user_id).execute()
    upvoted_ids = [item['complaint_id'] for item in upvoted_result.data]
    
    # Add upvoted flag and ensure upvote_count starts at 1
    for complaint in complaints_result.data:
        complaint['user_upvoted'] = complaint['id'] in upvoted_ids
        # Ensure upvote_count is at least 1 (the original filer)
        if complaint.get('upvote_count', 0) < 1:
            complaint['upvote_count'] = 1
    
    return jsonify({'complaints': complaints_result.data}), 200

@bp.route('/<complaint_id>/upvote', methods=['POST'])
@token_required
@role_required(['resident'])
def upvote_complaint(complaint_id):
    """Upvote a complaint (Me too!)"""
    supabase = get_supabase_client()
    user_id = request.user['user_id']
    
    # Check if user already upvoted
    existing = supabase.table('complaint_upvotes').select('*').eq('complaint_id', complaint_id).eq('user_id', user_id).execute()
    
    if existing.data:
        return jsonify({'error': 'Already upvoted'}), 400
    
    # Add upvote
    upvote_data = {
        'complaint_id': complaint_id,
        'user_id': user_id,
        'created_at': datetime.utcnow().isoformat()
    }
    
    supabase.table('complaint_upvotes').insert(upvote_data).execute()
    
    # Increment upvote count (ensure it starts from 1)
    complaint = supabase.table('complaints').select('upvote_count').eq('id', complaint_id).execute()
    current_count = complaint.data[0].get('upvote_count', 0) if complaint.data else 0
    new_count = max(current_count + 1, 1)  # Ensure at least 1
    
    supabase.table('complaints').update({'upvote_count': new_count}).eq('id', complaint_id).execute()
    
    return jsonify({'message': 'Upvoted successfully', 'upvote_count': new_count}), 200

@bp.route('/<complaint_id>/remove-upvote', methods=['POST'])
@token_required
@role_required(['resident'])
def remove_upvote(complaint_id):
    """Remove upvote from a complaint"""
    supabase = get_supabase_client()
    user_id = request.user['user_id']
    
    # Check if user has upvoted
    existing = supabase.table('complaint_upvotes').select('*').eq('complaint_id', complaint_id).eq('user_id', user_id).execute()
    
    if not existing.data:
        return jsonify({'error': 'You have not upvoted this complaint'}), 400
    
    # Remove upvote
    supabase.table('complaint_upvotes').delete().eq('complaint_id', complaint_id).eq('user_id', user_id).execute()
    
    # Decrement upvote count (but keep at least 1 for the original filer)
    complaint = supabase.table('complaints').select('upvote_count').eq('id', complaint_id).execute()
    current_count = complaint.data[0].get('upvote_count', 1) if complaint.data else 1
    new_count = max(current_count - 1, 1)  # Never go below 1
    
    supabase.table('complaints').update({'upvote_count': new_count}).eq('id', complaint_id).execute()
    
    return jsonify({'message': 'Upvote removed successfully', 'upvote_count': new_count}), 200

@bp.route('/<complaint_id>/rate', methods=['POST'])
@token_required
@role_required(['resident'])
def rate_worker(complaint_id):
    """Rate a worker after task completion"""
    data = request.get_json()
    
    if 'rating' not in data or not (1 <= data['rating'] <= 5):
        return jsonify({'error': 'Rating must be between 1 and 5'}), 400
    
    supabase = get_supabase_client()
    user_id = request.user['user_id']
    
    # Get complaint details
    complaint = supabase.table('complaints').select('*').eq('id', complaint_id).execute()
    
    if not complaint.data:
        return jsonify({'error': 'Complaint not found'}), 404
    
    complaint_data = complaint.data[0]
    
    # Verify complaint belongs to user
    if complaint_data['user_id'] != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Verify complaint is completed
    if complaint_data['status'] != 'completed':
        return jsonify({'error': 'Can only rate completed tasks'}), 400
    
    # Check if already rated
    if complaint_data.get('worker_rating'):
        return jsonify({'error': 'Already rated'}), 400
    
    worker_id = complaint_data.get('assigned_to')
    if not worker_id:
        return jsonify({'error': 'No worker assigned'}), 400
    
    rating = data['rating']
    feedback = data.get('feedback', '')
    
    try:
        # Add rating to complaint
        supabase.table('complaints').update({
            'worker_rating': rating,
            'rated_by': user_id,
            'rated_at': datetime.utcnow().isoformat()
        }).eq('id', complaint_id).execute()
        
        # Add to worker_ratings table
        rating_data = {
            'worker_id': worker_id,
            'complaint_id': complaint_id,
            'rated_by': user_id,
            'rating': rating,
            'feedback': feedback,
            'created_at': datetime.utcnow().isoformat()
        }
        supabase.table('worker_ratings').insert(rating_data).execute()
        
        # Update worker's average rating
        all_ratings = supabase.table('worker_ratings').select('rating').eq('worker_id', worker_id).execute()
        
        if all_ratings.data:
            total_ratings = len(all_ratings.data)
            avg_rating = sum(r['rating'] for r in all_ratings.data) / total_ratings
            
            supabase.table('users').update({
                'average_rating': round(avg_rating, 2),
                'total_ratings': total_ratings
            }).eq('id', worker_id).execute()
        
        return jsonify({
            'message': 'Rating submitted successfully',
            'rating': rating
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to submit rating: {str(e)}'}), 500
