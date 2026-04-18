from google import genai
from google.genai import types
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle

from .models import ChatMessage

SILESIAN_SYSTEM_PROMPT = """Jesteś Sznelkiem — wesołym asystentem energetycznym Tauron,
kery godo po śląsku. Pomagosz klientōm zrozumieć jejich rachunki za prōnd,
oszczyndzać energijo i wybiyróć nojlepszõ taryfo.

ZASADY GODKI:
- Zawdy godej po śląsku, niy po polsku
- "nie" → "niy", "jak" → "jako", "teraz" → "teroz"
- "tutaj" → "sam", "bardzo" → "fest", "tylko" → "ino"
- "naprawdę" → "na isto", "dzisiaj" → "dzisioj", "trochę" → "trocha"
- "gdzie" → "kaj", "żeby" → "coby", "może" → "możno", "dużo" → "duo"
- używej: "bōn" (będzie), "przaja" (lubię), "kamrat" (kumpel)
- powitanie: "Serwus!" lub "Siemka!", pożegnanie: "Na razie!" lub "Czekej!"

WIEDZA ENERGETYCZNA:
- Taryfy Tauron: G11 (całodobowo ~0.80 PLN/kWh), G12 (dziynno ~0.95/nocno ~0.55), G12w (weekendowo)
- Oszczyndności: LED zamiast żarōwek, termostat, pralka w nocy na G12
- Pytej o wielość osōb w domu, miyrszcze, sprzōnty elektryczne

Godej zawdy po śląsku — to je twoja tożsamość i duma!"""


class ChatThrottle(UserRateThrottle):
    rate = '15/min'
    scope = 'chat'


def _build_contents(db_messages):
    """Convert DB messages to google-genai Contents format."""
    contents = []
    for msg in db_messages:
        role = 'user' if msg.role == 'user' else 'model'
        contents.append(types.Content(role=role, parts=[types.Part(text=msg.content)]))
    return contents


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([ChatThrottle])
def send_message(request):
    """
    Chatbot Sznelk — Google Gemini 2.0 Flash (darmowy: 15 RPM, 1500 req/dzień).
    """
    content = request.data.get('message', '').strip()
    if not content:
        return Response({'error': 'Pusta wiadomość.'}, status=400)
    if len(content) > 2000:
        return Response({'error': 'Wiadomość za długa (max 2000 znaków).'}, status=400)

    user_msg = ChatMessage.objects.create(user=request.user, role='user', content=content)

    # Build history: last 20 messages, excluding just-saved user message
    recent = list(ChatMessage.objects.filter(user=request.user).order_by('-timestamp')[:21])
    recent.reverse()
    past = [m for m in recent if m.pk != user_msg.pk]

    # Build full contents: history + new user message
    contents = _build_contents(past)
    contents.append(types.Content(role='user', parts=[types.Part(text=content)]))

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SILESIAN_SYSTEM_PROMPT,
                max_output_tokens=800,
                temperature=0.8,
            ),
        )
        reply = response.text
    except Exception as e:
        user_msg.delete()
        return Response({'error': f'Błōnd AI: {e}'}, status=500)

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
