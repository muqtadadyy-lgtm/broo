from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse, HttpResponse
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

from core import views as core_views

# Swagger/OpenAPI configuration
schema_view = get_schema_view(
    openapi.Info(
        title="University Activities API",
        default_version='v1',
        description="API documentation for University Activities Management System",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="support@university.edu"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

def health(request):
    """Simple health endpoint for Railway validation"""
    return JsonResponse({"status": "healthy"})

def health_check(request):
    """Simple health endpoint for Railway health check"""
    return HttpResponse("healthy")

def ready_check(request):
    return JsonResponse({"status": "ready"})

def root_endpoint(request):
    """Root endpoint serving index.html"""
    return core_views.index(request)

urlpatterns = (
    [
        # DISABLED: admin/ - django.contrib.admin app removed to prevent Super User creation
        path("api/", include("core.urls")),
        # Swagger/OpenAPI documentation
        path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
        path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
        path('swagger.json', schema_view.without_ui(cache_timeout=0), name='schema-json'),
        path('swagger.yaml', schema_view.without_ui(cache_timeout=0), name='schema-yaml'),
        path("health/", health_check, name="health_check"),
        path("health", health_check, name="health_check_no_slash"),
        path("ready", ready_check, name="ready_check"),
        path("", root_endpoint, name="root"),
        path("index.html", core_views.index, name="index_html"),
        path("student-dashboard.html", core_views.student_dashboard, name="student_dashboard"),
        path("employee-dashboard.html", core_views.employee_dashboard, name="employee_dashboard"),
    ]
    + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    + [
        path("<path:path>", core_views.serve_static, name="serve_static"),
    ]
)
