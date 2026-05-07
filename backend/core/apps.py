from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"

    def ready(self):
        print("[APP READY] V3.0 - CORE APP INITIALIZING...")
        print("[APP READY] Railway restart loop fix applied - Super user creation DISABLED")
        print("[APP READY] Fast startup - no heavy DB checks")
        
        # DISABLE all Django built-in post-migrate handlers to prevent restart loop
        try:
            from django.db.models.signals import post_migrate
            from django.contrib.auth.management import create_permissions
            from django.contrib.auth.models import User
            from django.core.management import call_command
            
            # Disconnect built-in Django signals that cause Super User creation
            post_migrate.disconnect(create_permissions, dispatch_uid="create_permissions")
            print("[APP READY] DISABLED Django built-in post-migrate handlers")
            
        except Exception as e:
            print(f"[APP READY] Warning: Could not disable post-migrate handlers: {e}")
        
        # Fast startup - no heavy database operations
        # This prevents health check timeout

