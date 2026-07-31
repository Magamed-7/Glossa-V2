from rest_framework.throttling import SimpleRateThrottle


class LoginRateThrottle(SimpleRateThrottle):
    scope = 'login'

    def get_cache_key(self, request, view):
        ident = request.data.get('username') or self.get_ident(request)
        return self.cache_format % {'scope': self.scope, 'ident': ident}


class TwoFactorRateThrottle(SimpleRateThrottle):
    scope = 'login'

    def get_cache_key(self, request, view):
        ident = request.data.get('pending_token') or self.get_ident(request)
        return self.cache_format % {'scope': self.scope, 'ident': ident}
