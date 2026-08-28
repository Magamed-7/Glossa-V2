from django.conf import settings
from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from users import two_factor, verification
from users.models import User
from users.serializers import (
    ChangePasswordSerializer,
    PasswordConfirmSerializer,
    RegisterSerializer,
    RequestEmailChangeSerializer,
    TwoFactorCodeSerializer,
    UpdateMeSerializer,
    UserSerializer,
    VerifyEmailSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetVerifySerializer,
)
from users.throttles import (
    EmailChangeRateThrottle,
    LoginRateThrottle,
    PasswordResetRateThrottle,
    TwoFactorRateThrottle,
)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        email_sent = True

        try:
            verification.send_verification_email(user)
        except verification.ResendCooldownError:
            email_sent = False

        data = serializer.data
        data['email_sent'] = email_sent
        return Response(data, status=status.HTTP_201_CREATED)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UpdateMeSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        new_username = serializer.validated_data.get('username')
        username_changed = new_username is not None and new_username != request.user.username

        user = serializer.save()

        if username_changed:
            user.last_username_change_at = timezone.now()
            user.save(update_fields=['last_username_change_at'])

        return Response(UserSerializer(user).data)

    def delete(self, request):
        serializer = PasswordConfirmSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        request.user.is_active = False
        request.user.save(update_fields=['is_active'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class RequestEmailChangeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [EmailChangeRateThrottle]

    def post(self, request):
        serializer = RequestEmailChangeSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        new_email = serializer.validated_data['new_email']

        try:
            verification.send_email_change_code(request.user, new_email)
        except verification.ResendCooldownError as exc:
            return Response(
                {'detail': 'Please wait before requesting another code', 'seconds_left': exc.seconds_left},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        return Response({'detail': 'Code sent'})


class ConfirmEmailChangeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [EmailChangeRateThrottle]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_email = verification.confirm_email_change_code(request.user, serializer.validated_data['code'])

        if new_email is None:
            return Response({'detail': 'Invalid or expired code'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(UserSerializer(request.user).data)


class VerifyEmailView(APIView):
    # The six digits mailed to the address are themselves the proof of ownership, so
    # requiring a live session on top only broke honest sign-ups: the access token
    # expires in 30 minutes, and anyone who waited for a slow mail, reopened the site
    # or finished on another device was told their credentials were missing.
    permission_classes = [permissions.AllowAny]
    throttle_classes = [TwoFactorRateThrottle]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user if request.user.is_authenticated else None

        if user is None:
            email = serializer.validated_data.get('email')
            if not email:
                return Response(
                    {'detail': 'Email is required to confirm the code'}, status=status.HTTP_400_BAD_REQUEST
                )
            user = User.objects.filter(email__iexact=email).first()

        # An unknown address is answered exactly like a wrong code, so this endpoint
        # cannot be used to find out which emails are registered.
        if user is None or not verification.confirm_verification_code(user, serializer.validated_data['code']):
            return Response({'detail': 'Code is invalid or expired'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(UserSerializer(user).data)


class ResendVerificationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.is_verified:
            return Response({'detail': 'Email is already verified'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            verification.send_verification_email(request.user)
        except verification.ResendCooldownError as exc:
            return Response(
                {'detail': 'Please wait before requesting another code', 'seconds_left': exc.seconds_left},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        data = {'detail': 'Verification code sent'}
        return Response(data)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save(update_fields=['password'])
        return Response({'detail': 'Password changed'})


def _issue_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {'refresh': str(refresh), 'access': str(refresh.access_token)}


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        identifier = request.data.get('username')
        username = identifier

        if identifier and '@' in identifier:
            existing = User.objects.filter(email__iexact=identifier).first()
            if existing is not None:
                username = existing.username

        user = authenticate(request, username=username, password=request.data.get('password'))

        if user is None:
            return Response(
                {'detail': 'No active account found with the given credentials'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if user.is_2fa_enabled:
            pending_token = two_factor.create_pending_login(user)
            return Response({'requires_2fa': True, 'pending_token': pending_token})

        return Response(_issue_tokens(user))


class Verify2FALoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [TwoFactorRateThrottle]

    def post(self, request):
        pending_token = request.data.get('pending_token')

        serializer = TwoFactorCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_id = two_factor.verify_login_code(pending_token, serializer.validated_data['code']) if pending_token else None

        if user_id is None:
            return Response({'detail': 'Pending login is invalid, expired, or the code is wrong'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(id=user_id, is_active=True).first()

        if user is None:
            return Response({'detail': 'No active account found with the given credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        return Response(_issue_tokens(user))


class RequestEnable2FAView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.is_2fa_enabled:
            return Response({'detail': '2FA is already enabled'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = PasswordConfirmSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        try:
            two_factor.send_enable_code(request.user)
        except two_factor.ResendCooldownError as exc:
            return Response(
                {'detail': 'Please wait before requesting another code', 'seconds_left': exc.seconds_left},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        return Response({'detail': 'Code sent'})


class ConfirmEnable2FAView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [TwoFactorRateThrottle]

    def post(self, request):
        serializer = TwoFactorCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not two_factor.confirm_enable_code(request.user, serializer.validated_data['code']):
            return Response({'detail': 'Invalid code'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'is_2fa_enabled': True})


class RequestDisable2FAView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PasswordConfirmSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        try:
            two_factor.send_disable_code(request.user)
        except two_factor.ResendCooldownError as exc:
            return Response(
                {'detail': 'Please wait before requesting another code', 'seconds_left': exc.seconds_left},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        return Response({'detail': 'Code sent'})


class ConfirmDisable2FAView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [TwoFactorRateThrottle]

    def post(self, request):
        serializer = TwoFactorCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not two_factor.confirm_disable_code(request.user, serializer.validated_data['code']):
            return Response({'detail': 'Invalid code'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'is_2fa_enabled': False})


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        try:
            verification.send_password_reset_email(email)
        except verification.ResendCooldownError as exc:
            return Response(
                {'detail': f'Please wait {exc.seconds_left} seconds before requesting again.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({'detail': 'Reset code sent.'})


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        code = serializer.validated_data['code']
        password = serializer.validated_data['password']

        if not verification.verify_password_reset_code(email, code):
            return Response({'detail': 'Invalid or expired code.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        user.set_password(password)
        user.is_verified = True
        user.save(update_fields=['password', 'is_verified'])

        verification.delete_password_reset_code(email)

        return Response({'detail': 'Password reset successful.'})


class PasswordResetVerifyView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        serializer = PasswordResetVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        code = serializer.validated_data['code']

        if not verification.verify_password_reset_code(email, code):
            return Response({'detail': 'Invalid or expired code.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'detail': 'Code is correct.'})


