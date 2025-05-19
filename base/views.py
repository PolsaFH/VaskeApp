from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User, Group
from django.contrib.auth.decorators import login_required
import json
from django.http import JsonResponse

from .models import schematics, messages as member_messages, GroupAdmin

def is_admin(user, group):
    # check if user is in the admin group
    return GroupAdmin.objects.filter(user=user, group=group).exists()


def loginPage(request):
    if request.user.is_authenticated:
        return redirect('home')

    if request.method == 'POST':
        choose = request.POST.get('choose')

        if choose == 'Login':
            username = request.POST.get('username')
            password = request.POST.get('password')
            
            try:
                user = User.objects.get(username=username)
            except:
                messages.error(request, 'Username is incorrect')
                return redirect('login')

            user = authenticate(request, username=username, password=password)

            if user is not None:
                login(request, user)
                nextPage = request.GET.get('next')
                if nextPage:
                    return redirect(nextPage)
                else:
                    return redirect('home')
            else:
                messages.error(request, 'Password is incorrect')
        elif (choose == 'Register'):
            username = request.POST.get('username')
            password = request.POST.get('password')
            email = request.POST.get('email')
            first_name = request.POST.get('first_name')
            last_name = request.POST.get('last_name')

            user = User.objects.create_user(username=username, password=password, email=email, first_name=first_name, last_name=last_name)
            user.save()
            messages.success(request, 'User created successfully!')
            return redirect('login')
    
    context = {'type': request.GET.get('type')}
    return render(request, 'base/login_register.html', context)

@login_required(login_url='login')
def logoutUser(request):
    logout(request)
    return redirect('home')

# Create your views here.
@login_required(login_url='login')
def home(request):
    user = request.user
    user_group = user.groups.all()
    context = {'groups': user_group}
    return render(request, 'base/home.html', context)


@login_required(login_url='login')
def set_active_group(request, group_id):
    try:
        group = Group.objects.get(id=group_id)
        request.session['active_group_id'] = group.id
    except Group.DoesNotExist:
        messages.error(request, 'Group does not exist.')

    return redirect('home')


@login_required(login_url='login')
def group(request, pk):
    if(pk):
        user = request.user
        user_group = user.groups.get(id=pk)
        schem = user_group.schematics_set.all()

        context = {'schems': schem}

        return render(request, 'base/group_schematic.html', context)
    else:
        return render(request, 'base/home.html')

@login_required(login_url='login')
def schematic(request, pk):
    if(pk):
        schem = schematics.objects.get(id=pk)

        context = {
            'name': schem.name, 
            'schematic_data': json.dumps(schem.schematic_json)
        }
        return render(request, 'base/view_schematic.html', context)
    else:
        return render(request, 'base/home.html')


@login_required(login_url='login')
def upload(request):
    return render(request, 'base/upload.html')


@login_required(login_url='login')
def upload_schematic(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)  # Parse JSON data
            schematic_name = data.get('schematic_name')
            schematic_json = data.get('schematic_json')
            group_id = request.session.get('active_group_id')

            schem = schematics.objects.create(name=schematic_name, schematic_json=schematic_json, group_id=group_id)
            schem.save()

            return redirect('schematic_group', group_id)
        except json.JSONDecodeError:
            print("Invalid JSON data")
            return redirect('upload')
        


@login_required(login_url='login')
def members(request):
    group_id = request.session.get('active_group_id')

    if group_id:
        group = Group.objects.get(id=group_id)
        members = group.user_set.all()
        context = {'members': members, 'group': group, 'is_admin': is_admin(request.user, group)}
    else:
        redirect('home')
    
    return render(request, 'base/members.html', context)


@login_required(login_url='login')
def remove_member(request, group_id, member_id):
    if request.method == 'POST':
        if not is_admin(request.user, group_id):
            messages.error(request, 'You do not have permission to remove members from this group.')
            return redirect('members')
        try:
            user = User.objects.get(id=member_id)
            group = Group.objects.get(id=group_id)

            group.user_set.remove(user)
            messages.success(request, f'{user.first_name} has been removed from the group.')
        except User.DoesNotExist:
            messages.error(request, 'User does not exist.')
        except Group.DoesNotExist:
            messages.error(request, 'Group does not exist.')

    return redirect('members')


@login_required(login_url='login')
def messagesPage(request):
    group_id = request.session.get('active_group_id')

    if group_id:
        group = Group.objects.get(id=group_id)

        user = request.user
        members = group.user_set.exclude(id=user.id)

        # Get the last message between the user and each member
        for member in members:
            messages_between = (
                user.sent_messages.filter(recipient=member) |
                user.received_messages.filter(sender=member)
            ).order_by('-timestamp')

            # Number of unread messages that the user has not read yet frrom the member
            unread_count = user.received_messages.filter(sender=member, read=False).count()
            member.unread_count = unread_count


            if messages_between.exists():
                last_message = messages_between.first()

                member.last_message = last_message.content
                member.last_message_time = last_message.timestamp.strftime('%Y-%m-%d %H:%M:%S')
            else:
                member.last_message = None

        context = {
            'members': members,
            'group': group
        }

    else:
        return redirect('home')
    return render(request, 'base/messages.html', context)


@login_required(login_url='login')
def get_messages(request, member_id):
    if request.method == 'GET':
        try:
            member = User.objects.get(id=member_id)
            user = request.user

            
            messages_between = (
                user.sent_messages.filter(recipient=member) |
                user.received_messages.filter(sender=member)
            ).order_by('timestamp')

            
            messages_data = [
                {
                    'sender': message.sender.username,
                    'recipient': message.recipient.username,
                    'content': message.content,
                    'timestamp': message.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                    'read': message.read,
                    'is_sender': message.sender == user,
                }
                for message in messages_between
            ]

            # Mark messages as read
            unread_messages = messages_between.filter(read=False, recipient=user)
            unread_messages.update(read=True)

            return JsonResponse({'messages': messages_data}, safe=False)

        except User.DoesNotExist:
            return JsonResponse({'error': 'Member does not exist'}, status=404)
        


@login_required(login_url='login')
def send_message(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)  # Parse JSON data

            member_id = data.get('member_id')
            content = data.get('content')

            if not member_id or not content:
                return messages.error(request, 'Member ID and content are required.')

            member = User.objects.get(id=member_id)
            user = request.user

            message = member_messages.objects.create(sender=user, recipient=member, content=content)
            message.save()
            return JsonResponse({'success': 'Message sent successfully'}, status=200)
        except User.DoesNotExist:
            messages.error(request, 'Member does not exist.')
            return redirect('messages')
