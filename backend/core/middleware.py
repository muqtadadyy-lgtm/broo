import os
import sys
from django.core.management import call_command
from django.http import JsonResponse
from django.utils import timezone


class DatabaseInitializationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Check if database needs initialization on every request
        try:
            from django.db import connection
            
            # Check if users table exists
            with connection.cursor() as cursor:
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")
                if not cursor.fetchone():
                    print(f"[MIDDLEWARE] Users table not found, running migrations for {request.path}...")
                    
                    # Run migrations
                    print("[MIDDLEWARE] Running migrations...")
                    call_command('migrate', verbosity=2, fake_initial=True)
                    
                    # Create super user if needed
                    print("[MIDDLEWARE] Creating super user...")
                    try:
                        call_command('seed_super_employee')
                    except:
                        pass  # Super user might already exist
                    
                    print("[MIDDLEWARE] Database initialization completed")
                else:
                    print(f"[MIDDLEWARE] Database already initialized for {request.path}")
                    
        except Exception as e:
            print(f"[MIDDLEWARE] Database check failed: {e}")
            import traceback
            traceback.print_exc()
            # Return error response if it's an API request
            if request.path.startswith('/api/'):
                return JsonResponse({
                    "status": "error", 
                    "message": f"Database initialization failed: {str(e)}",
                    "timestamp": timezone.now().isoformat()
                }, status=500)

        response = self.get_response(request)
        return response
