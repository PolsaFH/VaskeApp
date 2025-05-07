from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User, Group
from django.contrib.auth.decorators import login_required
import json

from .models import schematics

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
        context = {'members': members, 'group': group}
    else:
        redirect('home')
    
    return render(request, 'base/members.html', context)


@login_required(login_url='login')
def remove_member(request, group_id, member_id):
    if request.method == 'POST':
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
        members = group.user_set.all()
        context = {'members': members, 'group': group}
    else:
        redirect('home')
    return render(request, 'base/messages.html', context)