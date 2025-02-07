from django.db import models
from django.contrib.auth.models import Group

class schematics(models.Model):  # Class name should ideally be "Schematic" (but keeping your version)
    name = models.CharField(max_length=100)
    group = models.ForeignKey(Group, on_delete=models.CASCADE)  # Correct ForeignKey
    schematic_json = models.JSONField()  # Fixed typo from "shcematic_json"
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

