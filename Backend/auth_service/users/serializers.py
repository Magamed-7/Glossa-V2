from datetime import timedelta

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from rest_framework import serializers

from users.models import User

USERNAME_CHANGE_COOLDOWN_DAYS = 40
EMAIL_CHANGE_COOLDOWN_DAYS = 40


def _cooldown_error(last_changed_at, cooldown_days):
    elapsed = timezone.now() - last_changed_at
    remaining = timedelta(days=cooldown_days) - elapsed

    if remaining <= timedelta(0):
        return None

    return f'You can change this again in {remaining.days + 1} day(s)'


class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(validators=[])
    email = serializers.EmailField(validators=[])
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role']
        read_only_fields = ['id', 'role']

    def validate(self, attrs):
        if User.objects.filter(email=attrs['email']).exists() or User.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError('Registration failed, check your details')

        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'role', 'is_verified', 'is_2fa_enabled', 'created_at',
            'last_username_change_at', 'last_email_change_at',
        ]


class UpdateMeSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False, validators=[])

    class Meta:
        model = User
        fields = ['username']

    def validate_username(self, value):
        user = self.instance

        if value == user.username:
            return value

        if User.objects.filter(username=value).exclude(id=user.id).exists():
            raise serializers.ValidationError('Username already exists')

        if user.last_username_change_at is not None:
            error = _cooldown_error(user.last_username_change_at, USERNAME_CHANGE_COOLDOWN_DAYS)
            if error:
                raise serializers.ValidationError(error)

        return value


class RequestEmailChangeSerializer(serializers.Serializer):
    new_email = serializers.EmailField()

    def validate_new_email(self, value):
        user = self.context['request'].user

        if value == user.email:
            raise serializers.ValidationError('This is already your email')

        if User.objects.filter(email=value).exclude(id=user.id).exists():
            raise serializers.ValidationError('Email already exists')

        if user.last_email_change_at is not None:
            error = _cooldown_error(user.last_email_change_at, EMAIL_CHANGE_COOLDOWN_DAYS)
            if error:
                raise serializers.ValidationError(error)

        return value


class VerifyEmailSerializer(serializers.Serializer):
    code = serializers.CharField(min_length=6, max_length=6)
    # Needed when the confirmation arrives without a live session — the account is
    # identified by the address the code was sent to instead of by request.user.
    email = serializers.EmailField(required=False)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_old_password(self, value):
        user = self.context['request'].user

        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect')

        return value

    def validate_new_password(self, value):
        try:
            validate_password(value, user=self.context['request'].user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))

        return value


class PasswordConfirmSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)

    def validate_password(self, value):
        user = self.context['request'].user

        if not user.check_password(value):
            raise serializers.ValidationError('Password is incorrect')

        return value


class TwoFactorCodeSerializer(serializers.Serializer):
    code = serializers.CharField(min_length=6, max_length=6)


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email does not exist.")
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(min_length=6, max_length=6)
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        try:
            validate_password(attrs['password'])
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)})
        return attrs


class PasswordResetVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(min_length=6, max_length=6)


