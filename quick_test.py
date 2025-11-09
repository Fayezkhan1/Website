import requests

print("Checking if Flask server is running...")
try:
    response = requests.get("http://localhost:5001/api/complaints/", timeout=2)
    print("❌ Server is running but you need to login first")
    print("\n✅ Server is UP and running on http://localhost:5001")
    print("\nNow you can run: python test_workflow.py")
except requests.exceptions.ConnectionError:
    print("❌ Server is NOT running!")
    print("\nPlease start the server first:")
    print("   python run.py")
    print("\nThen in a NEW terminal tab, run:")
    print("   python test_workflow.py")
except Exception as e:
    print(f"Error: {e}")
