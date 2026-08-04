from django.conf import settings
from django.contrib.auth import authenticate
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
    TwoFactorCodeSerializer,
    UpdateMeSerializer,
    UserSerializer,
    VerifyEmailSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetVerifySerializer,
)
from users.throttles import LoginRateThrottle, TwoFactorRateThrottle


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

        new_email = serializer.validated_data.get('email')
        email_changed = new_email is not None and new_email != request.user.email

        user = serializer.save()

        email_sent = None

        if email_changed:
            user.is_verified = False
            user.save(update_fields=['is_verified'])

            email_sent = True

            try:
                verification.send_verification_email(user)
            except verification.ResendCooldownError:
                email_sent = False

        data = UserSerializer(user).data
        data['email_sent'] = email_sent
        return Response(data)

    def delete(self, request):
        serializer = PasswordConfirmSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        request.user.is_active = False
        request.user.save(update_fields=['is_active'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class VerifyEmailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        confirmed = verification.confirm_verification_code(request.user, serializer.validated_data['code'])

        if not confirmed:
            return Response({'detail': 'Code is invalid or expired'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(UserSerializer(request.user).data)


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
        user_id = two_factor.resolve_pending_login(pending_token) if pending_token else None

        if user_id is None:
            return Response({'detail': 'Pending login is invalid or expired'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(id=user_id, is_active=True).first()

        if user is None:
            return Response({'detail': 'No active account found with the given credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = TwoFactorCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data['code']

        valid = two_factor.verify_totp_code(user.totp_secret, code) or two_factor.consume_backup_code(user, code)

        if not valid:
            return Response({'detail': 'Invalid code'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(_issue_tokens(user))


class Setup2FAView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.is_2fa_enabled:
            return Response({'detail': '2FA is already enabled'}, status=status.HTTP_400_BAD_REQUEST)

        secret = two_factor.generate_totp_secret()
        request.user.totp_secret = secret
        request.user.save(update_fields=['totp_secret'])

        return Response({'secret': secret, 'otpauth_uri': two_factor.get_totp_uri(request.user, secret)})


class Confirm2FAView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not request.user.totp_secret:
            return Response({'detail': 'Call 2fa/setup first'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = TwoFactorCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not two_factor.verify_totp_code(request.user.totp_secret, serializer.validated_data['code']):
            return Response({'detail': 'Invalid code'}, status=status.HTTP_400_BAD_REQUEST)

        codes, hashed = two_factor.generate_backup_codes()
        request.user.is_2fa_enabled = True
        request.user.backup_codes = hashed
        request.user.save(update_fields=['is_2fa_enabled', 'backup_codes'])

        return Response({'is_2fa_enabled': True, 'backup_codes': codes})


class Disable2FAView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PasswordConfirmSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        request.user.is_2fa_enabled = False
        request.user.totp_secret = None
        request.user.backup_codes = None
        request.user.save(update_fields=['is_2fa_enabled', 'totp_secret', 'backup_codes'])

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

    def post(self, request):
        serializer = PasswordResetVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        code = serializer.validated_data['code']

        if not verification.verify_password_reset_code(email, code):
            return Response({'detail': 'Invalid or expired code.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'detail': 'Code is correct.'})


