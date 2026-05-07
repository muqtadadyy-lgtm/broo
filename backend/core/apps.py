from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"

    def ready(self):
        print("[APP READY] V3.0 - CORE APP INITIALIZING...")
        print("[APP READY] Railway restart loop fix applied - Super user creation DISABLED")
        print("[APP READY] Fast startup - no heavy DB checks")
        # Fast startup - no heavy database operations
        # This prevents health check timeout

