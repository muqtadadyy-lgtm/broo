import os

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand
from django.db import transaction

from core.models import User


class Command(BaseCommand):
    help = "Seed a single super employee (if none exists)"

    def handle(self, *args, **options):
        existing = User.objects.filter(role="super_employee").first()
        if existing:
            self.stdout.write(
                self.style.WARNING(
                    "Super employee already exists: %s" % existing.username
                )
            )
            return

        username = os.getenv("SUPER_EMPLOYEE_USERNAME", "user")
        email = os.getenv("SUPER_EMPLOYEE_EMAIL", "user@watania.edu.iq")
        full_name = os.getenv("SUPER_EMPLOYEE_FULL_NAME", "المسؤول الرئيسي")
        password = os.getenv("SUPER_EMPLOYEE_PASSWORD", "user123")

        with transaction.atomic():
            user = User.objects.create(
                full_name=full_name,
                username=username,
                email=email,
                password_hash=make_password(password),
                role="super_employee",
            )

        self.stdout.write(
            self.style.SUCCESS("Super employee created: %s" % user.username)
        )
