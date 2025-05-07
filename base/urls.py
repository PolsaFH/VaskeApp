from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.loginPage, name='login'),
    path('logout/', views.logoutUser, name='logout'),

    path('', views.home, name='home'),
    path('schematic/group/<str:pk>/', views.group, name='schematic_group'),
    path('schematic/show/<str:pk>/', views.schematic, name='schematic'),
    path('schematic/maker/', views.upload, name='upload'),
    path('set_active_group/<str:group_id>/', views.set_active_group, name='set_active_group'),
    path('upload-schematic/', views.upload_schematic, name='upload_schematic'),

    path('members/view/', views.members, name='members'),
    path('members/remove/<int:group_id>/<int:member_id>', views.remove_member, name='remove_member'),

    path('messages/', views.messagesPage, name='messages'),
]
