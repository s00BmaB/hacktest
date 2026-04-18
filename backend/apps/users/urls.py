from django.urls import path
from .views import RegisterView, me_view

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', me_view, name='me'),
]
