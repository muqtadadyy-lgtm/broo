import os
from django.core.management import execute_from_command_line
from django.http import JsonResponse
from django.utils import timezone


class DatabaseInitializationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.initialized = False

    def __call__(self, request):
        # Only initialize database once
        if not self.initialized:
            try:
                print("[MIDDLEWARE] Initializing database...")
                
                # Run migrations
                print("[MIDDLEWARE] Running migrations...")
                execute_from_command_line(['manage.py', 'migrate', '--fake-initial'])
                
                # Create super user if needed
                print("[MIDDLEWARE] Creating super user...")
                try:
                    execute_from_command_line(['manage.py', 'seed_super_employee'])
                except:
                    pass  # Super user might already exist
                
                self.initialized = True
                print("[MIDDLEWARE] Database initialization completed")
                
            except Exception as e:
                print(f"[MIDDLEWARE] Database initialization failed: {e}")
                # Return error response if initialization fails
                if request.path.startswith('/api/'):
                    return JsonResponse({
                        "status": "error",
                        "message": f"Database initialization failed: {str(e)}",
                        "timestamp": timezone.now().isoformat()
                    }, status=500)

        response = self.get_response(request)
        return response
