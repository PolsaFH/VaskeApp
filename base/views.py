from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required

schems = [
    {'id': 1, 'name': 'Schematic 1'},
    {'id': 2, 'name': 'Schematic 2'},
    {'id': 3, 'name': 'Erik er søt'},
]


def loginPage(request):

    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        try:
            user = User.objects.get(username=username)
        except:
            messages.error(request, 'Username is incorrect')

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
    
    context = {}
    return render(request, 'base/login_register.html', context)


def logoutUser(request):
    logout(request)
    return redirect('home')


# Create your views here.
def home(request):
    context = {'schems': schems}
    return render(request, 'base/home.html', context)

def schematic(request, pk):
    schem = None

    for i in schems:
        if i['id'] == int(pk):
            schem = i
            break
    
    context = {'schem': schem}
    return render(request, 'base/schematic.html', context)

@login_required(login_url='login')
def upload(request):
    return render(request, 'base/upload.html')
