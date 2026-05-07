import os
import sys
from django.core.management import call_command
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
                call_command('migrate', verbosity=2, fake_initial=True)
                
                # Create super user if needed
                print("[MIDDLEWARE] Creating super user...")
                try:
                    call_command('seed_super_employee')
                except:
                    pass  # Super user might already exist
                
                self.initialized = True
                print("[MIDDLEWARE] Database initialization completed")
                
            except Exception as e:
                print(f"[MIDDLEWARE] Database initialization failed: {e}")
                import traceback
                traceback.print_exc()
                # Return error response if initialization fails
                if request.path.startswith('/api/'):
                    return JsonResponse({
                        "status": "error",
                        "message": f"Database initialization failed: {str(e)}",
                        "timestamp": timezone.now().isoformat()
                    }, status=500)

        response = self.get_response(request)
        return response
