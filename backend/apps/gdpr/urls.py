from django.urls import path
from .views import consent, export_data, delete_account, privacy_info

urlpatterns = [
    path('consent/', consent, name='gdpr-consent'),
    path('export/', export_data, name='gdpr-export'),
    path('delete-account/', delete_account, name='gdpr-delete'),
    path('privacy/', privacy_info, name='gdpr-privacy'),
]
