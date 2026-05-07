from pathlib import Path
import os

from datetime import timedelta
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from backend/.env if present
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "django-insecure-change-me")

DEBUG = os.getenv("DEBUG", "True").lower() == "true"  # Enable debug temporarily to see errors

# Quick fix to stop restart loop - will be refined later
# Force ALLOWED_HOSTS to accept all hosts to stop restart loop
ALLOWED_HOSTS = ['*']

# Allow all hosts for Railway deployment
ALLOWED_HOSTS = ['*']

CSRF_TRUSTED_ORIGINS_ENV = os.getenv("CSRF_TRUSTED_ORIGINS", "")
CSRF_TRUSTED_ORIGINS = [
    origin.strip() for origin in CSRF_TRUSTED_ORIGINS_ENV.split(",") if origin.strip()
]

# CORS settings for Railway deployment
CORS_ALLOWED_ORIGINS = [
    "https://university-activities-production.up.railway.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "core",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "core.middleware.DatabaseInitializationMiddleware",
]

# Performance optimization
CONN_MAX_AGE = 600  # Connection pooling
SESSION_COOKIE_AGE = 86400  # 24 hours
SESSION_SAVE_EVERY_REQUEST = False

# Database connection retry settings
DATABASE_CONNECT_TIMEOUT = 10
DATABASE_RETRY_ATTEMPTS = 3
DATABASE_RETRY_DELAY = 1

ROOT_URLCONF = "university_activities.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "university_activities.wsgi.application"
ASGI_APPLICATION = "university_activities.asgi.application"

# Database configuration: FORCE SQLite for Railway deployment
# Override any Railway environment variables
DB_ENGINE = "sqlite"  # Force SQLite regardless of environment variables
os.environ["DB_ENGINE"] = "sqlite"  # Force environment variable too

if DB_ENGINE in ("mysql", "mariadb"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.mysql",
            "NAME": os.getenv("DB_NAME", "university_activities"),
            "USER": os.getenv("DB_USER", "root"),
            "PASSWORD": os.getenv("DB_PASSWORD", ""),
            "HOST": os.getenv("DB_HOST", "127.0.0.1"),
            "PORT": os.getenv("DB_PORT", "3306"),
            "OPTIONS": {
                "init_command": "SET sql_mode='STRICT_TRANS_TABLES'",
            },
            "CONN_MAX_AGE": CONN_MAX_AGE,
        }
    }
elif DB_ENGINE in ("postgres", "postgresql"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("DB_NAME", "university_activities"),
            "USER": os.getenv("DB_USER", "postgres"),
            "PASSWORD": os.getenv("DB_PASSWORD", ""),
            "HOST": os.getenv("DB_HOST", "127.0.0.1"),
            "PORT": os.getenv("DB_PORT", "5432"),
            "CONN_MAX_AGE": CONN_MAX_AGE,
            "OPTIONS": {
                "connect_timeout": DATABASE_CONNECT_TIMEOUT,
                "server_side_binding": True,
                "sslmode": "prefer",
                "sslcert": None,
                "sslkey": None,
                "sslcrl": None,
            },
        }
    }
else:
    # Force SQLite for Railway deployment to avoid PostgreSQL connection issues
    # Use application working directory for simplicity
    import os
    
    # Try multiple paths for database
    possible_paths = [
        "/app/backend/db.sqlite3",
        "/tmp/db.sqlite3", 
        "./db.sqlite3"
    ]
    
    db_path = None
    for path in possible_paths:
        try:
            # Test if we can create/write to this path
            test_dir = os.path.dirname(path)
            os.makedirs(test_dir, exist_ok=True)
            test_file = path + ".test"
            with open(test_file, 'w') as f:
                f.write("test")
            os.remove(test_file)
            db_path = path
            print(f"[DATABASE] Successfully using path: {path}")
            break
        except Exception as e:
            print(f"[DATABASE] Cannot use path {path}: {e}")
            continue
    
    if not db_path:
        # Fallback to in-memory database for debugging
        db_path = ":memory:"
        print("[DATABASE] Using in-memory database as fallback")
    
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": db_path,
            "OPTIONS": {
                "timeout": 20,
            }
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

LANGUAGE_CODE = "ar"

TIME_ZONE = "UTC"

USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Media (uploaded files)
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Custom user model
AUTH_USER_MODEL = 'core.User'

# CORS configuration
CORS_ALLOWED_ORIGINS_ENV = os.getenv("CORS_ALLOWED_ORIGINS", "")
CORS_ALLOWED_ORIGINS = [
    "https://university-activities-production.up.railway.app",
    "https://university-activities-production.up.railway.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
] + [
    origin.strip() for origin in CORS_ALLOWED_ORIGINS_ENV.split(",") if origin.strip()
]
CORS_ALLOW_ALL_ORIGINS = True

# Allow embedding pages and media within same-origin iframes
X_FRAME_OPTIONS = "SAMEORIGIN"
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True

# JWT settings (aligned with previous Flask configuration)
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", SECRET_KEY)
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRES_HOURS = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", "24"))

# Caching configuration for performance
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "university-activities-cache",
        "OPTIONS": {
            "MAX_ENTRIES": 1000
        }
    }
}

# Enhanced logging configuration for better debugging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'django_debug.log'),
            'formatter': 'verbose',
            'encoding': 'utf-8',
            'mode': 'a',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'university_activities': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'gunicorn': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}
