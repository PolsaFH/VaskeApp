from django.contrib.auth.models import Group

def active_group_context(request):
    active_group_id = request.session.get('active_group_id')
    active_group_name = None
    user_groups = []
    schem = []

    if request.user.is_authenticated:
        user_groups = request.user.groups.all()

        if active_group_id:
            try:
                active_group = request.user.groups.get(id=active_group_id)
                active_group_name = active_group.name

                user = request.user
                user_group = user.groups.get(id=active_group_id)
                schem = user_group.schematics_set.all()
                
            except Group.DoesNotExist:
                active_group_name = None

    return {
        'schems': schem,
        'active_group_id': active_group_id,
        'active_group_name': active_group_name,
        'user_groups': user_groups,
    }