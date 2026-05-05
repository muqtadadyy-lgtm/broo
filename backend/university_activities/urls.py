from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

from core import views as core_views

def health_check(request):
    return JsonResponse({"status": "ok"})

urlpatterns = (
    [
        path("admin/", admin.site.urls),
        path("api/", include("core.urls")),
        path("health/", health_check, name="health_check"),
        path("health", health_check, name="health_check_no_slash"),
        path("", core_views.index, name="index"),
        path("index.html", core_views.index, name="index_html"),
        path("student-dashboard.html", core_views.student_dashboard, name="student_dashboard"),
        path("employee-dashboard.html", core_views.employee_dashboard, name="employee_dashboard"),
    ]
    + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    + [
        path("<path:path>", core_views.serve_static, name="serve_static"),
    ]
)
