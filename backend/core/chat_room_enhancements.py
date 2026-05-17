"""
تحسينات متقدمة لإدارة كروبات الدردشة
Advanced Chat Room Management Enhancements
"""

from django.http import JsonResponse, HttpRequest
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.db.models import Q, Count, Prefetch
from .jwt_utils import jwt_required, get_jwt_identity
from .models import ChatRoom, ChatRoomMember, ChatMessage, User
import json


def _parse_json(request: HttpRequest) -> dict:
    """Parse JSON from request body"""
    try:
        if not request.body:
            return {}
        return json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return {}


def _error(message: str, status: int = 400) -> JsonResponse:
    """Return error response"""
    return JsonResponse({"success": False, "message": message}, status=status)


# ==================== CHAT ROOM SETTINGS & MANAGEMENT ====================

@csrf_exempt
@jwt_required
@require_http_methods(["PUT"])
def update_chat_room_settings(request: HttpRequest, room_id: int) -> JsonResponse:
    """
    تحديث إعدادات الكروب المتقدمة.
    يسمح فقط للمديرين.
    """
    user_id = get_jwt_identity(request)
    try:
        user = User.objects.get(pk=user_id)
        chat_room = ChatRoom.objects.get(pk=room_id)
    except (User.DoesNotExist, ChatRoom.DoesNotExist):
        return _error("غير مصرح لك أو الكروب غير موجود", status=403)

    # التحقق من أن المستخدم هو المدير
    membership = ChatRoomMember.objects.filter(
        chat_room=chat_room, 
        user=user, 
        role="admin"
    ).first()
    
    if not membership:
        return _error("فقط المديرون يمكنهم تحديث الإعدادات", status=403)

    data = _parse_json(request)
    
    # تحديث الحقول المسموحة
    allowed_fields = {
        "name": str,
        "description": str,
        "rules": str,
        "welcome_message": str,
        "max_members": int,
        "message_retention": str,
        "notifications_enabled": bool,
        "read_only": bool,
        "auto_mod_enabled": bool,
    }
    
    updated_fields = []
    for field_name, field_type in allowed_fields.items():
        api_name = ''.join(['_' + c.lower() if c.isupper() else c for c in field_name]).lstrip('_')
        
        if api_name in data:
            try:
                value = field_type(data[api_name])
                setattr(chat_room, field_name, value)
                updated_fields.append(field_name)
            except (ValueError, TypeError):
                return _error(f"القيمة غير صالحة للحقل {api_name}", status=400)
    
    if not updated_fields:
        return _error("لا توجد حقول لتحديثها", status=400)
    
    try:
        chat_room.save()
        
        # تسجيل التغيير
        log_message = f"تم تحديث: {', '.join(updated_fields)}"
        ChatMessage.objects.create(
            chat_room=chat_room,
            sender=user,
            content=f"[نظام] المدير {user.full_name}: {log_message}",
            message_type="system",
            is_edited=False,
            is_deleted=False
        )
        
        return JsonResponse({
            "success": True,
            "message": "تم تحديث الإعدادات بنجاح",
            "updatedFields": updated_fields,
            "chatRoom": {
                "id": chat_room.id,
                "name": chat_room.name,
                "description": chat_room.description,
                "maxMembers": chat_room.max_members,
                "status": chat_room.status,
                "readOnly": chat_room.read_only,
                "notificationsEnabled": chat_room.notifications_enabled,
            }
        })
    except Exception as exc:
        return _error(f"حدث خطأ: {exc}", status=500)


