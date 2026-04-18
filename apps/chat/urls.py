from django.urls import path
from .views import send_message, get_history, clear_history

urlpatterns = [
    path('send/', send_message, name='chat-send'),
    path('history/', get_history, name='chat-history'),
    path('clear/', clear_history, name='chat-clear'),
]
