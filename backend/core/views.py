from datetime import datetime, timedelta
import json
import mimetypes
import os
from pathlib import Path

from django.conf import settings
from django.db.models import Q, Prefetch
from django.http import JsonResponse, FileResponse, Http404, HttpRequest, HttpResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.hashers import make_password, check_password
from django.db import connection

from .jwt_utils import create_access_token, jwt_required, get_jwt_identity
from .models import (
    Activity,
    ActivityRegistration,
    Announcement,
    Application,
    EmployeeDirectMessage,
    EmployeeRequest,
    Message,
    User,
)


def _parse_json(request: HttpRequest) -> dict:
    try:
        if not request.body:
            return {}
        return json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return {}


def _error(message: str, status: int = 400) -> JsonResponse:
    return JsonResponse({"success": False, "message": message}, status=status)


@require_http_methods(["GET"])
def health_check(request: HttpRequest) -> JsonResponse:
    """
    Enhanced health check endpoint for monitoring and load balancers.
    Checks database connectivity and returns detailed service status.
    """
    try:
        # Test database connection with timeout
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            db_status = "healthy"
            db_error = None
    except Exception as e:
        db_status = "unhealthy"
        db_error = str(e)
    
    # Check overall system health
    overall_status = "healthy" if db_status == "healthy" else "unhealthy"
    status_code = 200 if overall_status == "healthy" else 503
    
    response_data = {
        "status": overall_status,
        "timestamp": timezone.now().isoformat(),
        "database": {
            "status": db_status,
            "error": db_error
        },
        "version": "1.0.0",
        "uptime": "ready"
    }
    
    return JsonResponse(response_data, status=status_code)


def _ensure_default_activities() -> None:
    if Activity.objects.count() > 0:
        return
    now = timezone.now()
    defaults = [
        {
            "name": "نشاط رياضي",
            "description": "أنشطة رياضية متنوعة للطلاب",
            "category": "رياضي",
            "available_slots": 50,
            "location": "الصالة الرياضية",
            "start_delta": 7,
            "end_delta": 37,
        },
        {
            "name": "نشاط ثقافي",
            "description": "فعاليات ثقافية وأدبية",
            "category": "ثقافي",
            "available_slots": 100,
            "location": "القاعة الكبرى",
            "start_delta": 10,
            "end_delta": 40,
        },
        {
            "name": "نشاط فني",
            "description": "ورش عمل فنية وإبداعية",
            "category": "فني",
            "available_slots": 30,
            "location": "مركز الفنون",
            "start_delta": 5,
            "end_delta": 35,
        },
        {
            "name": "نشاط علمي",
            "description": "محاضرات وندوات علمية",
            "category": "علمي",
            "available_slots": 75,
            "location": "مختبر العلوم",
            "start_delta": 14,
            "end_delta": 44,
        },
        {
            "name": "نشاط اجتماعي",
            "description": "أنشطة تطوعية واجتماعية",
            "category": "اجتماعي",
            "available_slots": 60,
            "location": "مركز الطلاب",
            "start_delta": 3,
            "end_delta": 33,
        },
        {
            "name": "نشاط تقني",
            "description": "ورش برمجة وتقنية معلومات",
            "category": "تقني",
            "available_slots": 40,
            "location": "معمل الحاسوب",
            "start_delta": 12,
            "end_delta": 42,
        },
    ]
    objs = []
    for item in defaults:
        objs.append(
            Activity(
                name=item["name"],
                description=item["description"],
                category=item["category"],
                available_slots=item["available_slots"],
                location=item["location"],
                start_date=now + timedelta(days=item["start_delta"]),
                end_date=now + timedelta(days=item["end_delta"]),
            )
        )
    Activity.objects.bulk_create(objs)


# ==================== AUTH ENDPOINTS ====================


@csrf_exempt
@require_http_methods(["POST"])
def register(request: HttpRequest) -> JsonResponse:
    data = _parse_json(request)
    required_fields = ["fullName", "username", "email", "password", "role"]
    if not all(field in data for field in required_fields):
        return _error("جميع الحقول مطلوبة", status=400)

    if User.objects.filter(username=data["username"]).exists():
        return _error("اسم المستخدم موجود بالفعل", status=400)

    if User.objects.filter(email=data["email"]).exists():
        return _error("البريد الإلكتروني موجود بالفعل", status=400)

    # منع إنشاء أي حسابات غير حساب الطالب من الواجهة العامة
    if data["role"] != "student":
        return _error("غير مصرح بإنشاء حسابات غير طلابية", status=403)

    try:
        user = User(
            full_name=data["fullName"],
            username=data["username"],
            email=data["email"],
            password_hash=make_password(data["password"]),
            role="student",
        )
        user.save()
    except Exception as exc:  # pragma: no cover - defensive
        return _error(f"حدث خطأ: {exc}", status=500)

    return JsonResponse(
        {"success": True, "message": "تم إنشاء الحساب بنجاح"},
        status=201,
    )


@csrf_exempt
@require_http_methods(["POST"])
def login(request: HttpRequest) -> JsonResponse:
    data = _parse_json(request)
    if not all(field in data for field in ["username", "password", "role"]):
        return _error("جميع الحقول مطلوبة", status=400)

    try:
        user = User.objects.filter(
            username=data["username"],
            role=data["role"],
        ).first()
        if not user or not check_password(data["password"], user.password_hash):
            return _error("اسم المستخدم أو كلمة المرور غير صحيحة", status=401)

        access_token = create_access_token(user.id)
        return JsonResponse(
            {
                "success": True,
                "token": access_token,
                "user": {
                    "id": user.id,
                    "fullName": user.full_name,
                    "username": user.username,
                    "email": user.email,
                    "role": user.role,
                },
            }
        )
    except Exception as exc:  # pragma: no cover - defensive
        return _error(f"حدث خطأ: {exc}", status=500)


