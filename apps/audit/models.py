from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class AuditLog(models.Model):
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=500)
    path = models.CharField(max_length=500)
    method = models.CharField(max_length=10)
    ip = models.GenericIPAddressField(null=True, blank=True)
    status_code = models.IntegerField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        user = self.user.username if self.user else 'anonymous'
        return f'[{self.timestamp:%Y-%m-%d %H:%M}] {user} {self.method} {self.path} → {self.status_code}'
