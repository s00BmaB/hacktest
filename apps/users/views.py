from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .serializers import RegisterSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        # After registration, set initial GDPR consent if provided
        consent = request.data.get('gdpr_consent', False)
        if consent and response.status_code == 201:
            from django.contrib.auth import get_user_model
            from apps.gdpr.models import ConsentRecord
            from django.conf import settings
            User = get_user_model()
            user = User.objects.get(username=request.data['username'])
            ip = request.META.get('REMOTE_ADDR')
            ConsentRecord.objects.create(
                user=user,
                version=settings.GDPR_CONSENT_VERSION,
                consented=True,
                ip=ip,
            )
        return response


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def me_view(request):
    return Response(UserSerializer(request.user).data)