@csrf_exempt
@jwt_required
@require_http_methods(["PUT"])
def update_profile(request: HttpRequest) -> JsonResponse:
    user_id = get_jwt_identity(request)
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return _error("المستخدم غير موجود", status=404)

    data = _parse_json(request)

    if "fullName" in data:
        user.full_name = data["fullName"]

    if "email" in data:
        if User.objects.filter(email=data["email"]).exclude(pk=user_id).exists():
            return _error("البريد الإلكتروني موجود بالفعل", status=400)
        user.email = data["email"]

    if data.get("password"):
        if len(data["password"]) < 6:
            return _error("كلمة المرور يجب أن تكون 6 أحرف على الأقل", status=400)
        user.password_hash = make_password(data["password"])

    try:
        user.save()
    except Exception as exc:  # pragma: no cover - defensive
        return _error(f"حدث خطأ: {exc}", status=500)

    return JsonResponse(
        {
            "success": True,
            "message": "تم تحديث الملف الشخصي بنجاح",
            "user": {
                "id": user.id,
                "fullName": user.full_name,
                "username": user.username,
                "email": user.email,
                "role": user.role,
            },
        }
    )

# dta time is none of [js - css - html , backend python and danjo frame woke in potject]
# ==================== ACTIVITY ENDPOINTS ====================


@jwt_required
@require_http_methods(["GET"])
def get_activities(request: HttpRequest) -> JsonResponse:
    user_id = get_jwt_identity(request)
    _ensure_default_activities()

    regs_qs = ActivityRegistration.objects.filter(user_id=user_id)
    activities = (
        Activity.objects.filter(is_active=True)
        .prefetch_related(Prefetch("registrations", queryset=regs_qs, to_attr="user_regs"))
        .all()
    )

    result = []
    for activity in activities:
        registration = activity.user_regs[0] if getattr(activity, "user_regs", []) else None
        result.append(
            {
                "id": activity.id,
                "name": activity.name,
                "description": activity.description,
                "category": activity.category,
                "availableSlots": activity.available_slots,
                "registeredCount": activity.registered_count,
                "location": activity.location,
                "startDate": activity.start_date.isoformat() if activity.start_date else None,
                "endDate": activity.end_date.isoformat() if activity.end_date else None,
                "isRegistered": registration is not None,
                "registrationStatus": registration.status if registration else None,
            }
        )

    return JsonResponse({"success": True, "activities": result})


@csrf_exempt
@jwt_required
@require_http_methods(["POST"])
def register_for_activity(request: HttpRequest, activity_id: int) -> JsonResponse:
    user_id = get_jwt_identity(request)

    try:
        activity = Activity.objects.get(pk=activity_id)
    except Activity.DoesNotExist:
        return _error("النشاط غير موجود", status=404)

    if activity.registered_count >= activity.available_slots:
        return _error("النشاط ممتلئ", status=400)

    if ActivityRegistration.objects.filter(activity_id=activity_id, user_id=user_id).exists():
        return _error("أنت مسجل بالفعل في هذا النشاط", status=400)

    try:
        ActivityRegistration.objects.create(
            activity_id=activity_id,
            user_id=user_id,
            status="مسجل",
        )
        activity.registered_count += 1
        activity.save()
    except Exception as exc:  # pragma: no cover - defensive
        return _error(f"حدث خطأ: {exc}", status=500)

    return JsonResponse({"success": True, "message": "تم التسجيل في النشاط بنجاح"})


@jwt_required
@require_http_methods(["GET"])
def get_my_registrations(request: HttpRequest) -> JsonResponse:
    user_id = get_jwt_identity(request)

    registrations = (
        ActivityRegistration.objects.filter(user_id=user_id)
        .select_related("activity")
        .order_by("-registered_at")
    )

    result = []
    for reg in registrations:
        activity = reg.activity
        result.append(
            {
                "id": reg.id,
                "activity": {
                    "id": activity.id,
                    "name": activity.name,
                    "description": activity.description,
                    "category": activity.category,
                    "location": activity.location,
                },
                "status": reg.status,
                "registeredAt": reg.registered_at.isoformat(),
            }
        )

    return JsonResponse({"success": True, "registrations": result})


# ==================== APPLICATION ENDPOINTS ====================


@csrf_exempt
@jwt_required
@require_http_methods(["POST"])
def submit_application(request: HttpRequest) -> JsonResponse:
    user_id = get_jwt_identity(request)

    # Allow both JSON (current frontend) and multipart/form-data (for file upload)
    if request.content_type and request.content_type.startswith("multipart/form-data"):
        data = request.POST
        uploaded_file = request.FILES.get("projectFile")
    else:
        data = _parse_json(request)
        uploaded_file = None

    required_fields = [
        "activityType",
        "activityNumber",
        "college",
        "department",
        "specialization",
        "phone",
    ]
    if not all(field in data for field in required_fields):
        return _error("جميع الحقول مطلوبة", status=400)

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return _error("المستخدم غير موجود", status=404)

    if uploaded_file is not None:
        content_type = uploaded_file.content_type or ""
        name_lower = (uploaded_file.name or "").lower()
        if not content_type.startswith("application/pdf") and not name_lower.endswith(".pdf"):
            return _error("يسمح فقط برفع ملفات PDF للطلب", status=400)

    try:
        app = Application.objects.create(
            user_id=user_id,
            student_name=data.get("name", user.full_name),
            activity_type=data["activityType"],
            activity_number=data["activityNumber"],
            college=data["college"],
            department=data["department"],
            specialization=data["specialization"],
            phone=data["phone"],
            details=data.get("details", ""),
            status="قيد الانتظار",
        )
        if uploaded_file:
            app.project_file = uploaded_file
            app.save()
    except Exception as exc:  # pragma: no cover - defensive
        return _error(f"حدث خطأ: {exc}", status=500)

    return JsonResponse(
        {
            "success": True,
            "message": "تم إرسال الطلب بنجاح",
            "application": {"id": app.id, "status": app.status},
        },
        status=201,
    )


