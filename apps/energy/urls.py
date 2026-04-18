from django.urls import path
from .views import upload_csv, get_readings, analyze, get_analyses

urlpatterns = [
    path('upload/', upload_csv, name='energy-upload'),
    path('readings/', get_readings, name='energy-readings'),
    path('analyze/', analyze, name='energy-analyze'),
    path('analyses/', get_analyses, name='energy-analyses'),
]
