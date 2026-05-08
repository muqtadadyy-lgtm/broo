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
        
        # DISABLED: Runtime migrations causing instability on Railway
        # Migrations should only run during startup/deployment, not during runtime
        # This prevents restart loops and instability
        
        response = self.get_response(request)
        return response
