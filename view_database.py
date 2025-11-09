"""
View database content from command line
"""
from supabase import create_client
import os
from dotenv import load_dotenv
from tabulate import tabulate

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def view_users():
    """View all users"""
    print("\n" + "=" * 100)
    print("USERS")
    print("=" * 100)
    
    result = supabase.table('users').select('id, name, email, role, student_id, average_rating, total_ratings, completed_tasks').execute()
    
    if result.data:
        headers = ['Name', 'Email', 'Role', 'Student ID', 'Avg Rating', 'Total Ratings', 'Completed']
        rows = []
        for user in result.data:
            rows.append([
                user.get('name', '')[:30],
                user.get('email', '')[:30],
                user.get('role', ''),
                user.get('student_id', ''),
                f"{user.get('average_rating', 0):.2f}" if user.get('average_rating') else '0.00',
                user.get('total_ratings', 0),
                user.get('completed_tasks', 0)
            ])
        print(tabulate(rows, headers=headers, tablefmt='grid'))
        print(f"\nTotal users: {len(result.data)}")
    else:
        print("No users found")

def view_complaints():
    """View all complaints"""
    print("\n" + "=" * 100)
    print("COMPLAINTS")
    print("=" * 100)
    
    result = supabase.table('complaints').select('id, title, status, priority, location, worker_rating, created_at').order('created_at', desc=True).limit(20).execute()
    
    if result.data:
        headers = ['ID', 'Title', 'Status', 'Priority', 'Location', 'Rating', 'Created']
        rows = []
        for complaint in result.data:
            rows.append([
                complaint.get('id', ''),
                complaint.get('title', '')[:40],
                complaint.get('status', ''),
                complaint.get('priority', ''),
                complaint.get('location', '')[:20],
                f"⭐{complaint.get('worker_rating', '-')}" if complaint.get('worker_rating') else '-',
                complaint.get('created_at', '')[:10]
            ])
        print(tabulate(rows, headers=headers, tablefmt='grid'))
        print(f"\nShowing latest 20 complaints (Total: {len(result.data)})")
    else:
        print("No complaints found")

def view_workers_performance():
    """View worker performance"""
    print("\n" + "=" * 100)
    print("WORKER PERFORMANCE")
    print("=" * 100)
    
    result = supabase.table('users').select('name, email, average_rating, total_ratings, completed_tasks').eq('role', 'worker').order('average_rating', desc=True).execute()
    
    if result.data:
        headers = ['Worker Name', 'Email', 'Avg Rating', 'Total Ratings', 'Completed Tasks']
        rows = []
        for worker in result.data:
            rating = worker.get('average_rating', 0)
            stars = '⭐' * int(round(rating)) if rating else '-'
            rows.append([
                worker.get('name', '')[:30],
                worker.get('email', '')[:30],
                f"{rating:.2f} {stars}",
                worker.get('total_ratings', 0),
                worker.get('completed_tasks', 0)
            ])
        print(tabulate(rows, headers=headers, tablefmt='grid'))
        print(f"\nTotal workers: {len(result.data)}")
    else:
        print("No workers found")

def view_ratings():
    """View all ratings"""
    print("\n" + "=" * 100)
    print("WORKER RATINGS")
    print("=" * 100)
    
    result = supabase.table('worker_ratings').select('*').order('created_at', desc=True).limit(20).execute()
    
    if result.data:
        headers = ['Worker ID', 'Rating', 'Feedback', 'Created']
        rows = []
        for rating in result.data:
            stars = '⭐' * rating.get('rating', 0)
            rows.append([
                str(rating.get('worker_id', ''))[:36],
                f"{rating.get('rating', 0)} {stars}",
                (rating.get('feedback', '') or '-')[:40],
                rating.get('created_at', '')[:10]
            ])
        print(tabulate(rows, headers=headers, tablefmt='grid'))
        print(f"\nShowing latest 20 ratings")
    else:
        print("No ratings found")

def view_complaints_with_photos():
    """View complaints that have photos"""
    print("\n" + "=" * 100)
    print("COMPLAINTS WITH PHOTOS")
    print("=" * 100)
    
    result = supabase.table('complaints').select('id, title, status, progress_photo_url, completion_photo_url').execute()
    
    complaints_with_photos = [c for c in result.data if c.get('progress_photo_url') or c.get('completion_photo_url')]
    
    if complaints_with_photos:
        headers = ['ID', 'Title', 'Status', 'Progress Photo', 'Completion Photo']
        rows = []
        for complaint in complaints_with_photos:
            rows.append([
                complaint.get('id', ''),
                complaint.get('title', '')[:40],
                complaint.get('status', ''),
                '✓' if complaint.get('progress_photo_url') else '-',
                '✓' if complaint.get('completion_photo_url') else '-'
            ])
        print(tabulate(rows, headers=headers, tablefmt='grid'))
        print(f"\nTotal complaints with photos: {len(complaints_with_photos)}")
    else:
        print("No complaints with photos found")

def main():
    print("\n" + "=" * 100)
    print("DATABASE VIEWER")
    print("=" * 100)
    
    while True:
        print("\nWhat would you like to view?")
        print("1. Users")
        print("2. Complaints")
        print("3. Worker Performance")
        print("4. Ratings")
        print("5. Complaints with Photos")
        print("6. View All")
        print("0. Exit")
        
        choice = input("\nEnter choice (0-6): ").strip()
        
        if choice == '1':
            view_users()
        elif choice == '2':
            view_complaints()
        elif choice == '3':
            view_workers_performance()
        elif choice == '4':
            view_ratings()
        elif choice == '5':
            view_complaints_with_photos()
        elif choice == '6':
            view_users()
            view_complaints()
            view_workers_performance()
            view_ratings()
            view_complaints_with_photos()
        elif choice == '0':
            print("\nGoodbye!")
            break
        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nExiting...")
    except Exception as e:
        print(f"\nError: {e}")
        print("\nMake sure:")
        print("1. Your .env file has SUPABASE_URL and SUPABASE_KEY")
        print("2. You have internet connection")
        print("3. Run: pip install tabulate")
