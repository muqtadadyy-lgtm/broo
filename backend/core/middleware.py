import os
import sys
from django.core.management import call_command
from django.http import JsonResponse
from django.utils import timezone


class DatabaseInitializationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip middleware for health check requests to prevent delay
        if request.path in ['/health/', '/api/health/', '/health', '/api/health']:
            return self.get_response(request)
        
        # AGGRESSIVE DATABASE CHECK - Force initialization on EVERY request
        try:
            from django.db import connection
            
            # ALWAYS check if users table exists
            with connection.cursor() as cursor:
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")
                if not cursor.fetchone():
                    print(f"[MIDDLEWARE] CRITICAL: Users table missing! FORCING migrations for {request.path}...")
                    
                    # FORCE RUN MIGRATIONS
                    print("[MIDDLEWARE] FORCE: Running migrations NOW...")
                    call_command('migrate', verbosity=2, fake_initial=True, interactive=False)
                    
                    # SKIP SUPER USER CREATION TO PREVENT RAILWAY RESTART LOOP
                    print("[MIDDLEWARE] SKIP: Super user creation disabled for Railway stability")
                    
                    print("[MIDDLEWARE] FORCE: Database initialization COMPLETED")
                    
                    # VERIFY TABLES EXIST
                    with connection.cursor() as verify_cursor:
                        verify_cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")
                        if verify_cursor.fetchone():
                            print("[MIDDLEWARE] SUCCESS: Users table now exists!")
                        else:
                            print("[MIDDLEWARE] FAILED: Users table still missing!")
                else:
                    print(f"[MIDDLEWARE] OK: Database ready for {request.path}")
                    
        except Exception as e:
            print(f"[MIDDLEWARE] CRITICAL ERROR: {e}")
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
