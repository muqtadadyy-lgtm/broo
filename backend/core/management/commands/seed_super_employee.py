import os

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand
from django.db import transaction

from core.models import User


class Command(BaseCommand):
    help = "Seed a single super employee (if none exists)"

    def handle(self, *args, **options):
        try:
            # Check if super employee already exists
            existing = User.objects.filter(role="super_employee").first()
            if existing:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Super employee already exists: {existing.username}"
                    )
                )
                return

            # Create super employee with default credentials
            username = os.getenv("SUPER_EMPLOYEE_USERNAME", "admin")
            email = os.getenv("SUPER_EMPLOYEE_EMAIL", "admin@university.edu")
            password = os.getenv("SUPER_EMPLOYEE_PASSWORD", "admin123")
            full_name = os.getenv("SUPER_EMPLOYEE_NAME", "الموظف الرئيسي")

            super_employee = User.objects.create(
                username=username,
                email=email,
                full_name=full_name,
                password_hash=make_password(password),
                role="super_employee",
            )

            self.stdout.write(
                self.style.SUCCESS(
                    f"Super employee created successfully!\n"
                    f"Username: {username}\n"
                    f"Email: {email}\n"
                    f"Password: {password}\n"
                    f"Please change the password after first login."
                )
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Error creating super employee: {e}")
            )
