import os
import sys
from django.core.management import call_command
from django.http import JsonResponse
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


class CustomAuthLoggingMiddleware:
    """
    Custom middleware to handle authentication logging and prevent 
    unauthorized warnings for custom auth endpoints
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip auth logging for health checks and static files
        if request.path in ['/health/', '/api/health/', '/health', '/api/health', '/test', '/api/test']:
            return self.get_response(request)
        
        # Custom handling for auth endpoints to prevent Django's built-in auth warnings
        if request.path in ['/api/auth/login', '/api/auth/register']:
            # Add custom logging instead of Django's default auth logging
            logger.info(f"Auth endpoint accessed: {request.method} {request.path}")
        
        response = self.get_response(request)
        return response


class DatabaseInitializationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip middleware for health check requests to prevent delay
        if request.path in ['/health/', '/api/health/', '/health', '/api/health']:
            return self.get_response(request)
        
        # DISABLED: Runtime migrations causing instability on Railway
        # Migrations should only run during startup/deployment, not during runtime
        # This prevents restart loops and instability
        
        response = self.get_response(request)
        return response