@jwt_required
@require_http_methods(["GET"])
def get_my_applications(request: HttpRequest) -> JsonResponse:
    user_id = get_jwt_identity(request)
    applications = Application.objects.filter(user_id=user_id).order_by("-submitted_at")

    result = []
    for app in applications:
        result.append(
            {
                "id": app.id,
                "userId": app.user_id,
                "studentName": app.student_name,
                "activityType": app.activity_type,
                "activityNumber": app.activity_number,
                "college": app.college,
                "department": app.department,
                "specialization": app.specialization,
                "phone": app.phone,
                "details": app.details,
                "status": app.status,
                "submittedAt": app.submitted_at.isoformat(),
                "updatedAt": app.updated_at.isoformat(),
                "projectFile": request.build_absolute_uri(app.project_file.url) if app.project_file else None,
            }
        )

    return JsonResponse({"success": True, "applications": result})


@jwt_required
@require_http_methods(["GET"])
def get_all_applications(request: HttpRequest) -> JsonResponse:
    user_id = get_jwt_identity(request)
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return _error("غير مصرح لك", status=403)

    if user.role not in ("employee", "super_employee"):
        return _error("غير مصرح لك", status=403)

    applications = Application.objects.all().order_by("-submitted_at")

    result = []
    for app in applications:
        result.append(
            {
                "id": app.id,
                "userId": app.user_id,
                "studentName": app.student_name,
                "activityType": app.activity_type,
                "activityNumber": app.activity_number,
                "college": app.college,
                "department": app.department,
                "specialization": app.specialization,
                "phone": app.phone,
                "details": app.details,
                "status": app.status,
                "submittedAt": app.submitted_at.isoformat(),
                "updatedAt": app.updated_at.isoformat(),
                "projectFile": request.build_absolute_uri(app.project_file.url) if app.project_file else None,
            }
        )

    return JsonResponse({"success": True, "applications": result})


@csrf_exempt
@jwt_required
@require_http_methods(["PUT"])
def update_application_status(request: HttpRequest, application_id: int) -> JsonResponse:
    user_id = get_jwt_identity(request)
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return _error("غير مصرح لك", status=403)

    if user.role not in ("employee", "super_employee"):
        return _error("غير مصرح لك", status=403)

    data = _parse_json(request)
    new_status = data.get("status")
    if not new_status:
        return _error("الحالة مطلوبة", status=400)

    try:
        app = Application.objects.get(pk=application_id)
    except Application.DoesNotExist:
        return _error("الطلب غير موجود", status=404)

    app.status = new_status
    app.updated_at = timezone.now()
    try:
        app.save()
    except Exception as exc:  # pragma: no cover - defensive
        return _error(f"حدث خطأ: {exc}", status=500)

    return JsonResponse(
        {"success": True, "message": f"تم {new_status} الطلب بنجاح"}
    )


@csrf_exempt
@jwt_required
@require_http_methods(["DELETE"])
def delete_application(request: HttpRequest, application_id: int) -> JsonResponse:
    """
    يسمح للموظف الرئيسي فقط بحذف طلب طالب بشكل كامل.
    """
    user_id = get_jwt_identity(request)
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return _error("غير مصرح لك", status=403)

    if user.role != "super_employee":
        return _error("هذه الصلاحية للموظف الرئيسي فقط", status=403)

    try:
        app = Application.objects.get(pk=application_id)
    except Application.DoesNotExist:
        return _error("الطلب غير موجود", status=404)

    app.delete()
    return JsonResponse({"success": True, "message": "تم حذف الطلب بنجاح"})


@jwt_required
@require_http_methods(["GET"])
def get_statistics(request: HttpRequest) -> JsonResponse:
    user_id = get_jwt_identity(request)
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return _error("غير مصرح لك", status=403)

    if user.role not in ("employee", "super_employee"):
        return _error("غير مصرح لك", status=403)

    total = Application.objects.count()
    pending = Application.objects.filter(status="قيد الانتظار").count()
    approved = Application.objects.filter(status="مقبول").count()
    rejected = Application.objects.filter(status="مرفوض").count()

    return JsonResponse(
        {
            "success": True,
            "statistics": {
                "total": total,
                "pending": pending,
                "approved": approved,
                "rejected": rejected,
            },
        }
    )


# ==================== EMPLOYEE REQUEST ENDPOINTS ====================


