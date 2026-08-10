from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('author', 'Author'),
        ('admin', 'Admin'),
    ]

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    is_2fa_enabled = models.BooleanField(default=False)

    last_username_change_at = models.DateTimeField(null=True, blank=True)
    last_email_change_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'users'
