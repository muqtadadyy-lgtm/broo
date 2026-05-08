import os
import sys

from django.core.wsgi import get_wsgi_application
from django.core.management import execute_from_command_line
from django.db import connection

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "university_activities.settings")

# Initialize database before starting the application
def initialize_database():
    """Ensure database is properly initialized before serving requests"""
    try:
        print("[APP READY] V3.0 - CORE APP INITIALIZING...")
        
        # Check if database needs initialization
        with connection.cursor() as cursor:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")
            if not cursor.fetchone():
                print("[APP READY] Running initial database migrations...")
                execute_from_command_line(['manage.py', 'migrate', '--fake-initial'])
                print("[APP READY] Database initialization completed")
            else:
                print("[APP READY] Database already initialized")
        
        print("[APP READY] Railway restart loop fix applied - Super user creation DISABLED")
        print("[APP READY] Fast startup - no heavy DB checks")
        
    except Exception as e:
        print(f"[APP READY] Database initialization failed: {e}")
        # Continue anyway - the login view will handle database issues gracefully

# Initialize database
initialize_database()

application = get_wsgi_application()