@csrf_exempt
@jwt_required
@require_http_methods(["POST"])
def send_employee_request(request: HttpRequest) -> JsonResponse:
    user_id = get_jwt_identity(request)
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return _error("غير مصرح لك", status=403)

    if user.role not in ("employee", "super_employee"):
        return _error("غير مصرح لك", status=403)

    data = _parse_json(request)
    required_fields = ["requestType", "title", "description"]
    if not all(field in data for field in required_fields):
        return _error("جميع الحقول المطلوبة يجب ملؤها", status=400)

    deadline = None
    if data.get("deadline"):
        try:
            deadline = datetime.fromisoformat(data["deadline"].replace("Z", "+00:00"))
        except ValueError:
            return _error("تنسيق التاريخ غير صالح", status=400)

    try:
        req = EmployeeRequest.objects.create(
            employee_id=user_id,
            student_id=data.get("studentId"),
            request_type=data["requestType"],
            title=data["title"],
            description=data["description"],
            activity_name=data.get("activityName") or "",
            activity_code=data.get("activityCode") or "",
            deadline=deadline,
            status="قيد الانتظار",
        )
    except Exception as exc:  # pragma: no cover - defensive
        return _error(f"حدث خطأ: {exc}", status=500)

    return JsonResponse(
        {
            "success": True,
            "message": "تم إرسال الطلب بنجاح",
            "request": _employee_request_to_dict(req),
        },
        status=201,
    )


def _employee_request_to_dict(req: EmployeeRequest) -> dict:
    employee_user = req.employee
    student_user = req.student
    return {
        "id": req.id,
        "employeeId": req.employee_id,
        "employeeName": employee_user.full_name if employee_user else "Unknown",
        "studentId": req.student_id,
        "studentName": student_user.full_name if student_user else "جميع الطلاب",
        "requestType": req.request_type,
        "title": req.title,
        "description": req.description,
        "activityName": req.activity_name,
        "activityCode": req.activity_code,
        "deadline": req.deadline.isoformat() if req.deadline else None,
        "status": req.status,
        "responseMessage": req.response_message,
        "createdAt": req.created_at.isoformat(),
        "updatedAt": req.updated_at.isoformat(),
        "respondedAt": req.responded_at.isoformat() if req.responded_at else None,
    }


@jwt_required
@require_http_methods(["GET"])
def get_employee_sent_requests(request: HttpRequest) -> JsonResponse:
    user_id = get_jwt_identity(request)
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return _error("غير مصرح لك", status=403)

    if user.role not in ("employee", "super_employee"):
        return _error("غير مصرح لك", status=403)

    requests_qs = EmployeeRequest.objects.filter(employee_id=user_id).select_related(
        "student", "employee"
    ).order_by("-created_at")

    result = [_employee_request_to_dict(req) for req in requests_qs]
    return JsonResponse({"success": True, "requests": result})


@jwt_required
@require_http_methods(["GET"])
def get_student_requests(request: HttpRequest) -> JsonResponse:
    user_id = get_jwt_identity(request)
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return _error("غير مصرح لك", status=403)

    if user.role != "student":
        return _error("غير مصرح لك", status=403)

    requests_qs = EmployeeRequest.objects.filter(
        Q(student_id=user_id) | Q(student__isnull=True)
    ).select_related("employee", "student").order_by("-created_at")

    result = [_employee_request_to_dict(req) for req in requests_qs]
    return JsonResponse({"success": True, "requests": result})


@csrf_exempt
@jwt_required
@require_http_methods(["PUT"])
def respond_to_employee_request(
    request: HttpRequest, request_id: int
) -> JsonResponse:
    user_id = get_jwt_identity(request)
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return _error("غير مصرح لك", status=403)

    if user.role != "student":
        return _error("غير مصرح لك", status=403)

    data = _parse_json(request)
    new_status = data.get("status")
    response_message = data.get("responseMessage", "")

    if new_status not in ["مقبول", "مرفوض"]:
        return _error("الحالة غير صالحة", status=400)

    try:
        employee_request = EmployeeRequest.objects.select_related("student").get(pk=request_id)
    except EmployeeRequest.DoesNotExist:
        return _error("الطلب غير موجود", status=404)

    if employee_request.student_id and employee_request.student_id != user_id:
        return _error("غير مصرح لك بالرد على هذا الطلب", status=403)

    employee_request.status = new_status
    employee_request.response_message = response_message
    employee_request.updated_at = timezone.now()
    employee_request.responded_at = timezone.now()

    if not employee_request.student_id:
        employee_request.student_id = user_id

    try:
        employee_request.save()
    except Exception as exc:  # pragma: no cover - defensive
        return _error(f"حدث خطأ: {exc}", status=500)

    return JsonResponse(
        {"success": True, "message": f"تم {new_status} الطلب بنجاح"}
    )


@jwt_required
@require_http_methods(["GET"])
def get_employee_request_statistics(request: HttpRequest) -> JsonResponse:
    user_id = get_jwt_identity(request)
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return _error("غير مصرح لك", status=403)

    if user.role not in ("employee", "super_employee"):
        return _error("غير مصرح لك", status=403)

    base_qs = EmployeeRequest.objects.filter(employee_id=user_id)
    total = base_qs.count()
    pending = base_qs.filter(status="قيد الانتظار").count()
    approved = base_qs.filter(status="مقبول").count()
    rejected = base_qs.filter(status="مرفوض").count()

    return JsonResponse(
        {
            "success": True,
            "statistics": {
                "total": total,
                "pending": pending,
                "approved": approved,
                "rejected": rejected,
            },
        }
    )


# ==================== EMPLOYEE ENDPOINTS ====================


@jwt_required
@require_http_methods(["GET"])
def list_employees(request: HttpRequest) -> JsonResponse:
    """
    إرجاع قائمة الموظفين (باستثناء الموظف الرئيسي) لإدارتهم.
    """
    user_id = get_jwt_identity(request)
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return _error("غير مصرح لك", status=403)

    if user.role != "super_employee":
        return _error("هذه العملية متاحة للموظف الرئيسي فقط", status=403)

    employees = (
        User.objects.filter(role="employee")
        .order_by("-created_at")
        .values("id", "full_name", "username", "email", "created_at")
    )
    result = []
    for emp in employees:
        result.append(
            {
                "id": emp["id"],
                "fullName": emp["full_name"],
                "username": emp["username"],
                "email": emp["email"],
                "createdAt": emp["created_at"].isoformat() if emp["created_at"] else None,
            }
        )
    return JsonResponse({"success": True, "employees": result})


