from django.db import models
from django.db.models import Q
from django.utils import timezone
# DISABLED: AbstractBaseUser import - requires django.contrib.auth app
# from django.contrib.auth.models import AbstractBaseUser


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
    REQUIRED_FIELDS = ['email']

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

    # Django authentication requirements
    @property
    def is_anonymous(self):
        return False

    @property
    def is_authenticated(self):
        return True

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


class StudentJoinRequest(models.Model):
    """
    نموذج طلبات انضمام الطلاب للأنشطة.
    يتم إنشاؤه تلقائياً عند تسجيل الطالب.
    """

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="join_requests")
    activity_type = models.CharField(max_length=100, default="general")
    request_message = models.TextField(default="أرغب في الانضمام للأنشطة الطلابية")
    status = models.CharField(
        max_length=20, 
        choices=[
            ("pending", "قيد الانتظار"),
            ("approved", "موافقة"),
            ("rejected", "مرفوض")
        ], 
        default="pending"
    )
    processed_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name="processed_requests"
    )
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "student_join_requests"
        indexes = [
            models.Index(fields=["student"]),
            models.Index(fields=["status"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["activity_type"]),
        ]
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self) -> str:  # pragma: no cover - debug representation only
        return f"JoinRequest {self.id} - {self.student.full_name} ({self.status})"


class ChatRoom(models.Model):
    """
    نموذج كروبات الدردشة للمستخدمين.
    يدعم إنشاء الكروبات التي يمكن للطلاب والموظفين الانضمام إليها.
    """

    name = models.CharField(max_length=200)
    description = models.TextField()
    type = models.CharField(
        max_length=50,
        choices=[
            ("general", "عام"),
            ("contest", "مسابقة"),
            ("study", "دراسة"),
            ("announcement", "إعلانات"),
            ("private", "خاص"),
            ("support", "دعم فني"),
            ("project", "مشروع"),
        ],
        default="general"
    )
    privacy = models.CharField(
        max_length=20,
        choices=[
            ("public", "عام"),
            ("private", "خاص"),
            ("invite-only", "دعوة فقط"),
        ],
        default="public"
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ("active", "نشط"),
            ("inactive", "غير نشط"),
            ("archived", "مؤرشف"),
        ],
        default="active"
    )
    max_members = models.IntegerField(default=50)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="created_chat_rooms")
    admin = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="admin_chat_rooms")
    rules = models.TextField(blank=True, null=True)
    tags = models.TextField(blank=True, null=True)  # Store as comma-separated values
    welcome_message = models.TextField(blank=True, null=True)
    message_retention = models.CharField(max_length=20, default="forever")
    file_sharing = models.CharField(max_length=20, default="enabled")
    max_file_size = models.IntegerField(default=10485760)  # 10MB in bytes
    allowed_file_types = models.TextField(blank=True, null=True)  # Comma-separated
    notifications_enabled = models.BooleanField(default=True)
    encryption_enabled = models.BooleanField(default=False)
    auto_mod_enabled = models.BooleanField(default=True)
    read_only = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)
    last_activity = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "chat_rooms"
        indexes = [
            models.Index(fields=["created_by"]),
            models.Index(fields=["admin"]),
            models.Index(fields=["type"]),
            models.Index(fields=["privacy"]),
            models.Index(fields=["status"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["last_activity"]),
        ]
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self) -> str:  # pragma: no cover - debug representation only
        return f"ChatRoom {self.id} - {self.name} ({self.type})"


class ChatRoomMember(models.Model):
    """
    نموذج أعضاء كروبات الدردشة.
    يربط بين المستخدمين والكروبات.
    """

    chat_room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="chat_room_memberships")
    role = models.CharField(
        max_length=20,
        choices=[
            ("admin", "مدير"),
            ("moderator", "مشرف"),
            ("member", "عضو"),
        ],
        default="member"
    )
    joined_at = models.DateTimeField(default=timezone.now)
    last_active = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "chat_room_members"
        indexes = [
            models.Index(fields=["chat_room"]),
            models.Index(fields=["user"]),
            models.Index(fields=["role"]),
            models.Index(fields=["joined_at"]),
        ]
        unique_together = [["chat_room", "user"]]
        ordering = ["-joined_at"]

    def save(self, *args, **kwargs):
        self.last_active = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self) -> str:  # pragma: no cover - debug representation only
        return f"ChatRoomMember {self.user.full_name} in {self.chat_room.name}"