@csrf_exempt
@jwt_required
@require_http_methods(["GET"])
def get_chat_room_stats(request: HttpRequest, room_id: int) -> JsonResponse:
    """
    الحصول على إحصائيات شاملة للكروب.
    """
    user_id = get_jwt_identity(request)
    try:
        user = User.objects.get(pk=user_id)
        chat_room = ChatRoom.objects.get(pk=room_id)
    except (User.DoesNotExist, ChatRoom.DoesNotExist):
        return _error("غير مصرح لك أو الكروب غير موجود", status=403)
    
    # التحقق من عضوية المستخدم
    membership = ChatRoomMember.objects.filter(
        chat_room=chat_room,
        user=user,
        is_active=True
    ).first()
    
    if not membership:
        return _error("أنت لست عضواً في هذا الكروب", status=403)
    
    try:
        # إحصائيات الأعضاء
        total_members = ChatRoomMember.objects.filter(
            chat_room=chat_room,
            is_active=True
        ).count()
        
        admins = ChatRoomMember.objects.filter(
            chat_room=chat_room,
            role="admin",
            is_active=True
        ).count()
        
        moderators = ChatRoomMember.objects.filter(
            chat_room=chat_room,
            role="moderator",
            is_active=True
        ).count()
        
        # إحصائيات الرسائل
        total_messages = ChatMessage.objects.filter(
            chat_room=chat_room,
            is_deleted=False
        ).count()
        
        today_messages = ChatMessage.objects.filter(
            chat_room=chat_room,
            is_deleted=False,
            created_at__date=timezone.now().date()
        ).count()
        
        # أنشط الأعضاء
        active_users = ChatMessage.objects.filter(
            chat_room=chat_room,
            is_deleted=False
        ).values('sender__id', 'sender__full_name').annotate(
            message_count=Count('id')
        ).order_by('-message_count')[:10]
        
        return JsonResponse({
            "success": True,
            "statistics": {
                "members": {
                    "total": total_members,
                    "admins": admins,
                    "moderators": moderators,
                    "regular": total_members - admins - moderators,
                    "capacity": f"{total_members}/{chat_room.max_members}",
                },
                "messages": {
                    "total": total_messages,
                    "today": today_messages,
                    "average_per_day": round(total_messages / max(1, (timezone.now() - chat_room.created_at).days), 2),
                },
                "activity": {
                    "created_at": chat_room.created_at.isoformat(),
                    "last_activity": chat_room.last_activity.isoformat(),
                    "days_active": (timezone.now() - chat_room.created_at).days,
                },
                "top_contributors": [
                    {
                        "userId": user_stat['sender__id'],
                        "name": user_stat['sender__full_name'],
                        "messages": user_stat['message_count']
                    }
                    for user_stat in active_users
                ]
            }
        })
    except Exception as exc:
        return _error(f"حدث خطأ: {exc}", status=500)


@csrf_exempt
@jwt_required
@require_http_methods(["DELETE"])
def delete_chat_room(request: HttpRequest, room_id: int) -> JsonResponse:
    """
    حذف كروب بشكل آمن.
    يسمح فقط للمنشئ أو الموظفين.
    """
    user_id = get_jwt_identity(request)
    try:
        user = User.objects.get(pk=user_id)
        chat_room = ChatRoom.objects.get(pk=room_id)
    except (User.DoesNotExist, ChatRoom.DoesNotExist):
        return _error("غير مصرح لك أو الكروب غير موجود", status=403)
    
    # التحقق من الصلاحيات
    if user.role != "employee" and chat_room.created_by_id != user_id:
        return _error("فقط منشئ الكروب أو الموظفون يمكنهم حذفه", status=403)
    
    try:
        room_name = chat_room.name
        
        # حذف جميع الرسائل
        ChatMessage.objects.filter(chat_room=chat_room).delete()
        
        # حذف جميع الأعضاء
        ChatRoomMember.objects.filter(chat_room=chat_room).delete()
        
        # حذف الكروب
        chat_room.delete()
        
        return JsonResponse({
            "success": True,
            "message": f"تم حذف الكروب '{room_name}' بنجاح"
        })
    except Exception as exc:
        return _error(f"حدث خطأ أثناء الحذف: {exc}", status=500)


# ==================== MEMBER MANAGEMENT ====================