@csrf_exempt
@jwt_required
@require_http_methods(["DELETE"])
def delete_employee(request: HttpRequest, employee_id: int) -> JsonResponse:
    """
    حذف حساب موظف من قبل الموظف الرئيسي فقط.
    """
    user_id = get_jwt_identity(request)
    try:
        caller = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return _error("غير مصرح لك", status=403)

    if caller.role != "super_employee":
        return _error("هذه العملية متاحة للموظف الرئيسي فقط", status=403)

    if employee_id == caller.id:
        return _error("لا يمكن حذف حساب الموظف الرئيسي نفسه", status=400)

    try:
        target = User.objects.get(pk=employee_id)
        if target.role not in ["employee", "student"]:
             return _error("الحساب غير موجود أو لا يمكن حذفه", status=404)
    except User.DoesNotExist:
        return _error("الحساب غير موجود", status=404)

    target.delete()
    return JsonResponse({"success": True, "message": "تم حذف حساب الموظف بنجاح"})


@jwt_required
@require_http_methods(["GET"])
def get_employee_activities(request: HttpRequest) -> JsonResponse:
    user_id = get_jwt_identity(request)
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return _error("غير مصرح لك", status=403)

    if user.role not in ("employee", "super_employee"):
        return _error("غير مصرح لك", status=403)

    regs = ActivityRegistration.objects.select_related("user")
    activities = Activity.objects.all().prefetch_related(
        Prefetch("registrations", queryset=regs, to_attr="all_regs")
    )

    result = []
    for activity in activities:
        students = []
        for reg in getattr(activity, "all_regs", []):
            student = reg.user
            students.append(
                {
                    "id": student.id,
                    "name": student.full_name,
                    "email": student.email,
                    "registeredAt": reg.registered_at.isoformat(),
                    "status": reg.status,
                }
            )

        result.append(
            {
                "id": activity.id,
                "name": activity.name,
                "description": activity.description,
                "category": activity.category,
                "availableSlots": activity.available_slots,
                "registeredCount": activity.registered_count,
                "location": activity.location,
                "startDate": activity.start_date.isoformat() if activity.start_date else None,
                "endDate": activity.end_date.isoformat() if activity.end_date else None,
                "isActive": activity.is_active,
                "students": students,
            }
        )

    return JsonResponse({"success": True, "activities": result})


@csrf_exempt
@jwt_required
@require_http_methods(["POST"])
def add_activity(request: HttpRequest) -> JsonResponse:
    user_id = get_jwt_identity(request)
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return _error("غير مصرح لك", status=403)

    if user.role not in ("employee", "super_employee"):
        return _error("غير مصرح لك", status=403)

    data = _parse_json(request)

    required_fields = [
        "name",
        "description",
        "category",
        "availableSlots",
        "location",
        "startDate",
        "endDate",
    ]
    if not all(field in data for field in required_fields):
        return _error("جميع الحقول مطلوبة", status=400)

    try:
        start_date = datetime.fromisoformat(data["startDate"])
        end_date = datetime.fromisoformat(data["endDate"])
    except ValueError:
        return _error(
            "تنسيق التاريخ غير صالح. يرجى استخدام تنسيق ISO 8601.", status=400
        )

    try:
        activity = Activity.objects.create(
            name=data["name"],
            description=data["description"],
            category=data["category"],
            available_slots=data["availableSlots"],
            location=data["location"],
            start_date=start_date,
            end_date=end_date,
            is_active=data.get("isActive", True),
        )
    except Exception as exc:  # pragma: no cover - defensive
        return _error(f"حدث خطأ: {exc}", status=500)

    return JsonResponse(
        {
            "success": True,
            "message": "تم إنشاء النشاط بنجاح",
            "activity": {
                "id": activity.id,
                "name": activity.name,
                "description": activity.description,
                "category": activity.category,
                "availableSlots": activity.available_slots,
                "location": activity.location,
                "startDate": activity.start_date.isoformat(),
                "endDate": activity.end_date.isoformat(),
                "isActive": activity.is_active,
            },
        },
        status=201,
    )


# ==================== SUPERVISOR DIRECT MESSAGES ====================


def _direct_message_to_dict(msg: EmployeeDirectMessage) -> dict:
    return {
        "id": msg.id,
        "text": msg.text,
        "createdAt": msg.created_at.isoformat(),
        "sender": {
            "id": msg.sender_id,
            "fullName": msg.sender.full_name,
            "role": msg.sender.role,
        },
        "receiver": {
            "id": msg.receiver_id,
            "fullName": msg.receiver.full_name,
            "role": msg.receiver.role,
        },
    }


