from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.loginPage, name='login'),
    path('logout/', views.logoutUser, name='logout'),

    path('', views.home, name='home'),
    path('schematic/group/<str:pk>/', views.group, name='schematic_group'),
    path('schematic/show/<str:pk>/', views.schematic, name='schematic'),
    path('schematic/upload/', views.upload, name='upload'),
    path('set_active_group/<str:group_id>/', views.set_active_group, name='set_active_group'),
]
