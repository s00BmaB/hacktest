from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class ConsentRecord(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='consents')
    version = models.CharField(max_length=20)
    consented = models.BooleanField()
    ip = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        action = 'wyraził zgodę' if self.consented else 'cofnął zgodę'
        return f'{self.user.username} {action} v{self.version} @ {self.timestamp:%Y-%m-%d}'
