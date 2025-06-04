from django.contrib.auth.models import Group
from .models import invitations, messages
import json

def active_group_context(request):
    active_group_id = request.session.get('active_group_id')
    active_group_name = None
    user_groups = []
    schems_data = []

    if request.user.is_authenticated:
        user_groups = request.user.groups.all()

        if active_group_id:
            try:
                active_group = request.user.groups.get(id=active_group_id)
                active_group_name = active_group.name

                user = request.user
                user_group = user.groups.get(id=active_group_id)
                schems = user_group.schematics_set.all()

                schems_data = [
                    {
                        "name": schem.name,
                        "id": schem.id,
                        "schematic_json": schem.schematic_json,
                    }
                    for schem in schems
                ]

            except Group.DoesNotExist:
                active_group_name = None

    return {
        "schems": schems if schems_data else [],
        "schems_data": json.dumps(schems_data) if schems_data else [],
        "active_group_id": active_group_id if active_group_id else None,
        "active_group_name": active_group_name if active_group_name else None,
        "user_groups": user_groups if user_groups else [],
    }

def notification_status(request):
    if request.user.is_authenticated:
        user = request.user

        group_id = request.session.get('active_group_id')

        count = invitations.objects.filter(
            user_id=user
        ).count()

        if group_id:
            group = Group.objects.get(id=group_id)

            user = request.user
            members = group.user_set.exclude(id=user.id)
            for member in members:
                # Count unread messages from each member
                unread_count = user.received_messages.filter(sender=member, read=False).count()
                count += unread_count
        else:
            count = 0

        return {
            'has_notifications': count > 0,
            'notification_count': count,
        }
    return {}