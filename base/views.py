from django.shortcuts import render

schems = [
    {'id': 1, 'name': 'Schematic 1'},
    {'id': 2, 'name': 'Schematic 2'},
    {'id': 3, 'name': 'Erik er søt'},
]

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

def upload(request):
    return render(request, 'base/upload.html')
