from django.contrib import admin
from .models import schematics
from django.forms import Textarea
from django.db import models

@admin.register(schematics)
class SchematicAdmin(admin.ModelAdmin):
    list_display = ("name", "group_id", "created_at", "updated_at")  # Display fields in the list
    search_fields = ("name",)  # Enables search by name
    list_filter = ("group_id", "created_at")  # Filters in sidebar
    ordering = ("-created_at",)  # Order by newest first
    
    formfield_overrides = {
        models.JSONField: {"widget": admin.widgets.AdminTextareaWidget},  # Makes JSONField more readable
    }