class ChatMessage(models.Model):
    """
    نموذج رسائل الدردشة في الكروبات.
    """

    chat_room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="chat_sent_messages")
    content = models.TextField()
    message_type = models.CharField(
        max_length=20,
        choices=[
            ("text", "نص"),
            ("image", "صورة"),
            ("file", "ملف"),
            ("system", "نظام"),
        ],
        default="text"
    )
    file_url = models.URLField(blank=True, null=True)
    file_name = models.CharField(max_length=255, blank=True, null=True)
    file_size = models.IntegerField(null=True, blank=True)
    reply_to = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name="replies")
    is_edited = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "chat_messages"
        indexes = [
            models.Index(fields=["chat_room"]),
            models.Index(fields=["sender"]),
            models.Index(fields=["message_type"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["reply_to"]),
        ]
        ordering = ["created_at"]

    def save(self, *args, **kwargs):
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self) -> str:  # pragma: no cover - debug representation only
        return f"Message {self.id} in {self.chat_room.name} by {self.sender.full_name}"


class Contest(models.Model):
    """
    نموذج المسابقات.
    لإدارة المسابقات المختلفة في النظام.
    """

    name = models.CharField(max_length=200)
    type = models.CharField(
        max_length=20,
        choices=[
            ("academic", "أكاديمية"),
            ("sports", "رياضية"),
            ("art", "فنية"),
            ("technology", "تقنية"),
            ("general", "عامة"),
            ("creative", "إبداعية"),
        ],
        default="general"
    )
    description = models.TextField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    eligibility = models.JSONField(default=list)  # ['students', 'employees', 'all']
    requirements = models.TextField()
    max_participants = models.IntegerField(default=50)
    prize = models.TextField(blank=True, null=True)
    rules = models.TextField()
    judges = models.JSONField(default=list)  # List of judge names
    status = models.CharField(
        max_length=20,
        choices=[
            ("draft", "مسودة"),
            ("active", "نشطة"),
            ("upcoming", "قادمة"),
            ("completed", "مكتملة"),
        ],
        default="draft"
    )
    visibility = models.CharField(
        max_length=20,
        choices=[
            ("public", "عامة"),
            ("private", "خاصة"),
            ("restricted", "مقيدة"),
        ],
        default="public"
    )
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="created_contests")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "contests"
        indexes = [
            models.Index(fields=["created_by"]),
            models.Index(fields=["type"]),
            models.Index(fields=["status"]),
            models.Index(fields=["visibility"]),
            models.Index(fields=["start_date"]),
            models.Index(fields=["end_date"]),
            models.Index(fields=["created_at"]),
        ]
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self) -> str:  # pragma: no cover - debug representation only
        return f"Contest {self.id} - {self.name} ({self.type})"


class Video(models.Model):
    """
    نموذج الفيديوهات.
    لإدارة الفيديوهات المنشورة في النظام.
    """

    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(
        max_length=20,
        choices=[
            ("general", "عام"),
            ("educational", "تعليمي"),
            ("announcement", "إعلان"),
            ("tutorial", "دليل"),
            ("entertainment", "ترفيهي"),
        ],
        default="general"
    )
    video_url = models.URLField()
    thumbnail_url = models.URLField(blank=True, null=True)
    tags = models.JSONField(default=list)  # List of tags
    duration = models.CharField(max_length=20, blank=True, null=True)  # e.g., "5:30"
    status = models.CharField(
        max_length=20,
        choices=[
            ("draft", "مسودة"),
            ("published", "منشور"),
            ("archived", "مؤرشف"),
        ],
        default="draft"
    )
    visibility = models.CharField(
        max_length=20,
        choices=[
            ("public", "عام"),
            ("private", "خاص"),
            ("students_only", "للطلاب فقط"),
        ],
        default="public"
    )
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="created_videos")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "videos"
        indexes = [
            models.Index(fields=["created_by"]),
            models.Index(fields=["category"]),
            models.Index(fields=["status"]),
            models.Index(fields=["visibility"]),
            models.Index(fields=["created_at"]),
        ]
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self) -> str:  # pragma: no cover - debug representation only
        return f"Video {self.id} - {self.title} ({self.category})"


# class StudentPost(models.Model):
#     DISABLED: Causing Pillow dependency issues on Railway deployment
#     title = models.CharField(max_length=255)
#     content = models.TextField()
#     author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="student_posts")
#     image = models.ImageField(upload_to="student_posts/", null=True, blank=True)
#     created_at = models.DateTimeField(default=timezone.now)
#     updated_at = models.DateTimeField(default=timezone.now)
#     is_active = models.BooleanField(default=True) # For moderation purposes

#     class Meta:
#         db_table = "student_posts"
#         indexes = [
#             models.Index(fields=["author"]),
#             models.Index(fields=["created_at"]),
#             models.Index(fields=["is_active"]),
#         ]
#         ordering = ["-created_at"]

#     def save(self, *args, **kwargs):
#         self.updated_at = timezone.now()
#         super().save(*args, **kwargs)

#     def __str__(self) -> str:
#         return f"Post {self.id} by {self.author.username} - {self.title}"
