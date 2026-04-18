from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class EnergyReading(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='readings')
    date = models.DateField()
    kwh = models.FloatField()
    cost = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date']
        unique_together = ['user', 'date']

    def __str__(self):
        return f'{self.user.username} – {self.date}: {self.kwh} kWh'


class AIAnalysis(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='analyses')
    created_at = models.DateTimeField(auto_now_add=True)
    summary = models.TextField()
    recommendations = models.JSONField(default=list)
    predicted_month_cost = models.FloatField(null=True, blank=True)
    tariff_suggestion = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ['-created_at']
