# Generated manually for user role feature

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0011_user_custom_hotkeys"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="role",
            field=models.CharField(
                choices=[('owner', 'Owner'), ('contributor', 'Contributor')],
                default='owner',
                help_text='User role in the organization',
                max_length=20,
                verbose_name='user role',
            ),
        ),
    ]
