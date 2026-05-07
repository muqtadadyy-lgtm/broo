from django.db import models
from django.db.models import Q
from django.utils import timezone


class User(models.Model):
    full_name = models.CharField(max_length=200)
    username = models.CharField(max_length=100, unique=True, db_index=True)
    email = models.EmailField(max_length=200, unique=True, db_index=True)
    password_hash = models.CharField(max_length=255)
    role = models.CharField(max_length=20)  # 'student' or 'employee'
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    # Django authentication requirements
    USERNAME_FIELD = 'username'
    EMAIL_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'email']

    class Meta:
        db_table = "users"
        indexes = [
            models.Index(fields=["username"]),
            models.Index(fields=["email"]),
            models.Index(fields=["role"]),  # Optimize role-based queries
            models.Index(fields=["created_at"]),  # Optimize date-based queries
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["role"],
                condition=Q(role="super_employee"),
                name="unique_super_employee",
            )
        ]

    def save(self, *args, **kwargs):
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self) -> str:  # pragma: no cover - debug representation only
        return f"{self.username} ({self.role})"


class Activity(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100)
    available_slots = models.IntegerField(default=50)
    registered_count = models.IntegerField(default=0)
    location = models.CharField(max_length=200, blank=True)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "activities"
        indexes = [
            models.Index(fields=["is_active"]),  # Optimize active activities filter
            models.Index(fields=["start_date"]),  # Optimize date-based queries
            models.Index(fields=["category"]),  # Optimize category filters
        ]
        ordering = ["-created_at"]  # Default efficient ordering

    def save(self, *args, **kwargs):
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)

    @property
    def is_full(self):
        return self.registered_count >= self.available_slots

    @property
    def slots_remaining(self):
        return max(0, self.available_slots - self.registered_count)

    def __str__(self) -> str:  # pragma: no cover - debug representation only
        return f"{self.name} ({self.registered_count}/{self.available_slots})"


class ActivityRegistration(models.Model):
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name="registrations")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="activity_registrations")
    status = models.CharField(max_length=50, default="مسجل")
    registered_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "activity_registrations"
        unique_together = ("activity", "user")
        indexes = [
            models.Index(fields=["activity"]),
            models.Index(fields=["user"]),
        ]

    def save(self, *args, **kwargs):
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self) -> str:  # pragma: no cover - debug representation only
        return f"Activity:{self.activity_id} User:{self.user_id}"


class Application(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="applications")
    student_name = models.CharField(max_length=200)
    activity_type = models.CharField(max_length=100)
    activity_number = models.CharField(max_length=100)
    college = models.CharField(max_length=200)
    department = models.CharField(max_length=200)
    specialization = models.CharField(max_length=200)
    phone = models.CharField(max_length=50)
    details = models.TextField(blank=True)
    status = models.CharField(max_length=50, default="قيد الانتظار")
    submitted_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)
    # Optional project file uploaded by the student (e.g. تقرير، كود، عرض)
    project_file = models.FileField(upload_to="project_files/", null=True, blank=True)

    class Meta:
        db_table = "applications"
        indexes = [
            models.Index(fields=["submitted_at"]),
            models.Index(fields=["user"]),
            models.Index(fields=["status"]),  # Optimize status-based queries
            models.Index(fields=["user", "status"]),  # Composite index for common queries
        ]
        ordering = ["-submitted_at"]  # Default efficient ordering

    def save(self, *args, **kwargs):
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self) -> str:  # pragma: no cover - debug representation only
        return f"Application {self.id} - {self.activity_type} ({self.status})"


class EmployeeRequest(models.Model):
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_requests")
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_requests", null=True, blank=True)
    request_type = models.CharField(max_length=100)
    title = models.CharField(max_length=200)
    description = models.TextField()
    activity_name = models.CharField(max_length=200, blank=True)
    activity_code = models.CharField(max_length=100, blank=True)
    deadline = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=50, default="قيد الانتظار")
    response_message = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "employee_requests"
        indexes = [
            models.Index(fields=["employee"]),
            models.Index(fields=["student"]),
            models.Index(fields=["status"]),
        ]

    def save(self, *args, **kwargs):
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self) -> str:  # pragma: no cover - debug representation only
        return f"EmployeeRequest {self.id} - {self.title} ({self.status})"


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=200)
    message = models.TextField()
    type = models.CharField(max_length=50, default="info")
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "notifications"
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self) -> str:  # pragma: no cover - debug representation only
        return f"Notification {self.id} - {self.title}"


class Message(models.Model):
    """
    قناة مراسلة بسيطة مرتبطة بكل طلب (Application) فقط.
    كل رسالة بين طالب وموظف تخص طلبًا معيّنًا.
    """

    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="sent_messages",
    )
    receiver = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="received_messages",
        null=True,
        blank=True,
    )
    text = models.TextField()
    attachment = models.FileField(upload_to="message_files/", null=True, blank=True)
    is_read = models.BooleanField(default=False)
    is_system_notification = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "messages"
        indexes = [
            models.Index(fields=["application"]),
            models.Index(fields=["sender"]),
            models.Index(fields=["receiver"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self) -> str:  # pragma: no cover - debug representation only
        return f"Message {self.id} App:{self.application_id} From:{self.sender_id}"


class EmployeeDirectMessage(models.Model):
    """
    مراسلات مباشرة بين الموظف الرئيسي وأي موظف.
    تسمح للموظفين بالرد على الموظف الرئيسي في قناة بسيطة.
    """

    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="direct_messages_sent")
    receiver = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="direct_messages_received"
    )
    text = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "employee_direct_messages"
        indexes = [
            models.Index(fields=["sender"]),
            models.Index(fields=["receiver"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self) -> str:  # pragma: no cover - debug representation only
        return f"DirectMessage {self.id} From:{self.sender_id} To:{self.receiver_id}"


class Announcement(models.Model):
    """
    نموذج الإعلانات التي ينشرها الموظف الرئيسي.
    يمكن تحديد ما إذا كان الإعلان نشطًا أم لا.
    """

    title = models.CharField(max_length=300)
    content = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="announcements")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "announcements"
        indexes = [
            models.Index(fields=["is_active"]),
            models.Index(fields=["created_at"]),
        ]
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self) -> str:  # pragma: no cover - debug representation only
        return f"Announcement {self.id} - {self.title} ({'Active' if self.is_active else 'Inactive'})"
    
    