@csrf_exempt
@jwt_required
@require_http_methods(["POST"])
def manage_chat_room_member(request: HttpRequest, room_id: int) -> JsonResponse:
    """
    إدارة أعضاء الكروب (إضافة، ترقية، خفض، حظر).
    """
    user_id = get_jwt_identity(request)
    try:
        user = User.objects.get(pk=user_id)
        chat_room = ChatRoom.objects.get(pk=room_id)
    except (User.DoesNotExist, ChatRoom.DoesNotExist):
        return _error("غير مصرح لك أو الكروب غير موجود", status=403)
    
    # التحقق من أن المستخدم مدير
    admin_membership = ChatRoomMember.objects.filter(
        chat_room=chat_room,
        user=user,
        role="admin"
    ).first()
    
    if not admin_membership:
        return _error("فقط المديرون يمكنهم إدارة الأعضاء", status=403)
    
    data = _parse_json(request)
    target_user_id = data.get("targetUserId")
    action = data.get("action")  # add, promote, demote, ban
    
    if not target_user_id or not action:
        return _error("معرف المستخدم والإجراء مطلوبان", status=400)
    
    try:
        target_user = User.objects.get(pk=target_user_id)
    except User.DoesNotExist:
        return _error("المستخدم غير موجود", status=404)
    
    if target_user_id == user_id:
        return _error("لا يمكنك تطبيق إجراءات على حسابك", status=400)
    
    try:
        membership = ChatRoomMember.objects.filter(
            chat_room=chat_room,
            user=target_user
        ).first()
        
        if action == "add":
            if membership and membership.is_active:
                return _error("المستخدم موجود بالفعل في الكروب", status=400)
            
            ChatRoomMember.objects.create(
                chat_room=chat_room,
                user=target_user,
                role="member"
            )
            action_text = "إضافة"
            
        elif action == "promote":
            if not membership:
                return _error("المستخدم ليس عضواً في الكروب", status=400)
            membership.role = "moderator"
            membership.save()
            action_text = "ترقية"
            
        elif action == "demote":
            if not membership:
                return _error("المستخدم ليس عضواً في الكروب", status=400)
            membership.role = "member"
            membership.save()
            action_text = "خفض"
            
        elif action == "ban":
            if not membership:
                ChatRoomMember.objects.create(
                    chat_room=chat_room,
                    user=target_user,
                    role="member",
                    is_active=False
                )
            else:
                membership.is_active = False
                membership.save()
            action_text = "حظر"
            
        else:
            return _error("الإجراء غير معروف", status=400)
        
        # تسجيل الإجراء
        ChatMessage.objects.create(
            chat_room=chat_room,
            sender=user,
            content=f"[نظام] {action_text}: {target_user.full_name}",
            message_type="system"
        )
        
        return JsonResponse({
            "success": True,
            "message": f"تم {action_text} {target_user.full_name} بنجاح",
            "action": action,
            "targetUser": target_user.full_name
        })
        
    except Exception as exc:
        return _error(f"حدث خطأ: {exc}", status=500)


@jwt_required
@require_http_methods(["GET"])
def get_chat_room_members(request: HttpRequest, room_id: int) -> JsonResponse:
    """
    جلب قائمة أعضاء الكروب مع تفاصيلهم.
    """
    user_id = get_jwt_identity(request)
    try:
        user = User.objects.get(pk=user_id)
        chat_room = ChatRoom.objects.get(pk=room_id)
    except (User.DoesNotExist, ChatRoom.DoesNotExist):
        return _error("غير مصرح لك أو الكروب غير موجود", status=403)
    
    # التحقق من عضوية المستخدم
    membership = ChatRoomMember.objects.filter(
        chat_room=chat_room,
        user=user,
        is_active=True
    ).first()
    
    if not membership:
        return _error("أنت لست عضواً في هذا الكروب", status=403)
    
    try:
        members = ChatRoomMember.objects.filter(
            chat_room=chat_room,
            is_active=True
        ).select_related('user').order_by('-joined_at')
        
        members_list = []
        for member in members:
            # عد الرسائل
            message_count = ChatMessage.objects.filter(
                chat_room=chat_room,
                sender=member.user,
                is_deleted=False
            ).count()
            
            members_list.append({
                "userId": member.user.id,
                "fullName": member.user.full_name,
                "username": member.user.username,
                "email": member.user.email,
                "role": member.role,
                "joinedAt": member.joined_at.isoformat(),
                "lastActive": member.last_active.isoformat(),
                "messageCount": message_count,
                "status": "نشط" if (timezone.now() - member.last_active).total_seconds() < 3600 else "غير نشط"
            })
        
        return JsonResponse({
            "success": True,
            "members": members_list,
            "total": len(members_list),
            "yourRole": membership.role
        })
        
    except Exception as exc:
        return _error(f"حدث خطأ: {exc}", status=500)


# ==================== MESSAGE SEARCH & MANAGEMENT ====================

