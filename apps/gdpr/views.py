import json
from django.conf import settings
from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import ConsentRecord


def get_client_ip(request):
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def consent(request):
    """
    GET  → zwraca aktualny status zgody RODO
    POST → rejestruje nową zgodę (consented: true/false)
    """
    if request.method == 'GET':
        latest = ConsentRecord.objects.filter(user=request.user).first()
        if not latest:
            return Response({'consented': False, 'version': None, 'timestamp': None})
        return Response({
            'consented': latest.consented,
            'version': latest.version,
            'timestamp': latest.timestamp,
        })

    consented = request.data.get('consented')
    if consented is None:
        return Response({'error': 'Pole "consented" jest wymagane.'}, status=400)

    record = ConsentRecord.objects.create(
        user=request.user,
        version=settings.GDPR_CONSENT_VERSION,
        consented=bool(consented),
        ip=get_client_ip(request),
    )
    return Response({
        'consented': record.consented,
        'version': record.version,
        'timestamp': record.timestamp,
        'message': 'Zgoda zapisana.' if record.consented else 'Zgoda cofnięta.',
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_data(request):
    """
    RODO Art. 20 — eksport wszystkich danych użytkownika do JSON.
    Zwraca plik do pobrania.
    """
    from apps.energy.models import EnergyReading, AIAnalysis
    from apps.chat.models import ChatMessage
    from apps.audit.models import AuditLog

    user = request.user

    data = {
        'data_administrator': {
            'name': 'MojaApp / Silesia Akkka',
            'contact': 'privacy@silesia-akkka.pl',
            'data_location': 'Polska (UE)',
        },
        'export_date': str(__import__('datetime').date.today()),
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'date_joined': str(user.date_joined),
        },
        'energy_readings': list(
            EnergyReading.objects.filter(user=user).values('date', 'kwh', 'cost', 'created_at')
        ),
        'ai_analyses': list(
            AIAnalysis.objects.filter(user=user).values(
                'created_at', 'summary', 'recommendations',
                'predicted_month_cost', 'tariff_suggestion'
            )
        ),
        'chat_history': list(
            ChatMessage.objects.filter(user=user).values('role', 'content', 'timestamp')
        ),
        'consent_records': list(
            ConsentRecord.objects.filter(user=user).values('version', 'consented', 'timestamp', 'ip')
        ),
        'audit_log': list(
            AuditLog.objects.filter(user=user).values('action', 'path', 'method', 'timestamp', 'status_code')
        ),
    }

    # Serialize dates/datetimes
    def default_serializer(obj):
        if hasattr(obj, 'isoformat'):
            return obj.isoformat()
        return str(obj)

    payload = json.dumps(data, indent=2, default=default_serializer, ensure_ascii=False)

    response = HttpResponse(payload, content_type='application/json; charset=utf-8')
    response['Content-Disposition'] = f'attachment; filename="moje_dane_{user.username}.json"'
    return response


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_account(request):
    """
    RODO Art. 17 — prawo do bycia zapomnianym.
    Usuwa konto i wszystkie powiązane dane.
    Wymaga potwierdzenia hasłem.
    """
    password = request.data.get('password')
    if not password:
        return Response({'error': 'Hasło jest wymagane do usunięcia konta.'}, status=400)

    user = request.user
    if not user.check_password(password):
        return Response({'error': 'Nieprawidłowe hasło.'}, status=403)

    username = user.username
    user.delete()  # CASCADE usuwa wszystkie powiązane dane

    return Response({
        'message': f'Konto {username} i wszystkie dane zostały trwale usunięte.',
        'gdpr_article': 'Art. 17 RODO — Prawo do usunięcia danych',
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def privacy_info(request):
    """Zwraca informacje o polityce prywatności i prawach użytkownika."""
    return Response({
        'administrator': 'Silesia Akkka Sp. z o.o.',
        'contact': 'privacy@silesia-akkka.pl',
        'data_location': 'Polska, Unia Europejska',
        'consent_version': settings.GDPR_CONSENT_VERSION,
        'user_rights': [
            {'article': 'Art. 15 RODO', 'right': 'Prawo dostępu do danych', 'endpoint': 'GET /api/gdpr/export/'},
            {'article': 'Art. 17 RODO', 'right': 'Prawo do usunięcia danych', 'endpoint': 'DELETE /api/gdpr/delete-account/'},
            {'article': 'Art. 18 RODO', 'right': 'Prawo do ograniczenia przetwarzania', 'endpoint': 'POST /api/gdpr/consent/ (consented: false)'},
            {'article': 'Art. 20 RODO', 'right': 'Prawo do przenoszenia danych', 'endpoint': 'GET /api/gdpr/export/'},
        ],
        'data_categories': [
            'Dane konta (login, e-mail, imię)',
            'Historia zużycia energii',
            'Analiza AI i rekomendacje',
            'Historia czatu z asystentem',
            'Logi aktywności (bezpieczeństwo)',
        ],
        'retention': '5 lat od ostatniej aktywności lub do usunięcia konta',
    })