@csrf_exempt
@jwt_required
@require_http_methods(["POST"])
def send_supervisor_message(request: HttpRequest) -> JsonResponse:
    """
    مراسلة مباشرة بين الموظف الرئيسي والموظفين.
    - الموظف الرئيسي يمكنه مراسلة أي موظف.
    - الموظف العادي يمكنه الرد على الموظف الرئيسي فقط.
    """
    user_id = get_jwt_identity(request)
    try:
        sender = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return _error("غير مصرح لك", status=403)

    data = _parse_json(request)
    receiver_id = data.get("receiverId")
    text = (data.get("text") or "").strip()

    if not text:
        return _error("المستقبل والنص مطلوبان", status=400)

    # إذا كان المرسل موظفًا عاديًا ولم يحدد المستقبل، نختار الموظف الرئيسي الوحيد
    if sender.role == "employee" and not receiver_id:
        primary = User.objects.filter(role="super_employee").first()
        if not primary:
            return _error("لا يوجد موظف رئيسي لاستقبال الرسائل", status=400)
        receiver_id = primary.id

    try:
        receiver = User.objects.get(pk=receiver_id)
    except User.DoesNotExist:
        return _error("المستخدم المستقبل غير موجود", status=404)

    # قواعد الأدوار
    if sender.role == "super_employee":
        if receiver.role != "employee":
            return _error("يمكن مراسلة الموظفين فقط", status=400)
    elif sender.role == "employee":
        if receiver.role != "super_employee":
            return _error("يمكن الرد على الموظف الرئيسي فقط", status=403)
    else:
        return _error("غير مصرح لك", status=403)

    try:
        msg = EmployeeDirectMessage.objects.create(sender=sender, receiver=receiver, text=text)
    except Exception as exc:  # pragma: no cover - defensive
        return _error(f"حدث خطأ أثناء الإرسال: {exc}", status=500)

    return JsonResponse({"success": True, "message": _direct_message_to_dict(msg)}, status=201)


@jwt_required
@require_http_methods(["GET"])
def get_supervisor_messages(request: HttpRequest) -> JsonResponse:
    """
    جلب المحادثات:
    - للموظف الرئيسي: يمكن تمرير employeeId لجلب محادثته مع موظف محدد، أو جميع الرسائل.
    - للموظف: يجلب كل رسائله مع الموظف الرئيسي.
    """
    user_id = get_jwt_identity(request)
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return _error("غير مصرح لك", status=403)

    employee_id = request.GET.get("employeeId")
    base_qs = EmployeeDirectMessage.objects.select_related("sender", "receiver")

    if user.role == "super_employee":
        if employee_id:
            try:
                target_id = int(employee_id)
            except ValueError:
                return _error("employeeId غير صالح", status=400)
            base_qs = base_qs.filter(
                (Q(sender_id=user_id, receiver_id=target_id))
                | (Q(sender_id=target_id, receiver_id=user_id))
            )
        # بدون employeeId نعيد جميع الرسائل مع أي موظف
        else:
            base_qs = base_qs.filter(Q(sender_id=user_id) | Q(receiver_id=user_id))
    elif user.role == "employee":
        # الموظف يرى محادثته مع الموظف الرئيسي فقط
        base_qs = base_qs.filter(
            (Q(sender_id=user_id, receiver__role="super_employee"))
            | (Q(sender__role="super_employee", receiver_id=user_id))
        )
    else:
        return _error("غير مصرح لك", status=403)

    messages_list = [_direct_message_to_dict(m) for m in base_qs.order_by("created_at")]
    return JsonResponse({"success": True, "messages": messages_list})


# ==================== MESSAGING (APPLICATION-BASED) ====================


def _message_to_dict(msg: Message, request: HttpRequest) -> dict:
    attachment_url: str | None = None
    if msg.attachment:
        try:
            attachment_url = request.build_absolute_uri(msg.attachment.url)
        except Exception:  # pragma: no cover - defensive
            attachment_url = msg.attachment.url

    return {
        "id": msg.id,
        "applicationId": msg.application_id,
        "text": msg.text,
        "isRead": msg.is_read,
        "createdAt": msg.created_at.isoformat(),
        "attachmentUrl": attachment_url,
        "sender": {
            "id": msg.sender_id,
            "fullName": msg.sender.full_name,
            "role": msg.sender.role,
        },
        "receiver": {
            "id": msg.receiver_id,
            "fullName": msg.receiver.full_name if msg.receiver else None,
            "role": msg.receiver.role if msg.receiver else None,
        },
    }


