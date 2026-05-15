# 🎯 دليل إدارة كروبات الدردشة المحسنة
## Enhanced Chat Room Management Guide

---

## 📋 الفهرس
1. [نظرة عامة](#نظرة-عامة)
2. [الميزات الجديدة](#الميزات-الجديدة)
3. [الـ API Endpoints](#api-endpoints)
4. [أمثلة الاستخدام](#أمثلة-الاستخدام)
5. [أفضل الممارسات](#أفضل-الممارسات)

---

## 🌟 نظرة عامة

تم تطوير نظام شامل لإدارة كروبات الدردشة يوفر:
- ✅ **إدارة متقدمة للأعضاء**
- ✅ **إحصائيات شاملة**
- ✅ **بحث عن الرسائل**
- ✅ **أمان محسن**
- ✅ **أرشفة وحذف آمن**

---

## 🎨 الميزات الجديدة

### 1️⃣ تحديث إعدادات الكروب

**الميزة:** تحديث جميع إعدادات الكروب بشكل آمن

**الحقول المتاحة:**
```json
{
  "name": "اسم الكروب",
  "description": "الوصف",
  "rules": "قواعد الكروب",
  "welcomeMessage": "رسالة الترحيب",
  "maxMembers": 100,
  "messageRetention": "forever",
  "notificationsEnabled": true,
  "readOnly": false,
  "autoModEnabled": true
}
```

**الصلاحيات:** مديرو الكروب فقط

---

### 2️⃣ إحصائيات الكروب الشاملة

**الميزة:** الحصول على تقرير شامل عن الكروب

**البيانات المعادة:**
```json
{
  "members": {
    "total": 50,
    "admins": 2,
    "moderators": 5,
    "regular": 43,
    "capacity": "50/100"
  },
  "messages": {
    "total": 2500,
    "today": 123,
    "average_per_day": 25.5
  },
  "activity": {
    "created_at": "2026-05-15T10:00:00Z",
    "last_activity": "2026-05-15T18:30:00Z",
    "days_active": 5
  },
  "top_contributors": [
    {
      "userId": 1,
      "name": "أحمد محمد",
      "messages": 450
    }
  ]
}
```

---

### 3️⃣ إدارة أعضاء الكروب

**الإجراءات المتاحة:**
- `add` - إضافة عضو جديد
- `promote` - ترقية عضو إلى مشرف
- `demote` - خفض درجة عضو
- `ban` - حظر عضو

**مثال الطلب:**
```json
{
  "targetUserId": 42,
  "action": "promote"
}
```

**الصلاحيات:** مديرو الكروب فقط

---

### 4️⃣ البحث عن الرسائل

**الميزة:** البحث السريع في جميع الرسائل

**المعاملات:**
- `q` - كلمة البحث (يجب أن تكون 2 حرف على الأقل)

**النتائج:**
- أحدث 50 رسالة مطابقة
- معلومات المرسل
- وقت الإرسال

**الصلاحيات:** أعضاء الكروب فقط

---

### 5️⃣ حذف الرسائل بأمان

**الميزة:** حذف آمن مع الحفاظ على النزاهة

**من يمكنه الحذف:**
- ✅ مرسل الرسالة
- ✅ مديرو/مشرفو الكروب

**السلوك:**
- لا يتم حذف فعلي، تُعلم الرسالة كـ "محذوفة"
- يمكن الاستعادة من المسلمات

---

### 6️⃣ أرشفة الكروب

**الميزة:** تجميد الكروب مع الحفاظ على البيانات

**التأثيرات:**
- منع الرسائل الجديدة
- الاحتفاظ بجميع البيانات التاريخية
- يمكن إعادة التفعيل لاحقاً

**الصلاحيات:** منشئ الكروب أو الموظفون

---

### 7️⃣ حذف الكروب نهائياً

**التحذير:** ⚠️ هذا الإجراء لا يمكن عكسه

**يتم حذف:**
- ❌ جميع الرسائل
- ❌ جميع الأعضاء
- ❌ جميع البيانات الأخرى

**الصلاحيات:** منشئ الكروب أو الموظفون

---

## 🔌 API Endpoints

### تحديث الإعدادات
```
PUT /api/chat-rooms/{roomId}/settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "الاسم الجديد",
  "description": "الوصف الجديد"
}
```

### الحصول على الإحصائيات
```
GET /api/chat-rooms/{roomId}/stats
Authorization: Bearer {token}
```

### إدارة الأعضاء
```
POST /api/chat-rooms/{roomId}/members/manage
Authorization: Bearer {token}
Content-Type: application/json

{
  "targetUserId": 42,
  "action": "promote"
}
```

### جلب الأعضاء
```
GET /api/chat-rooms/{roomId}/members
Authorization: Bearer {token}
```

### البحث عن الرسائل
```
GET /api/chat-rooms/{roomId}/search?q=كلمة_البحث
Authorization: Bearer {token}
```

### حذف رسالة
```
DELETE /api/chat-rooms/{roomId}/messages/{messageId}/delete
Authorization: Bearer {token}
```

### أرشفة الكروب
```
POST /api/chat-rooms/{roomId}/archive
Authorization: Bearer {token}
```

### حذف الكروب
```
DELETE /api/chat-rooms/{roomId}/delete
Authorization: Bearer {token}
```

---

## 💡 أمثلة الاستخدام

### مثال 1: إنشاء كروب وإضافة أعضاء

```javascript
// 1. إنشاء الكروب
const createRoom = await fetch('/api/chat-rooms', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'كروب المشاريع',
    description: 'كروب خاص بمناقشة المشاريع الجامعية',
    type: 'project',
    privacy: 'private',
    maxMembers: 50,
    rules: 'احترم الجميع وتجنب الكلام المسيء'
  })
});

const room = await createRoom.json();
const roomId = room.chatRoom.id;

// 2. إضافة أعضاء
const addMember = await fetch(`/api/chat-rooms/${roomId}/members/manage`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    targetUserId: 25,
    action: 'add'
  })
});
```

### مثال 2: الحصول على الإحصائيات

```javascript
const stats = await fetch(`/api/chat-rooms/${roomId}/stats`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await stats.json();
console.log(`عدد الأعضاء: ${data.statistics.members.total}`);
console.log(`عدد الرسائل: ${data.statistics.messages.total}`);
console.log(`أكثر المساهمين: ${data.statistics.top_contributors[0].name}`);
```

### مثال 3: البحث عن رسائل

```javascript
const search = await fetch(
  `/api/chat-rooms/${roomId}/search?q=مشروع`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const results = await search.json();
results.results.forEach(msg => {
  console.log(`${msg.sender.name}: ${msg.content}`);
  console.log(`وقت الإرسال: ${msg.createdAt}`);
});
```

### مثال 4: ترقية عضو

```javascript
const promote = await fetch(`/api/chat-rooms/${roomId}/members/manage`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    targetUserId: 25,
    action: 'promote'
  })
});

const result = await promote.json();
console.log(result.message); // "تم ترقية أحمد محمد بنجاح"
```

---

## 🔒 أفضل الممارسات

### 1. الأمان
```javascript
✅ تحقق دائماً من الصلاحيات قبل العمليات الحساسة
✅ استخدم HTTPS في الإنتاج
✅ لا تحفظ أبداً التوكنات في localStorage
❌ لا تشارك البيانات السرية في الرسائل
❌ لا تحذف البيانات بدون تأكيد من المستخدم
```

### 2. الأداء
```javascript
✅ استخدم البحث للعثور على الرسائل القديمة
✅ طبق pagination للرسائل الكثيرة
✅ احفظ الإحصائيات في الذاكرة المؤقتة
❌ لا تجلب جميع الرسائل دفعة واحدة
❌ لا تحدّث الإعدادات بكثرة
```

### 3. تجربة المستخدم
```javascript
✅ أظهر رسالة تأكيد قبل حذف الكروب
✅ أخطر المستخدمين عند تحديث الإعدادات
✅ وضح نتائج البحث بشكل واضح
✅ اعرض رسائل خطأ مفيدة
```

### 4. الامتثال
```javascript
✅ احذف البيانات عند طلب المستخدم
✅ احفظ السجلات للعمليات المهمة
✅ احترم خصوصية المستخدمين
✅ طبق GDPR إن أمكن
```

---

## 📊 سجل التغييرات

### v1.0.0 - 15 مايو 2026
- ✨ إضافة تحديث الإعدادات
- ✨ إضافة الإحصائيات الشاملة
- ✨ إضافة إدارة الأعضاء
- ✨ إضافة البحث والحذف
- ✨ إضافة الأرشفة

---

## 🤝 الدعم والمساعدة

**للإبلاغ عن مشاكل:**
- 📧 البريد الإلكتروني: support@university.edu
- 🐛 GitHub Issues
- 💬 قنوات الدعم الداخلية

---

**تم التطوير من قبل:** فريق تطوير الأنشطة الجامعية
**آخر تحديث:** 15 مايو 2026
**الحالة:** ✅ جاهز للإنتاج
