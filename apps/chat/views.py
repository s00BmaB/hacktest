from django.conf import settings
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle

from .models import ChatMessage

SILESIAN_SYSTEM_PROMPT = """Jestes Sznelkiem - wesolym asystentem energetycznym Tauron,
kery godo po slasku. Pomagosz klientom zrozumiec jejich rachunki za prond,
oszczyndzac energijo i wybiyroc nojlepszo taryfo.

ZASADY GODKI:
- Zawdy godej po slasku, niy po polsku
- "nie" -> "niy", "jak" -> "jako", "teraz" -> "teroz"
- "tutaj" -> "sam", "bardzo" -> "fest", "tylko" -> "ino"
- "naprawde" -> "na isto", "dzisiaj" -> "dzisioj", "troche" -> "trocha"
- "gdzie" -> "kaj", "zeby" -> "coby", "moze" -> "mozno", "duzo" -> "duo"
- uzywej: "bon" (bedzie), "przaja" (lubie), "kamrat" (kumpel)
- powitanie: "Serwus!" lub "Siemka!", pozegnanie: "Na razie!" lub "Czekej!"

WIEDZA ENERGETYCZNA:
- Taryfy Tauron: G11 (calodobowo ~0.80 PLN/kWh), G12 (dzynno ~0.95/nocno ~0.55), G12w (weekendowo)
- Oszczyndnosci: LED zamiast zarowek, termostat, pralka w nocy na G12
- Pytej o wielosc osob w domu, miyrscze, sprzont elektryczne

Godej zawdy po slasku - to je twoja tozsamosc i duma!"""


class ChatThrottle(UserRateThrottle):
    rate = '15/min'
    scope = 'chat'


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([ChatThrottle])
def send_message(request):
    """Chatbot Sznelk - Vertex AI Gemini 2.5 Flash."""
    content = request.data.get('message', '').strip()
    if not content:
        return Response({'error': 'Pusta wiadomosc.'}, status=400)
    if len(content) > 2000:
        return Response({'error': 'Wiadomosc za dluga (max 2000 znakow).'}, status=400)

    user_msg = ChatMessage.objects.create(user=request.user, role='user', content=content)

    recent = list(ChatMessage.objects.filter(user=request.user).order_by('-timestamp')[:21])
    recent.reverse()
    past = [m for m in recent if m.pk != user_msg.pk]

    try:
        import vertexai
        from vertexai.generative_models import GenerativeModel, GenerationConfig, Content, Part

        vertexai.init(
            project=settings.VERTEX_PROJECT_ID,
            location=settings.VERTEX_LOCATION,
        )

        model = GenerativeModel(
            "gemini-2.5-flash",
            system_instruction=SILESIAN_SYSTEM_PROMPT,
        )

        history = []
        for msg in past:
            role = 'user' if msg.role == 'user' else 'model'
            history.append(Content(role=role, parts=[Part.from_text(msg.content)]))

        chat = model.start_chat(history=history)
        response = chat.send_message(
            content,
            generation_config=GenerationConfig(
                max_output_tokens=800,
                temperature=0.8,
            ),
        )
        reply = response.text

    except Exception as e:
        user_msg.delete()
        return Response({'error': f'Blond AI: {e}'}, status=500)

    ChatMessage.objects.create(user=request.user, role='assistant', content=reply)
    return Response({'reply': reply})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_history(request):
    messages = ChatMessage.objects.filter(user=request.user).values(
        'role', 'content', 'timestamp'
    )
    return Response(list(messages))


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_history(request):
    deleted, _ = ChatMessage.objects.filter(user=request.user).delete()
    return Response({'deleted': deleted})
