from django.contrib import admin
from .models import schematics, messages, GroupAdmin
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


@admin.register(messages)
class MessagesAdmin(admin.ModelAdmin):
    list_display = ("sender", "recipient", "timestamp")
    search_fields = ("sender__username", "receiver__username")
    list_filter = ("timestamp",)
    ordering = ("-timestamp",)
    formfield_overrides = {
        models.TextField: {"widget": Textarea(attrs={"rows": 4, "cols": 40})},  # Makes TextField more readable
    }

@admin.register(GroupAdmin)
class GroupAdminAdmin(admin.ModelAdmin):
    list_display = ("user", "group")
    search_fields = ("user__username", "group__name")
    ordering = ("user__username",)
    list_filter = ("group",)



