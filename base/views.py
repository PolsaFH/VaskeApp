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
            print('register')
    
    context = {'type': request.GET.get('type')}
    return render(request, 'base/login_register.html', context)


def logoutUser(request):
    logout(request)
    return redirect('home')


# Create your views here.
def home(request):
    user = request.user
    user_group = user.groups.all()
    context = {'groups': user_group}
    return render(request, 'base/home.html', context)

def group(request, pk):
    if(pk):
        user = request.user
        user_group = user.groups.get(id=pk)
        schem = user_group.schematics_set.all()

        context = {'schems': schem}

        return render(request, 'base/group_schematic.html', context)
    else:
        return render(request, 'base/home.html')

def schematic(request, pk):
    if(pk):
        schem = schematics.objects.get(id=pk) # Må endre slik at man kan bare hente fra sine egne grupper

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
