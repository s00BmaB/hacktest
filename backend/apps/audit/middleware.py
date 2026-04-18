import threading

_thread_local = threading.local()


def get_client_ip(request):
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


class AuditLogMiddleware:
    """
    Logs every API request to the AuditLog table.
    Only logs /api/ paths to avoid spamming static/admin.
    """

    SKIP_PATHS = ['/api/token/', '/admin/']

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Only audit API calls, skip token refresh noise
        if request.path.startswith('/api/') and not any(
            request.path.startswith(p) for p in self.SKIP_PATHS
        ):
            try:
                from apps.audit.models import AuditLog
                user = request.user if request.user.is_authenticated else None
                AuditLog.objects.create(
                    user=user,
                    action=f'{request.method} {request.path}',
                    path=request.path,
                    method=request.method,
                    ip=get_client_ip(request),
                    status_code=response.status_code,
                )
            except Exception:
                pass  # Never break the request because of logging

        return response
