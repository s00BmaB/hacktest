class SecurityHeadersMiddleware:
    """
    Adds security headers to every response (OWASP best practices).
    Covers: XSS protection, clickjacking, MIME sniffing, CSP, HSTS.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Prevent clickjacking
        response['X-Frame-Options'] = 'DENY'

        # Stop MIME-type sniffing
        response['X-Content-Type-Options'] = 'nosniff'

        # XSS filter for old browsers
        response['X-XSS-Protection'] = '1; mode=block'

        # Referrer policy — limit information leakage
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        # Content Security Policy
        response['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; "
            "connect-src 'self' http://localhost:5173 http://127.0.0.1:5173;"
        )

        # Permissions policy — disable dangerous browser features
        response['Permissions-Policy'] = (
            'camera=(), microphone=(), geolocation=(), payment=()'
        )

        # HSTS — only in production (not debug)
        from django.conf import settings
        if not settings.DEBUG:
            response['Strict-Transport-Security'] = (
                'max-age=31536000; includeSubDomains; preload'
            )

        return response
