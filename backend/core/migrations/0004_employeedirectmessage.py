from django.db import migrations, models
import django.db.models.deletion
from django.utils import timezone


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0003_message"),
    ]

    operations = [
        migrations.CreateModel(
            name="EmployeeDirectMessage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("text", models.TextField()),
                ("created_at", models.DateTimeField(default=timezone.now)),
                (
                    "receiver",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="direct_messages_received",
                        to="core.user",
                    ),
                ),
                (
                    "sender",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="direct_messages_sent",
                        to="core.user",
                    ),
                ),
            ],
            options={
                "db_table": "employee_direct_messages",
                "indexes": [
                    models.Index(fields=["sender"], name="core_employ_sender__f5e192_idx"),
                    models.Index(fields=["receiver"], name="core_employ_receiver_f03e8b_idx"),
                    models.Index(fields=["created_at"], name="core_employ_created_82782e_idx"),
                ],
            },
        ),
    ]