@csrf_exempt
@jwt_required
@require_http_methods(["POST"])
def send_message(request: HttpRequest) -> JsonResponse:
    """
    إرسال رسالة مرتبطة بطلب (Application).
    - إذا كان المرسل موظفًا: المستقبل الافتراضي هو الطالب صاحب الطلب إن لم يُحدَّد receiverId.
    - إذا كان المرسل طالبًا: يجب أن يكون صاحب الطلب، ويُفضَّل أن يكون هناك موظف سبق وأرسل رسالة
      ليصبح هو المستقبل تلقائيًا إن لم يُحدَّد receiverId.
    """

    user_id = get_jwt_identity(request)
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return _error("غير مصرح لك", status=403)

    # دعم JSON و multipart/form-data للملفات
    if request.content_type and request.content_type.startswith("multipart/form-data"):
        data = request.POST
        uploaded_file = request.FILES.get("file")
    else:
        data = _parse_json(request)
        uploaded_file = None
    application_id = data.get("applicationId")
    text = (data.get("text") or "").strip()
    receiver_id = data.get("receiverId")

    if not application_id or not text:
        return _error("applicationId والنص مطلوبان", status=400)

    try:
        application = Application.objects.select_related("user").get(pk=application_id)
    except Application.DoesNotExist:
        return _error("الطلب غير موجود", status=404)

    # صلاحيات الوصول
    if user.role == "student" and application.user_id != user_id:
        return _error("غير مصرح لك بالمراسلة لهذا الطلب", status=403)

    # التحقق من نوع الملف (PDF فقط)
    if uploaded_file is not None:
        content_type = uploaded_file.content_type or ""
        name_lower = (uploaded_file.name or "").lower()
        if not content_type.startswith("application/pdf") and not name_lower.endswith(
            ".pdf"
        ):
            return _error("يسمح فقط برفع ملفات PDF في المراسلة", status=400)

    # تحديد المستقبل
    receiver: User | None = None

    if receiver_id:
        try:
            receiver = User.objects.get(pk=receiver_id)
        except User.DoesNotExist:
            return _error("المستخدم المستقبل غير موجود", status=404)
    else:
        if user.role == "employee":
            # بشكل افتراضي، الموظف يرسل لصاحب الطلب
            receiver = application.user
        else:
            # طالب بدون مستقبل محدد: نحاول إيجاد آخر موظف تواصل في هذه المحادثة
            last_msg = (
                Message.objects.filter(application_id=application_id)
                .select_related("sender", "receiver")
                .order_by("-created_at")
                .first()
            )
            candidate: User | None = None
            if last_msg:
                if last_msg.sender.role == "employee":
                    candidate = last_msg.sender
                elif last_msg.receiver and last_msg.receiver.role == "employee":
                    candidate = last_msg.receiver
            if candidate is None:
                return _error(
                    "لا يوجد موظف مرتبط بهذا الطلب بعد. لا يمكن بدء المحادثة من طرف الطالب.",
                    status=400,
                )
            receiver = candidate

    try:
        msg = Message.objects.create(
            application=application,
            sender=user,
            receiver=receiver,
            text=text,
            attachment=uploaded_file,
            is_read=False,
        )
    except Exception as exc:  # pragma: no cover - defensive
        return _error(f"حدث خطأ أثناء حفظ الرسالة: {exc}", status=500)

    return JsonResponse(
        {"success": True, "message": _message_to_dict(msg, request)}, status=201
    )


@jwt_required
@require_http_methods(["GET"])
def get_message_thread(request: HttpRequest) -> JsonResponse:
    """
    جلب جميع الرسائل المرتبطة بطلب واحد (Application).
    يحق لصاحب الطلب (طالب) أو أي موظف الاطلاع عليها.
    """

    user_id = get_jwt_identity(request)
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return _error("غير مصرح لك", status=403)

    try:
        application_id = int(request.GET.get("applicationId", "0"))
    except ValueError:
        return _error("applicationId غير صالح", status=400)

    if not application_id:
        return _error("applicationId مطلوب", status=400)

    try:
        application = Application.objects.select_related("user").get(pk=application_id)
    except Application.DoesNotExist:
        return _error("الطلب غير موجود", status=404)

    # صلاحيات الوصول
    if user.role == "student" and application.user_id != user_id:
        return _error("غير مصرح لك بعرض رسائل هذا الطلب", status=403)

    # الموظف مسموح له برؤية جميع الطلبات (نفس صلاحية get_all_applications)
    if user.role not in ("employee", "student"):
        return _error("غير مصرح لك", status=403)

    msgs_qs = (
        Message.objects.filter(application_id=application_id)
        .select_related("sender", "receiver")
        .order_by("created_at")
    )

    messages_list = [_message_to_dict(m, request) for m in msgs_qs]

    # تعليم الرسائل الموجهة للمستخدم كمقروءة
    Message.objects.filter(
        application_id=application_id,
        receiver_id=user_id,
        is_read=False,
    ).update(is_read=True)

    return JsonResponse({"success": True, "messages": messages_list})


# ==================== HEALTH & FRONTEND ROUTES ====================


def health_check(request: HttpRequest) -> JsonResponse:
    return JsonResponse(
        {
            "status": "healthy",
            "message": "University Activities Backend API is running (Django)",
            "timestamp": timezone.now().isoformat(),
        }
    )


def _frontend_root() -> Path:
    # Frontend files live one level above backend directory
    return Path(settings.BASE_DIR).parent


def index(request: HttpRequest) -> HttpResponse:
    root = _frontend_root()
    # The frontend HTML files live under the top-level "templates" directory
    # (e.g. <project_root>/templates/index.html), so point there explicitly.
    file_path = root / "templates" / "index.html"
    if not file_path.exists():
        raise Http404("index.html not found")
    content_type, _ = mimetypes.guess_type(str(file_path))
    return FileResponse(open(file_path, "rb"), content_type=content_type or "text/html")


def student_dashboard(request: HttpRequest) -> HttpResponse:
    root = _frontend_root()
    file_path = root / "templates" / "student-dashboard.html"
    if not file_path.exists():
        raise Http404("student-dashboard.html not found")
    content_type, _ = mimetypes.guess_type(str(file_path))
    return FileResponse(open(file_path, "rb"), content_type=content_type or "text/html")


def employee_dashboard(request: HttpRequest) -> HttpResponse:
    root = _frontend_root()
    file_path = root / "templates" / "employee-dashboard.html"
    if not file_path.exists():
        raise Http404("employee-dashboard.html not found")
    content_type, _ = mimetypes.guess_type(str(file_path))
    return FileResponse(open(file_path, "rb"), content_type=content_type or "text/html")


def serve_static(request: HttpRequest, path: str) -> HttpResponse:
    root = _frontend_root()
    safe_path = Path(os.path.normpath(path))
    if safe_path.is_absolute() or ".." in safe_path.parts:
        raise Http404("Invalid path")

    # Try several common locations so existing frontend paths keep working
    candidate_paths = [
        root / safe_path,  # e.g. /static/... or direct paths
        root / "static" / safe_path,
        root / "static" / "css" / safe_path.name,
        root / "static" / "js" / safe_path.name,
        root / "static" / "img" / safe_path.name,
    ]

    file_path = None
    for candidate in candidate_paths:
        if candidate.exists() and candidate.is_file():
            file_path = candidate
            break

    if file_path is None:
        raise Http404("File not found")

    content_type, _ = mimetypes.guess_type(str(file_path))
    return FileResponse(open(file_path, "rb"), content_type=content_type or "application/octet-stream")
