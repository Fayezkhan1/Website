"""
Test script for worker rating and photo upload API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:5002/api"

def test_worker_endpoints():
    """Test worker photo upload and profile endpoints"""
    print("Testing Worker Rating & Photo Upload API")
    print("=" * 60)
    
    # Note: You'll need a valid worker token to test these endpoints
    # Get a token by logging in as a worker first
    
    print("\n1. Worker Profile Endpoint")
    print("   GET /api/worker/profile")
    print("   Returns: worker profile, ratings, completed tasks")
    
    print("\n2. Upload Progress Photo")
    print("   POST /api/worker/tasks/<id>/upload-progress-photo")
    print("   Body: { photo: 'base64_encoded_image' }")
    print("   Returns: photo_url, updated task")
    
    print("\n3. Upload Completion Photo")
    print("   POST /api/worker/tasks/<id>/upload-completion-photo")
    print("   Body: { photo: 'base64_encoded_image', notes: 'optional' }")
    print("   Returns: photo_url, updated task")
    
    print("\n" + "=" * 60)
    print("\nStudent Rating Endpoint")
    print("=" * 60)
    
    print("\n4. Rate Worker")
    print("   POST /api/complaints/<id>/rate")
    print("   Body: { rating: 1-5, feedback: 'optional text' }")
    print("   Returns: success message")
    
    print("\n" + "=" * 60)
    print("\nAdmin Performance Endpoints")
    print("=" * 60)
    
    print("\n5. Get All Workers Performance")
    print("   GET /api/admin/workers/performance")
    print("   Returns: list of workers with ratings and stats")
    
    print("\n6. Get Worker Details")
    print("   GET /api/admin/workers/<id>/details")
    print("   Returns: detailed worker info, ratings, tasks")
    
    print("\n" + "=" * 60)
    print("\nTo test these endpoints:")
    print("1. Start the Flask backend: python app.py")
    print("2. Login as worker/student/admin to get auth token")
    print("3. Use the token in Authorization header")
    print("4. Make requests using curl or Postman")
    print("\nExample curl command:")
    print('curl -X GET http://localhost:5002/api/worker/profile \\')
    print('  -H "Authorization: Bearer YOUR_TOKEN_HERE"')
    print("=" * 60)

if __name__ == "__main__":
    test_worker_endpoints()
