from django.urls import path

from . import views

urlpatterns = [
    path("auth/register", views.register, name="register"),
    path("auth/login", views.login, name="login"),
    path("users/profile", views.update_profile, name="update_profile"),
    path("users/employee", views.create_employee, name="create_employee"),
    path("activities", views.get_activities, name="get_activities"),
    path("activities/<int:activity_id>/register", views.register_for_activity, name="register_for_activity"),
    path("activities/my-registrations", views.get_my_registrations, name="get_my_registrations"),
    path("applications/submit", views.submit_application, name="submit_application"),
    path("applications/my-applications", views.get_my_applications, name="get_my_applications"),
    path("applications/all", views.get_all_applications, name="get_all_applications"),
    path("applications/<int:application_id>/status", views.update_application_status, name="update_application_status"),
    path("applications/<int:application_id>/delete", views.delete_application, name="delete_application"),
    path("applications/statistics", views.get_statistics, name="get_statistics"),
    path("employee/requests/send", views.send_employee_request, name="send_employee_request"),
    path("employee/requests/my-requests", views.get_employee_sent_requests, name="get_employee_sent_requests"),
    path("student/requests", views.get_student_requests, name="get_student_requests"),
    path("student/requests/<int:request_id>/respond", views.respond_to_employee_request, name="respond_to_employee_request"),
    path("employee/requests/statistics", views.get_employee_request_statistics, name="get_employee_request_statistics"),
    path("employee/activities", views.get_employee_activities, name="get_employee_activities"),
    path("employee/activities/add", views.add_activity, name="add_activity"),
    path("users/employees", views.list_employees, name="list_employees"),
    path("users/employees/<int:employee_id>", views.delete_employee, name="delete_employee"),
    path("super/messages", views.get_supervisor_messages, name="get_supervisor_messages"),
    path("super/messages/send", views.send_supervisor_message, name="send_supervisor_message"),
    # Messaging tied to applications
    path("messages", views.send_message, name="send_message"),
    path("messages/thread", views.get_message_thread, name="get_message_thread"),
    path("health", views.health_check, name="health_check"),
    path("health/", views.health_check, name="health_check_slash"),
    path("test", views.test_endpoint, name="test_endpoint"),
    path("announcements/active", views.get_active_announcement, name="get_active_announcement"),
    path("announcements", views.create_announcement, name="create_announcement"),
    path("announcements/<int:announcement_id>", views.update_announcement, name="update_announcement"),
    path("announcements/<int:announcement_id>/toggle", views.toggle_announcement, name="toggle_announcement"),
    # User management
    path("users/all", views.get_all_users, name="get_all_users"),
    path("users/<int:user_id>", views.delete_user, name="delete_user"),
]
