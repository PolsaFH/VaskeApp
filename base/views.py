from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User, Group
from django.contrib.auth.decorators import login_required
import json
from django.http import JsonResponse

from .models import schematics, messages as member_messages, GroupAdmin, invitations, CleanTime
from datetime import date, timedelta

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

            try:
                user = User.objects.create_user(username=username, password=password, email=email, first_name=first_name, last_name=last_name)
                user.save()
            except Exception as e:
                messages.error(request, f'Error creating user: {str(e)}')
                return redirect('login')

            login(request, user)

            messages.success(request, 'User created successfully!')
            return redirect('home')
    
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
        print(f"Active groasdasdasdasdasdasdasdasdasdasdasup set to: {group.name} (ID: {group.id})")
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

        # Check if all the members are admins
        for member in members:
            member.is_admin = is_admin(member, group)


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

            return JsonResponse({'messages': messages_data, "fullname": f"{member.first_name} {member.last_name}" }, safe=False)

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
        


@login_required(login_url='login')
def notificationsPage(request):
    user = request.user

    group_id = request.session.get('active_group_id')

    if group_id:
        group = Group.objects.get(id=group_id)

        user = request.user
        members = group.user_set.exclude(id=user.id)

        for member in members:

            # Number of unread messages that the user has not read yet frrom the member
            unread_count = user.received_messages.filter(sender=member, read=False).count()
            member.unread_count = unread_count
    else:
        members = []

    # Get all invitations for the user
    invitations_list = invitations.objects.filter(user=user)

    context = {
        'members': members,
        'invitations': invitations_list,
    }

    return render(request, 'base/notifications.html', context)

@login_required(login_url='login')
def change_admin_role(request, group_id, member_id):
    if request.method == 'POST' and is_admin(request.user, group_id):
        group = Group.objects.get(id=group_id)
        member = User.objects.get(id=member_id)

        if is_admin(member, group):
            # Remove admin role
            GroupAdmin.objects.filter(user=member, group=group).delete()
            messages.success(request, f'{member.first_name} is no longer an admin.')
        else:
            # Add admin role
            GroupAdmin.objects.create(user=member, group=group)
            messages.success(request, f'{member.first_name} is now an admin.')

    return redirect('members')


@login_required(login_url='login')
def invite_member(request, group_id):
    if request.method == 'POST':
        username = request.POST.get('username')

        try:
            user = User.objects.get(username=username)
            group = Group.objects.get(id=group_id)

            # Check if the user is already a member of the group
            if user in group.user_set.all():
                messages.error(request, f'{user.first_name} is already a member of this group.')
            else:
                # Create an invitation
                invitation = invitations.objects.create(group=group, user=user)
                invitation.save()
                messages.success(request, f'Invitation sent to {user.first_name}.')
        except User.DoesNotExist:
            messages.error(request, 'User does not exist.')
        except Group.DoesNotExist:
            messages.error(request, 'Group does not exist.')
        
    
    return redirect('members')


@login_required(login_url='login')
def answer_invitation(request, response, invitation_id):
    try:
        invitation = invitations.objects.get(id=invitation_id)

        if response == 'accept':
            # Add user to the group
            group = invitation.group
            user = invitation.user
            group.user_set.add(user)
            messages.success(request, f'You have joined the group {group.name}.')
        elif response == 'decline':
            messages.info(request, 'Invitation declined.')

        # Delete the invitation after responding
        invitation.delete()
    except invitations.DoesNotExist:
        messages.error(request, 'Invitation does not exist.')

    return redirect('home')

@login_required(login_url='login')
def make_group(request):
    if request.method == 'POST':
        group_name = request.POST.get('group_name')
        if not group_name:
            messages.error(request, 'Group name is required.')
            return redirect('make_group')

        # Create the group
        group = Group.objects.create(name=group_name)
        group.save()

        # Add the user to the group
        user = request.user
        group.user_set.add(user)

        # Create a GroupAdmin entry for the user
        GroupAdmin.objects.create(user=user, group=group)

        # Set the group as the active group for the user
        request.session['active_group_id'] = group.id

        messages.success(request, f'Group "{group_name}" created successfully!')
        return redirect('make_group')

    return render(request, 'base/make_group.html')


@login_required(login_url='login')
def select_group(request):
    return render(request, 'base/select_group.html')


@login_required(login_url='login')
def washed_zones(request):
    if request.method == 'POST':

        data = json.loads(request.body)

        user = request.user
        schem_id = data.get('schem_id')
        zone_id = data.get('zone_id')
        time_used = data.get('time_used')
        
        try:
            time_used = timedelta(seconds=int(time_used))
            schem = schematics.objects.get(id=schem_id)
            time_spent = CleanTime.objects.create(user=user, schematic=schem, time_spent=time_used)
            time_spent.zone_id = zone_id
            time_spent.save()

            schem_json = schem.schematic_json
            # find zone with id zone_id in the schematic json
            zone_found = None
            # Ensure zone_id is an integer for comparison
            zone_id_int = int(zone_id)
            for item in schem_json:
                if item.get('type') == 'Zone' and int(item.get('id', 0)) == zone_id_int:
                    zone_found = item
                    today_str = date.today().isoformat()
                    # update last_washed to todays date
                    zone_found['last_washed'] = today_str
                    print("Updated zone last_washed to:", today_str)
                    # update schematic_json in the schematics database and save changes
                    schem.schematic_json = schem_json
                    schem.save()


            # Removed unused variable assignment
            messages.success(request, 'Time spent on the schematic has been recorded successfully.')
            return JsonResponse({'status': 'success', 'message': 'Time recorded successfully'})
        except schematics.DoesNotExist:
            messages.error(request, 'Schematic does not exist.')
            return JsonResponse({'status': 'error', 'message': 'Schematic does not exist'}, status=404)
        except Exception as e:
            messages.error(request, f'An error occurred: {str(e)}')
            return JsonResponse({'status': 'error', 'message': f'An error occurred: {str(e)}'}, status=500)
    else:
        return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=400)


@login_required(login_url='login')
def estimated_time(request, zone_id, schem_id):
    if request.method == 'GET':
        try:
            schem = schematics.objects.get(id=schem_id)
            zone_found = None
            

            zone_id_int = int(zone_id)
            area = 0  
            for item in schem.schematic_json:
                if item.get('type') == 'Zone' and int(item.get('id', 0)) == zone_id_int:
                    zone_found = item
                    area += (int(zone_found["width"]) * int(zone_found["width"])) / 100

            if zone_found:
                cleantimeList = CleanTime.objects.filter(schematic=schem, zone_id=zone_id)
                if len(cleantimeList) >= 5:
                    # Calculate the average time spent on the zone
                    total_time = sum([ct.time_spent.total_seconds() for ct in cleantimeList])
                    estimated_time = total_time / len(cleantimeList)
                else:
                    estimated_time = area * 0.75

                print(f"Estimated time for zone {zone_id} in schematic {schem.name}: {estimated_time} seconds")

                return JsonResponse({'status': 'success', 'estimated_time': estimated_time}, status=200)
            else:
                return JsonResponse({'error': 'Zone not found'}, status=404)
        except schematics.DoesNotExist:
            return JsonResponse({'error': 'Schematic does not exist'}, status=404)





