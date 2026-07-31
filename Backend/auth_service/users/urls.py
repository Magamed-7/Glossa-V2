from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from users.views import (
    ChangePasswordView,
    Confirm2FAView,
    Disable2FAView,
    LoginView,
    MeView,
    RegisterView,
    ResendVerificationView,
    Setup2FAView,
    Verify2FALoginView,
    VerifyEmailView,
)

urlpatterns = [
    path('register', RegisterView.as_view(), name='register'),
    path('login', LoginView.as_view(), name='login'),
    path('login/2fa', Verify2FALoginView.as_view(), name='login-2fa'),
    path('refresh', TokenRefreshView.as_view(), name='refresh'),
    path('me', MeView.as_view(), name='me'),
    path('change-password', ChangePasswordView.as_view(), name='change-password'),
    path('verify-email', VerifyEmailView.as_view(), name='verify-email'),
    path('verify-email/resend', ResendVerificationView.as_view(), name='verify-email-resend'),
    path('2fa/setup', Setup2FAView.as_view(), name='2fa-setup'),
    path('2fa/confirm', Confirm2FAView.as_view(), name='2fa-confirm'),
    path('2fa/disable', Disable2FAView.as_view(), name='2fa-disable'),
]
