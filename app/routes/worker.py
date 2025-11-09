from flask import Blueprint, request, jsonify
from datetime import datetime
from app.database import get_supabase_client
from app.auth_middleware import token_required, role_required
import base64
import uuid

bp = Blueprint('worker', __name__, url_prefix='/api/worker')

@bp.route('/tasks', methods=['GET'])
@token_required
@role_required(['worker'])
def get_tasks():
    supabase = get_supabase_client()
    
    # Get complaints assigned to this worker
    result = supabase.table('complaints').select('*').eq('assigned_to', request.user['user_id']).order('created_at', desc=True).execute()
    
    return jsonify({'tasks': result.data}), 200

@bp.route('/tasks/<complaint_id>/update', methods=['PATCH'])
@token_required
@role_required(['worker'])
def update_task(complaint_id):
    data = request.get_json()
    
    supabase = get_supabase_client()
    
    # Verify task is assigned to this worker
    complaint = supabase.table('complaints').select('*').eq('id', complaint_id).execute()
    
    if not complaint.data:
        return jsonify({'error': 'Task not found'}), 404
    
    if complaint.data[0]['assigned_to'] != request.user['user_id']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    update_data = {
        'updated_at': datetime.utcnow().isoformat()
    }
    
    if 'status' in data:
        update_data['status'] = data['status']
    
    if 'notes' in data:
        update_data['worker_notes'] = data['notes']
    
    result = supabase.table('complaints').update(update_data).eq('id', complaint_id).execute()
    
    return jsonify({'message': 'Task updated', 'task': result.data[0]}), 200

@bp.route('/tasks/<complaint_id>/upload-progress-photo', methods=['POST'])
@token_required
@role_required(['worker'])
def upload_progress_photo(complaint_id):
    data = request.get_json()
    
    if not data.get('photo'):
        return jsonify({'error': 'No photo provided'}), 400
    
    supabase = get_supabase_client()
    
    # Verify task is assigned to this worker
    complaint = supabase.table('complaints').select('*').eq('id', complaint_id).execute()
    
    if not complaint.data:
        return jsonify({'error': 'Task not found'}), 404
    
    if complaint.data[0]['assigned_to'] != request.user['user_id']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        # Try to upload to Supabase Storage first
        photo_url = data['photo']  # Default to base64 data URL
        
        try:
            photo_data = data['photo'].split(',')[1] if ',' in data['photo'] else data['photo']
            photo_bytes = base64.b64decode(photo_data)
            
            file_name = f"progress_{complaint_id}_{uuid.uuid4()}.jpg"
            bucket_name = "complaint-photos"
            
            # Upload to storage
            supabase.storage.from_(bucket_name).upload(file_name, photo_bytes, {
                "content-type": "image/jpeg"
            })
            
            # Get public URL
            photo_url = supabase.storage.from_(bucket_name).get_public_url(file_name)
        except Exception as storage_error:
            # If storage fails, store base64 directly in database
            print(f"Storage upload failed, using base64: {storage_error}")
            photo_url = data['photo']
        
        # Update complaint with progress photo
        update_data = {
            'progress_photo_url': photo_url,
            'status': 'in_progress',
            'updated_at': datetime.utcnow().isoformat()
        }
        
        result = supabase.table('complaints').update(update_data).eq('id', complaint_id).execute()
        
        return jsonify({
            'message': 'Progress photo uploaded',
            'photo_url': photo_url,
            'task': result.data[0]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to upload photo: {str(e)}'}), 500

@bp.route('/tasks/<complaint_id>/upload-completion-photo', methods=['POST'])
@token_required
@role_required(['worker'])
def upload_completion_photo(complaint_id):
    data = request.get_json()
    
    if not data.get('photo'):
        return jsonify({'error': 'No photo provided'}), 400
    
    supabase = get_supabase_client()
    
    # Verify task is assigned to this worker
    complaint = supabase.table('complaints').select('*').eq('id', complaint_id).execute()
    
    if not complaint.data:
        return jsonify({'error': 'Task not found'}), 404
    
    if complaint.data[0]['assigned_to'] != request.user['user_id']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        # Try to upload to Supabase Storage first
        photo_url = data['photo']  # Default to base64 data URL
        
        try:
            photo_data = data['photo'].split(',')[1] if ',' in data['photo'] else data['photo']
            photo_bytes = base64.b64decode(photo_data)
            
            file_name = f"completion_{complaint_id}_{uuid.uuid4()}.jpg"
            bucket_name = "complaint-photos"
            
            # Upload to storage
            supabase.storage.from_(bucket_name).upload(file_name, photo_bytes, {
                "content-type": "image/jpeg"
            })
            
            # Get public URL
            photo_url = supabase.storage.from_(bucket_name).get_public_url(file_name)
        except Exception as storage_error:
            # If storage fails, store base64 directly in database
            print(f"Storage upload failed, using base64: {storage_error}")
            photo_url = data['photo']
        
        # Update complaint with completion photo and mark as completed
        update_data = {
            'completion_photo_url': photo_url,
            'status': 'completed',
            'completed_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        if data.get('notes'):
            update_data['completion_notes'] = data['notes']
        
        result = supabase.table('complaints').update(update_data).eq('id', complaint_id).execute()
        
        # Update worker's completed tasks count
        worker_id = request.user['user_id']
        worker = supabase.table('users').select('completed_tasks').eq('id', worker_id).execute()
        if worker.data:
            new_count = (worker.data[0].get('completed_tasks') or 0) + 1
            supabase.table('users').update({'completed_tasks': new_count}).eq('id', worker_id).execute()
        
        return jsonify({
            'message': 'Task completed with photo',
            'photo_url': photo_url,
            'task': result.data[0]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to upload photo: {str(e)}'}), 500

@bp.route('/tasks/<complaint_id>/complete', methods=['POST'])
@token_required
@role_required(['worker'])
def complete_task(complaint_id):
    data = request.get_json()
    
    supabase = get_supabase_client()
    
    # Verify task is assigned to this worker
    complaint = supabase.table('complaints').select('*').eq('id', complaint_id).execute()
    
    if not complaint.data:
        return jsonify({'error': 'Task not found'}), 404
    
    if complaint.data[0]['assigned_to'] != request.user['user_id']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    update_data = {
        'status': 'completed',
        'completed_at': datetime.utcnow().isoformat(),
        'proof_of_work': data.get('proof_of_work'),
        'completion_notes': data.get('notes'),
        'updated_at': datetime.utcnow().isoformat()
    }
    
    result = supabase.table('complaints').update(update_data).eq('id', complaint_id).execute()
    
    return jsonify({'message': 'Task marked as completed', 'task': result.data[0]}), 200

@bp.route('/profile', methods=['GET'])
@token_required
@role_required(['worker'])
def get_worker_profile():
    supabase = get_supabase_client()
    worker_id = request.user['user_id']
    
    # Get worker details
    worker = supabase.table('users').select('*').eq('id', worker_id).execute()
    
    if not worker.data:
        return jsonify({'error': 'Worker not found'}), 404
    
    # Get rating history
    ratings = supabase.table('worker_ratings').select('*').eq('worker_id', worker_id).order('created_at', desc=True).execute()
    
    # Get completed tasks
    completed = supabase.table('complaints').select('*').eq('assigned_to', worker_id).eq('status', 'completed').execute()
    
    return jsonify({
        'profile': worker.data[0],
        'ratings': ratings.data,
        'completed_tasks': completed.data
    }), 200
