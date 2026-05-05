# نشر المشروع على Railway

## الخطوة 1: رفع الكود إلى GitHub

1. أنشئ مستودع جديد في GitHub.
2. من داخل مجلد المشروع شغّل:

```powershell
git init
git add .
git commit -m "Initial Railway deployment setup"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

## الخطوة 2: إنشاء مشروع على Railway

1. افتح [railway.app](https://railway.app)
2. سجّل الدخول بواسطة GitHub
3. اضغط "New Project"
4. اختر "Deploy from GitHub repo"
5. اختر المستودع الذي رفعت له المشروع
6. Railway سيقرأ `railway.yaml` تلقائياً وينشئ:
   - خدمة ويب Django
   - قاعدة بيانات PostgreSQL

## الخطوة 3: ربط قاعدة البيانات الموجودة

إذا كانت لديك قاعدة بيانات موجودة باسم `Postgres-ifoq`:

1. في مشروع Railway، اذهب إلى إعدادات خدمة Django
2. في قسم "Variables"، أضف متغير:
   - المفتاح: `DATABASE_URL`
   - القيمة: انسخها من قاعدة البيانات `Postgres-ifoq` (اضغط على المتغير واختر "Copy Value")
3. أو استخدم Railway UI لربط قاعدة البيانات:
   - اضغط على قاعدة البيانات `Postgres-ifoq`
   - اختر "Connect" وحدد خدمة Django

## الخطوة 4: إضافة متغيرات البيئة الإضافية

في خدمة Django، أضف هذه المتغيرات:

```
DEBUG=False
DJANGO_SECRET_KEY=قيمة-عشوائية-طويلة-وأمنة
JWT_SECRET_KEY=قيمة-عشوائية-أخرى-أمنة
ALLOWED_HOSTS=.railway.app
CSRF_TRUSTED_ORIGINS=https://اسم-الخدمة.railway.app
```

## الخطوة 5: النشر

1. Railway سيبدأ النشر تلقائياً بعد إضافة المتغيرات
2. انتظر حتى تظهر الحالة "Deployed"
3. اضغط على رابط الخدمة لفتح الموقع

## الخطوة 6: تشغيل الترحيلات

بعد النشر الأولي، قد تحتاج لتشغيل الترحيلات يدوياً:

1. افتح "Console" في خدمة Django
2. شغّل:
```bash
python manage.py migrate
```

## الاتصال المحلي بقاعدة بيانات Railway

للاتصال بقاعدة بيانات Railway من جهازك المحلي:

1. في Railway، انسخ قيمة `DATABASE_URL` من قاعدة البيانات
2. أنشئ ملف `backend/.env`:
```env
DEBUG=True
DATABASE_URL=postgresql://user:pass@host:port/dbname
DJANGO_SECRET_KEY=django-insecure-local
JWT_SECRET_KEY=local-jwt-secret
ALLOWED_HOSTS=localhost,127.0.0.1
```

3. شغّل الخادم محلياً:
```bash
cd backend
python manage.py runserver
```

## ملاحظات مهمة

- لا ترفع `db.sqlite3` للإنتاج
- لا ترفع `backend/.env` إلى GitHub
- Railway المجاني قد يتأخر فتح الموقع أول مرة بعد الخمول
- للإنتاج، استخدم خطة مدفوعة للحصول على أداء أفضل
