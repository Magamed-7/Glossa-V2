from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from users.views import (
    ChangePasswordView,
    ConfirmDisable2FAView,
    ConfirmEmailChangeView,
    ConfirmEnable2FAView,
    LoginView,
    MeView,
    RegisterView,
    RequestDisable2FAView,
    RequestEmailChangeView,
    RequestEnable2FAView,
    ResendVerificationView,
    Verify2FALoginView,
    VerifyEmailView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    PasswordResetVerifyView,
)

urlpatterns = [
    path('register', RegisterView.as_view(), name='register'),
    path('login', LoginView.as_view(), name='login'),
    path('login/2fa', Verify2FALoginView.as_view(), name='login-2fa'),
    path('refresh', TokenRefreshView.as_view(), name='refresh'),
    path('me', MeView.as_view(), name='me'),
    path('me/email/change/request', RequestEmailChangeView.as_view(), name='email-change-request'),
    path('me/email/change/confirm', ConfirmEmailChangeView.as_view(), name='email-change-confirm'),
    path('change-password', ChangePasswordView.as_view(), name='change-password'),
    path('verify-email', VerifyEmailView.as_view(), name='verify-email'),
    path('verify-email/resend', ResendVerificationView.as_view(), name='verify-email-resend'),
    path('2fa/enable/request', RequestEnable2FAView.as_view(), name='2fa-enable-request'),
    path('2fa/enable/confirm', ConfirmEnable2FAView.as_view(), name='2fa-enable-confirm'),
    path('2fa/disable/request', RequestDisable2FAView.as_view(), name='2fa-disable-request'),
    path('2fa/disable/confirm', ConfirmDisable2FAView.as_view(), name='2fa-disable-confirm'),
    path('password-reset', PasswordResetRequestView.as_view(), name='password-reset'),
    path('password-reset/verify', PasswordResetVerifyView.as_view(), name='password-reset-verify'),
    path('password-reset/confirm', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
]
