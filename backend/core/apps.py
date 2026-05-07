from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"

    def ready(self):
        print("[APP READY] Core app is initializing...")
        try:
            from django.core.management import call_command
            from django.db import connection
            
            # Check if users table exists
            with connection.cursor() as cursor:
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")
                if not cursor.fetchone():
                    print("[APP READY] Users table not found, running migrations...")
                    call_command('migrate', verbosity=2, fake_initial=True)
                    print("[APP READY] Migrations completed")
                else:
                    print("[APP READY] Database tables already exist")
                    
        except Exception as e:
            print(f"[APP READY] Database initialization failed: {e}")
            import traceback
            traceback.print_exc()

