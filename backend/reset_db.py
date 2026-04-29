#!/usr/bin/env python
"""Reset database - delete all users except root admin"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'university_activities.settings')
django.setup()

from core.models import User
from django.contrib.auth.hashers import make_password

# Delete all users
User.objects.all().delete()

# Create only root admin
admin = User.objects.create(
    username='user',
    email='user@watania.edu.iq',
    full_name='المسؤول الرئيسي',
    password_hash=make_password('user123'),
    role='super_employee'
)

print(f"✓ Database reset complete")
print(f"✓ Root admin created: {admin.username}")
print(f"✓ Total users: {User.objects.count()}")

# Verify
for user in User.objects.all():
    print(f"  - {user.username} ({user.role})")
