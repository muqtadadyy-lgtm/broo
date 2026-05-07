# Generated migration for adding is_system_notification field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_alter_activity_options_alter_application_options_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='message',
            name='is_system_notification',
            field=models.BooleanField(default=False),
        ),
    ]