@jwt_required
@require_http_methods(["GET"])
def search_chat_messages(request: HttpRequest, room_id: int) -> JsonResponse:
    """
    البحث عن الرسائل في الكروب.
    """
    user_id = get_jwt_identity(request)
    try:
        user = User.objects.get(pk=user_id)
        chat_room = ChatRoom.objects.get(pk=room_id)
    except (User.DoesNotExist, ChatRoom.DoesNotExist):
        return _error("غير مصرح لك أو الكروب غير موجود", status=403)
    
    # التحقق من عضوية المستخدم
    membership = ChatRoomMember.objects.filter(
        chat_room=chat_room,
        user=user,
        is_active=True
    ).first()
    
    if not membership:
        return _error("أنت لست عضواً في هذا الكروب", status=403)
    
    query = request.GET.get("q", "").strip()
    if len(query) < 2:
        return _error("يجب إدخال كلمة بحث بطول حرفين على الأقل", status=400)
    
    try:
        messages = ChatMessage.objects.filter(
            chat_room=chat_room,
            content__icontains=query,
            is_deleted=False
        ).select_related('sender').order_by('-created_at')[:50]
        
        results = []
        for msg in messages:
            results.append({
                "id": msg.id,
                "content": msg.content,
                "sender": {
                    "id": msg.sender.id,
                    "name": msg.sender.full_name
                },
                "createdAt": msg.created_at.isoformat(),
                "messageType": msg.message_type
            })
        
        return JsonResponse({
            "success": True,
            "query": query,
            "results": results,
            "total": len(results)
        })
        
    except Exception as exc:
        return _error(f"حدث خطأ: {exc}", status=500)


@csrf_exempt
@jwt_required
@require_http_methods(["DELETE"])
def delete_chat_message(request: HttpRequest, room_id: int, message_id: int) -> JsonResponse:
    """
    حذف رسالة من الكروب.
    """
    user_id = get_jwt_identity(request)
    try:
        user = User.objects.get(pk=user_id)
        chat_room = ChatRoom.objects.get(pk=room_id)
        message = ChatMessage.objects.get(pk=message_id, chat_room=chat_room)
    except (User.DoesNotExist, ChatRoom.DoesNotExist, ChatMessage.DoesNotExist):
        return _error("غير مصرح لك أو الرسالة غير موجودة", status=403)
    
    # التحقق من الصلاحيات
    is_sender = message.sender_id == user_id
    is_admin = ChatRoomMember.objects.filter(
        chat_room=chat_room,
        user=user,
        role__in=["admin", "moderator"]
    ).exists()
    
    if not is_sender and not is_admin:
        return _error("لا يمكنك حذف هذه الرسالة", status=403)
    
    try:
        message.is_deleted = True
        message.save()
        
        return JsonResponse({
            "success": True,
            "message": "تم حذف الرسالة بنجاح"
        })
    except Exception as exc:
        return _error(f"حدث خطأ: {exc}", status=500)


# ==================== BULK OPERATIONS ====================

@csrf_exempt
@jwt_required
@require_http_methods(["POST"])
def archive_chat_room(request: HttpRequest, room_id: int) -> JsonResponse:
    """
    أرشفة كروب (منع الرسائل الجديدة لكن الحفاظ على البيانات).
    """
    user_id = get_jwt_identity(request)
    try:
        user = User.objects.get(pk=user_id)
        chat_room = ChatRoom.objects.get(pk=room_id)
    except (User.DoesNotExist, ChatRoom.DoesNotExist):
        return _error("غير مصرح لك أو الكروب غير موجود", status=403)
    
    # التحقق من الصلاحيات
    if user.role != "employee" and chat_room.created_by_id != user_id:
        return _error("فقط منشئ الكروب أو الموظفون يمكنهم أرشفتها", status=403)
    
    try:
        chat_room.status = "archived"
        chat_room.read_only = True
        chat_room.save()
        
        ChatMessage.objects.create(
            chat_room=chat_room,
            sender=user,
            content=f"[نظام] تم أرشفة الكروب بواسطة {user.full_name}",
            message_type="system"
        )
        
        return JsonResponse({
            "success": True,
            "message": "تم أرشفة الكروب بنجاح"
        })
    except Exception as exc:
        return _error(f"حدث خطأ: {exc}", status=500)
