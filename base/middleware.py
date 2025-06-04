from django.shortcuts import redirect
from django.urls import reverse

class ActiveGroupRequiredMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Only check for authenticated users
        if request.user.is_authenticated:
            # Check if the user has an active group set
            active_group_id = request.session.get('active_group_id')

            # Makes sure that the user can access the select_group page
            if request.path.startswith('/set_active_group/') or request.path.startswith('/admin/') or request.path.startswith('/group/create'):
                return self.get_response(request)
            
            # rediredt to select_group if no active group is set
            if not active_group_id and request.path != reverse('select_group'):
                return redirect('select_group')


        return self.get_response(request)