@csrf_exempt
@jwt_required
@require_http_methods(["POST"])
def create_employee(request: HttpRequest) -> JsonResponse:
    """
    إنشاء موظف جديد عبر الموظف الرئيسي فقط.
    يتطلب حقول: fullName, username, email, password
    """
    user_id = get_jwt_identity(request)
    try:
        caller = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return _error("غير مصرح لك", status=403)

    if caller.role != "super_employee":
        return _error("هذه العملية متاحة للموظف الرئيسي فقط", status=403)

    data = _parse_json(request)
    required = ["fullName", "username", "email", "password"]
    if not all(k in data for k in required):
        return _error("جميع الحقول مطلوبة", status=400)

    if User.objects.filter(username=data["username"]).exists():
        return _error("اسم المستخدم موجود بالفعل", status=400)
    if User.objects.filter(email=data["email"]).exists():
        return _error("البريد الإلكتروني موجود بالفعل", status=400)

    try:
        user = User.objects.create(
            full_name=data["fullName"],
            username=data["username"],
            email=data["email"],
            password_hash=make_password(data["password"]),
            role="employee",
        )
    except Exception as exc:
        return _error(f"حدث خطأ: {exc}", status=500)

    return JsonResponse({"success": True, "message": "تم إنشاء حساب الموظف بنجاح", "userId": user.id}, status=201)


# ==================== ANNOUNCEMENTS ====================

@require_http_methods(["GET"])
def get_active_announcement(request: HttpRequest) -> JsonResponse:
    """
    جلب آخر إعلان نشط (لا يتطلب JWT).
    """
    try:
        announcement = Announcement.objects.filter(is_active=True).latest("created_at")
        return JsonResponse({
            "success": True,
            "announcement": {
                "id": announcement.id,
                "title": announcement.title,
                "content": announcement.content,
                "createdAt": announcement.created_at.isoformat(),
                "createdBy": announcement.created_by.full_name,
            }
        })
    except Announcement.DoesNotExist:
        return JsonResponse({"success": True, "announcement": None})


@csrf_exempt
@jwt_required
@require_http_methods(["POST"])
def create_announcement(request: HttpRequest) -> JsonResponse:
    """
    إنشاء إعلان جديد (الموظف الرئيسي فقط).
    """
    user_id = get_jwt_identity(request)
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return _error("غير مصرح لك", status=403)

    if user.role != "super_employee":
        return _error("هذه العملية متاحة للموظف الرئيسي فقط", status=403)

    data = _parse_json(request)
    if not all(field in data for field in ["title", "content"]):
        return _error("جميع الحقول مطلوبة", status=400)

    try:
        announcement = Announcement.objects.create(
            title=data["title"],
            content=data["content"],
            created_by=user,
            is_active=True
        )
    except Exception as exc:
        return _error(f"حدث خطأ: {exc}", status=500)

    return JsonResponse({
        "success": True,
        "message": "تم نشر الإعلان بنجاح",
        "announcement": {
            "id": announcement.id,
            "title": announcement.title,
            "content": announcement.content,
            "createdAt": announcement.created_at.isoformat(),
        }
    }, status=201)


@csrf_exempt
@jwt_required
@require_http_methods(["PUT"])
def update_announcement(request: HttpRequest, announcement_id: int) -> JsonResponse:
    """
    تعديل إعلان (الموظف الرئيسي فقط).
    """
    user_id = get_jwt_identity(request)
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return _error("غير مصرح لك", status=403)

    if user.role != "super_employee":
        return _error("هذه العملية متاحة للموظف الرئيسي فقط", status=403)

    try:
        announcement = Announcement.objects.get(pk=announcement_id)
    except Announcement.DoesNotExist:
        return _error("الإعلان غير موجود", status=404)

    data = _parse_json(request)
    
    if "title" in data:
        announcement.title = data["title"]
    if "content" in data:
        announcement.content = data["content"]
    
    try:
        announcement.save()
    except Exception as exc:
        return _error(f"حدث خطأ: {exc}", status=500)

    return JsonResponse({
        "success": True,
        "message": "تم تحديث الإعلان بنجاح",
        "announcement": {
            "id": announcement.id,
            "title": announcement.title,
            "content": announcement.content,
            "updatedAt": announcement.updated_at.isoformat(),
        }
    })


@csrf_exempt
@jwt_required
@require_http_methods(["PUT", "PATCH"])
def toggle_announcement(request: HttpRequest, announcement_id: int) -> JsonResponse:
    """
    تفعيل/تعطيل إعلان (الموظف الرئيسي فقط).
    """
    user_id = get_jwt_identity(request)
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return _error("غير مصرح لك", status=403)

    if user.role != "super_employee":
        return _error("هذه العملية متاحة للموظف الرئيسي فقط", status=403)

    try:
        announcement = Announcement.objects.get(pk=announcement_id)
    except Announcement.DoesNotExist:
        return _error("الإعلان غير موجود", status=404)

    announcement.is_active = not announcement.is_active
    try:
        announcement.save()
    except Exception as exc:
        return _error(f"حدث خطأ: {exc}", status=500)

    return JsonResponse({
        "success": True,
        "message": f"تم {'تفعيل' if announcement.is_active else 'تعطيل'} الإعلان",
        "isActive": announcement.is_active
    })


