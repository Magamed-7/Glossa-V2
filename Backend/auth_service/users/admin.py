from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from users.models import User


@admin.register(User)
class GlossaUserAdmin(UserAdmin):
    list_display = ['id', 'username', 'email', 'role', 'is_verified', 'is_staff']
    list_filter = ['role', 'is_verified', 'is_staff']
    fieldsets = UserAdmin.fieldsets + (
        ('Glossa', {'fields': ('role', 'is_verified')}),
    )
