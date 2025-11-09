from flask import Blueprint, request, jsonify
import jwt
import hashlib
from datetime import datetime, timedelta
from config import Config
from app.database import get_supabase_client

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        required_fields = ['student_id', 'email', 'password', 'name', 'hostel', 'room_number']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        supabase = get_supabase_client()
        
        # Check if user exists
        existing = supabase.table('users').select('*').eq('student_id', data['student_id']).execute()
        if existing.data:
            return jsonify({'error': 'User already exists'}), 409
        
        # Create user
        password_hash = hashlib.sha256(data['password'].encode()).hexdigest()
        user_data = {
            'student_id': data['student_id'],
            'email': data['email'],
            'password_hash': password_hash,
            'name': data['name'],
            'hostel': data['hostel'],
            'room_number': data['room_number'],
            'role': 'resident',
            'created_at': datetime.utcnow().isoformat()
        }
        
        result = supabase.table('users').insert(user_data).execute()
        
        return jsonify({'message': 'User registered successfully', 'user_id': result.data[0]['id']}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data.get('student_id') or not data.get('password'):
        return jsonify({'error': 'Missing credentials'}), 400
    
    supabase = get_supabase_client()
    
    # Find user
    result = supabase.table('users').select('*').eq('student_id', data['student_id']).execute()
    
    if not result.data:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    user = result.data[0]
    
    password_hash = hashlib.sha256(data['password'].encode()).hexdigest()
    if user['password_hash'] != password_hash:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Generate JWT token
    token = jwt.encode({
        'user_id': user['id'],
        'student_id': user['student_id'],
        'role': user['role'],
        'exp': datetime.utcnow() + timedelta(days=7)
    }, Config.JWT_SECRET_KEY, algorithm='HS256')
    
    return jsonify({
        'token': token,
        'user': {
            'id': user['id'],
            'student_id': user['student_id'],
            'name': user['name'],
            'email': user['email'],
            'role': user['role'],
            'hostel': user['hostel'],
            'room_number': user['room_number']
        }
    }), 200
