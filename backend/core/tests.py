from django.test import TestCase
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password

from .models import (
    User,
    Activity,
    ActivityRegistration,
    Application,
    EmployeeRequest,
    Notification,
    Message,
    EmployeeDirectMessage,
    Announcement,
    StudentJoinRequest,
    ChatRoom,
    ChatRoomMember,
    ChatMessage,
)


class UserModelTest(TestCase):
    """اختبارات نموذج المستخدم"""

    def setUp(self):
        self.user = User.objects.create(
            full_name="Test User",
            username="testuser",
            email="test@example.com",
            password_hash=make_password("testpass123"),
            role="student",
        )

    def test_user_creation(self):
        """اختبار إنشاء مستخدم جديد"""
        self.assertEqual(self.user.username, "testuser")
        self.assertEqual(self.user.email, "test@example.com")
        self.assertEqual(self.user.role, "student")

    def test_user_password_hash(self):
        """اختبار تشفير كلمة المرور"""
        self.assertTrue(check_password("testpass123", self.user.password_hash))
        self.assertFalse(check_password("wrongpass", self.user.password_hash))

    def test_user_string_representation(self):
        """اختبار تمثيل المستخدم كنص"""
        self.assertEqual(str(self.user), "testuser (student)")

    def test_user_is_authenticated(self):
        """اختبار خصائص المصادقة"""
        self.assertTrue(self.user.is_authenticated)
        self.assertFalse(self.user.is_anonymous)


class ActivityModelTest(TestCase):
    """اختبارات نموذج النشاط"""

    def setUp(self):
        self.activity = Activity.objects.create(
            name="Test Activity",
            description="Test Description",
            category="sports",
            available_slots=50,
        )

    def test_activity_creation(self):
        """اختبار إنشاء نشاط جديد"""
        self.assertEqual(self.activity.name, "Test Activity")
        self.assertEqual(self.activity.category, "sports")
        self.assertEqual(self.activity.available_slots, 50)

    def test_activity_is_full(self):
        """اختبار خاصية is_full"""
        self.assertFalse(self.activity.is_full)
        self.activity.registered_count = 50
        self.activity.save()
        self.assertTrue(self.activity.is_full)

    def test_activity_slots_remaining(self):
        """اختبار خاصية slots_remaining"""
        self.assertEqual(self.activity.slots_remaining, 50)
        self.activity.registered_count = 30
        self.activity.save()
        self.assertEqual(self.activity.slots_remaining, 20)


class ActivityRegistrationModelTest(TestCase):
    """اختبارات نموذج تسجيل النشاط"""

    def setUp(self):
        self.user = User.objects.create(
            full_name="Test User",
            username="testuser",
            email="test@example.com",
            password_hash=make_password("testpass123"),
            role="student",
        )
        self.activity = Activity.objects.create(
            name="Test Activity",
            description="Test Description",
            category="sports",
            available_slots=50,
        )
        self.registration = ActivityRegistration.objects.create(
            activity=self.activity,
            user=self.user,
            status="مسجل",
        )

    def test_registration_creation(self):
        """اختبار إنشاء تسجيل نشاط جديد"""
        self.assertEqual(self.registration.activity, self.activity)
        self.assertEqual(self.registration.user, self.user)
        self.assertEqual(self.registration.status, "مسجل")


class ApplicationModelTest(TestCase):
    """اختبارات نموذج الطلب"""

    def setUp(self):
        self.user = User.objects.create(
            full_name="Test User",
            username="testuser",
            email="test@example.com",
            password_hash=make_password("testpass123"),
            role="student",
        )
        self.application = Application.objects.create(
            user=self.user,
            student_name="Test Student",
            activity_type="sports",
            activity_number="001",
            college="Engineering",
            department="Computer Science",
            specialization="Software Engineering",
            phone="1234567890",
        )

    def test_application_creation(self):
        """اختبار إنشاء طلب جديد"""
        self.assertEqual(self.application.user, self.user)
        self.assertEqual(self.application.activity_type, "sports")
        self.assertEqual(self.application.status, "قيد الانتظار")


class ChatRoomModelTest(TestCase):
    """اختبارات نموذج غرفة الدردشة"""

    def setUp(self):
        self.user = User.objects.create(
            full_name="Test User",
            username="testuser",
            email="test@example.com",
            password_hash=make_password("testpass123"),
            role="employee",
        )
        self.chat_room = ChatRoom.objects.create(
            name="Test Chat Room",
            description="Test Description",
            type="general",
            created_by=self.user,
        )

    def test_chat_room_creation(self):
        """اختبار إنشاء غرفة دردشة جديدة"""
        self.assertEqual(self.chat_room.name, "Test Chat Room")
        self.assertEqual(self.chat_room.type, "general")
        self.assertEqual(self.chat_room.created_by, self.user)


class ChatMessageModelTest(TestCase):
    """اختبارات نموذج رسالة الدردشة"""

    def setUp(self):
        self.user = User.objects.create(
            full_name="Test User",
            username="testuser",
            email="test@example.com",
            password_hash=make_password("testpass123"),
            role="employee",
        )
        self.chat_room = ChatRoom.objects.create(
            name="Test Chat Room",
            description="Test Description",
            type="general",
            created_by=self.user,
        )
        self.message = ChatMessage.objects.create(
            chat_room=self.chat_room,
            sender=self.user,
            content="Test message",
            message_type="text",
        )

    def test_message_creation(self):
        """اختبار إنشاء رسالة جديدة"""
        self.assertEqual(self.message.chat_room, self.chat_room)
        self.assertEqual(self.message.sender, self.user)
        self.assertEqual(self.message.content, "Test message")
