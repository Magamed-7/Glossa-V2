from rest_framework.throttling import SimpleRateThrottle

from users import two_factor


class LoginRateThrottle(SimpleRateThrottle):
    scope = 'login'

    def get_cache_key(self, request, view):
        ident = request.data.get('username') or self.get_ident(request)
        return self.cache_format % {'scope': self.scope, 'ident': ident}


class TwoFactorRateThrottle(SimpleRateThrottle):
    scope = 'login'

    def get_cache_key(self, request, view):
        pending_token = request.data.get('pending_token')
        # Ключуем по user_id, на который указывает токен, а не по самому токену -
        # иначе атакующий, зная пароль жертвы, просто перевыпускает pending_token
        # заново на каждую попытку и обнуляет счётчик лимита.
        ident = (two_factor.resolve_pending_user_id(pending_token) if pending_token else None) or self.get_ident(request)
        return self.cache_format % {'scope': self.scope, 'ident': ident}


class EmailChangeRateThrottle(SimpleRateThrottle):
    scope = 'email_change'

    def get_cache_key(self, request, view):
        ident = request.user.id if request.user.is_authenticated else self.get_ident(request)
        return self.cache_format % {'scope': self.scope, 'ident': ident}


class PasswordResetRateThrottle(SimpleRateThrottle):
    scope = 'password_reset'

    def get_cache_key(self, request, view):
        ident = request.data.get('email') or self.get_ident(request)
        return self.cache_format % {'scope': self.scope, 'ident': ident}
