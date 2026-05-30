from django.http import JsonResponse
from django.core.cache import cache
from django.conf import settings
from django.utils import timezone
import time


class RateLimitMiddleware:
    """
    Middleware to implement rate limiting for API endpoints.
    Prevents brute force attacks and API abuse.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
        # Rate limit configuration
        self.rate_limits = {
            'default': {'requests': 100, 'window': 60},  # 100 requests per minute
            'login': {'requests': 5, 'window': 300},      # 5 requests per 5 minutes
            'register': {'requests': 3, 'window': 3600},  # 3 requests per hour
            'upload': {'requests': 10, 'window': 60},     # 10 requests per minute
        }
    
    def __call__(self, request):
        # Skip rate limiting for static files and admin
        if request.path.startswith('/static/') or request.path.startswith('/admin/'):
            return self.get_response(request)
        
        # Determine rate limit based on endpoint
        rate_limit = self._get_rate_limit(request)
        
        if rate_limit:
            # Get client identifier (IP address or user ID if authenticated)
            client_id = self._get_client_id(request)
            
            # Check rate limit
            if self._is_rate_limited(client_id, rate_limit):
                return JsonResponse(
                    {
                        'success': False,
                        'message': 'Too many requests. Please try again later.',
                        'retry_after': self._get_retry_after(client_id, rate_limit)
                    },
                    status=429
                )
        
        response = self.get_response(request)
        return response
    
    def _get_rate_limit(self, request):
        """Determine rate limit based on endpoint"""
        path = request.path
        
        if '/auth/login' in path:
            return self.rate_limits['login']
        elif '/auth/register' in path:
            return self.rate_limits['register']
        elif '/upload' in path:
            return self.rate_limits['upload']
        else:
            return self.rate_limits['default']
    
    def _get_client_id(self, request):
        """Get client identifier (IP address or user ID)"""
        # Try to get user ID from JWT token if authenticated
        user_id = getattr(request, 'user_id', None)
        if user_id:
            return f"user_{user_id}"
        
        # Otherwise use IP address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR', 'unknown')
        
        return f"ip_{ip}"
    
    def _is_rate_limited(self, client_id, rate_limit):
        """Check if client has exceeded rate limit"""
        cache_key = f"ratelimit:{client_id}"
        
        # Get current request count and window start time
        data = cache.get(cache_key, {'count': 0, 'window_start': time.time()})
        
        current_time = time.time()
        window_start = data['window_start']
        window_duration = rate_limit['window']
        
        # Reset if window has expired
        if current_time - window_start > window_duration:
            data = {'count': 0, 'window_start': current_time}
        
        # Increment request count
        data['count'] += 1
        
        # Store updated data
        cache.set(cache_key, data, window_duration)
        
        # Check if limit exceeded
        return data['count'] > rate_limit['requests']
    
    def _get_retry_after(self, client_id, rate_limit):
        """Get seconds until rate limit resets"""
        cache_key = f"ratelimit:{client_id}"
        data = cache.get(cache_key, {'count': 0, 'window_start': time.time()})
        
        current_time = time.time()
        window_start = data['window_start']
        window_duration = rate_limit['window']
        
        time_remaining = window_duration - (current_time - window_start)
        return max(0, int(time_remaining))
