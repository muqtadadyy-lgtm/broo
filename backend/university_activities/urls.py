from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse, HttpResponse

from core import views as core_views

def health_check(request):
    return JsonResponse({"status": "ok"})

def ready_check(request):
    return JsonResponse({"status": "ready"})

def root_endpoint(request):
    """Simple root endpoint for Railway validation"""
    return HttpResponse("OK")

urlpatterns = (
    [
        path("admin/", admin.site.urls),
        path("api/", include("core.urls")),
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
