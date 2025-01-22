from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('schematic/show/<str:pk>/', views.schematic, name='schematic'),
    path('schematic/upload/', views.upload, name='upload'),
]
