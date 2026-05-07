import os

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand
from django.db import transaction

from core.models import User


class Command(BaseCommand):
    help = "Seed a single super employee (if none exists)"

    def handle(self, *args, **options):
        # DISABLED: Super user creation disabled to prevent Railway restart loop
        self.stdout.write(
            self.style.WARNING(
                "Super user creation DISABLED for Railway stability"
            )
        )
        return
