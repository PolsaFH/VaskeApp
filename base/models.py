from django.db import models
from django.contrib.auth.models import Group
from django.contrib.auth.models import User

class schematics(models.Model):
    name = models.CharField(max_length=100)
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    schematic_json = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class messages(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField(max_length=500)
    read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender.username} to {self.recipient.username}: {self.content[:20]}..."
    


class GroupAdmin(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    group = models.ForeignKey(Group, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('user', 'group')

    def __str__(self):
        return f"{self.user.username} is admin of {self.group.name}"



class invitations(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    meta = {
        'unique_together': ('group', 'user'),
        'ordering': ['-created_at'],
    }

    def __str__(self):
        return f"Invitation to {self.user.username} for group {self.group.name}"
    

class CleanTime(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    schematic = models.ForeignKey(schematics, on_delete=models.CASCADE)
    zone_id = models.CharField(max_length=100, default='default_zone')
    time_spent = models.DurationField()

    def __str__(self):
        return f"{self.user.username} spent {self.time_spent} on {self.schematic.name} in zone {self.zone_id}"
