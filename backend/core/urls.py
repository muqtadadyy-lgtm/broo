from django.urls import path

from . import views
from . import chat_room_enhancements

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
    # Image upload
    path("upload/image", views.upload_image, name="upload_image"),
    # Student join requests
    path("student-requests", views.get_student_join_requests, name="get_student_join_requests"),
    path("student-requests/<int:request_id>", views.process_join_request, name="process_join_request"),
    path("student-requests/approve-all", views.approve_all_requests, name="approve_all_requests"),
    # Chat room management
    path("chat-rooms", views.create_chat_room, name="create_chat_room"),
    path("chat-rooms/list", views.get_chat_rooms, name="get_chat_rooms"),
    path("chat-rooms/<int:room_id>/join", views.join_chat_room, name="join_chat_room"),
    path("chat-rooms/<int:room_id>/messages", views.send_chat_message, name="send_chat_message"),
    path("chat-rooms/<int:room_id>/messages/list", views.get_chat_messages, name="get_chat_messages"),
    path("chat-rooms/join-requests", views.get_chat_room_join_requests, name="get_chat_room_join_requests"),
    path('chat-rooms/join-requests/<int:request_id>', views.process_chat_room_join_request, name='process_chat_room_join_request'),
    path('chat-rooms/<int:room_id>/members/<int:user_id>', views.remove_member_from_chat_room, name='remove_member_from_chat_room'),
    
    # ==================== Enhanced Chat Room Management ====================
    # Settings and configuration
    path('chat-rooms/<int:room_id>/settings', chat_room_enhancements.update_chat_room_settings, name='update_chat_room_settings'),
    path('chat-rooms/<int:room_id>/stats', chat_room_enhancements.get_chat_room_stats, name='get_chat_room_stats'),
    path('chat-rooms/<int:room_id>/archive', chat_room_enhancements.archive_chat_room, name='archive_chat_room'),
    path('chat-rooms/<int:room_id>/delete', chat_room_enhancements.delete_chat_room, name='delete_chat_room'),
    
    # Member management
    path('chat-rooms/<int:room_id>/members', chat_room_enhancements.get_chat_room_members, name='get_chat_room_members'),
    path('chat-rooms/<int:room_id>/members/manage', chat_room_enhancements.manage_chat_room_member, name='manage_chat_room_member'),
    
    # Message search and management
    path('chat-rooms/<int:room_id>/search', chat_room_enhancements.search_chat_messages, name='search_chat_messages'),
    path('chat-rooms/<int:room_id>/messages/<int:message_id>/delete', chat_room_enhancements.delete_chat_message, name='delete_chat_message'),
    
    # Message reactions
    path('messages/<int:message_id>/reactions/add', views.add_message_reaction, name='add_message_reaction'),
    path('messages/<int:message_id>/reactions', views.get_message_reactions, name='get_message_reactions'),
    
    # Typing indicators
    path('chat-rooms/<int:room_id>/typing', views.set_typing_indicator, name='set_typing_indicator'),
    path('chat-rooms/<int:room_id>/typing/users', views.get_typing_indicators, name='get_typing_indicators'),
    
    # Message management
    path('messages/<int:message_id>/pin', views.pin_message, name='pin_message'),
    path('messages/<int:message_id>/edit', views.edit_message, name='edit_message'),
    path('messages/<int:message_id>/delete', views.delete_message, name='delete_message'),
    
    # Enhanced chat room features
    path('chat-rooms/<int:room_id>/search-enhanced', views.search_chat_messages_enhanced, name='search_chat_messages_enhanced'),
    path('chat-rooms/<int:room_id>/statistics', views.get_chat_room_statistics, name='get_chat_room_statistics'),
    path('chat-rooms/<int:room_id>/export', views.export_chat_messages, name='export_chat_messages'),
]
