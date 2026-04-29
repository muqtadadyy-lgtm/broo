# نشر المشروع باستخدام GitHub + Render

هذا المشروع لا يمكن تشغيله بالكامل على GitHub فقط، لأن:

- `GitHub` يحفظ الكود.
- `GitHub Pages` يشغّل مواقع ثابتة فقط، وليس `Django`.
- قاعدة البيانات تحتاج خدمة حقيقية مثل `PostgreSQL` أو `MySQL`.

الحل الصحيح:

- ارفع الكود إلى `GitHub`.
- اربط المستودع مع `Render`.
- Render يشغّل مشروع Django.
- Render ينشئ قاعدة بيانات PostgreSQL مرتبطة بالمشروع.

## ما تم تجهيزه داخل المشروع

- ملف [render.yaml](C:\Users\pro\Desktop\bro\render.yaml) للنشر التلقائي.
- ملف [backend/build.sh](C:\Users\pro\Desktop\bro\backend\build.sh) لتثبيت الحزم وتشغيل الترحيلات.
- ملف [backend/.env.example](C:\Users\pro\Desktop\bro\backend\.env.example) كمرجع للمتغيرات.
- تحسين تجاهل الملفات المحلية في [.gitignore](C:\Users\pro\Desktop\bro\.gitignore).

## خطوات الرفع إلى GitHub

1. أنشئ مستودع جديد في GitHub.
2. من داخل مجلد المشروع شغّل:

```powershell
git init
git add .
git commit -m "Initial deploy setup"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

## خطوات النشر على Render

1. افتح `render.com`.
2. سجّل الدخول بواسطة GitHub.
3. اختر `New` ثم `Blueprint`.
4. اختر المستودع الذي رفعت له المشروع.
5. Render سيقرأ `render.yaml` وينشئ:
   - خدمة ويب Django
   - قاعدة بيانات PostgreSQL
6. بعد انتهاء الإنشاء، افتح إعدادات خدمة الويب وأضف:
   - `CSRF_TRUSTED_ORIGINS=https://اسم-الخدمة.onrender.com`
   - `SUPER_EMPLOYEE_USERNAME`
   - `SUPER_EMPLOYEE_EMAIL`
   - `SUPER_EMPLOYEE_FULL_NAME`
   - `SUPER_EMPLOYEE_PASSWORD`
7. أعد النشر `Manual Deploy` أو `Deploy latest commit`.

## ملاحظات مهمة

- لا ترفع `db.sqlite3` للإنتاج.
- لا ترفع مجلد `backend/media` إذا كان يحتوي ملفات مستخدمين حقيقية.
- في Render المجاني قد يتأخر فتح الموقع أول مرة بعد الخمول.
- إذا أردت حفظ الملفات المرفوعة دائمًا، فالأفضل لاحقًا استخدام تخزين خارجي مثل `Cloudinary` أو `S3`.

## تسجيل الدخول الأول

أمر `seed_super_employee` سيُنشئ المستخدم الإداري من القيم الموجودة في متغيرات البيئة بدل القيم الثابتة.
