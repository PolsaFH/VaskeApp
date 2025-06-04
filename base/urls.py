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
    path('messages/get_messages/<int:member_id>/', views.get_messages, name='get_messages'),
    path('messages/send_message/', views.send_message, name='send_message'),

    path('notifications/', views.notificationsPage, name='notifications'),

    path('members/admin/role/<str:group_id>/<int:member_id>/', views.change_admin_role, name='change_admin_role'),

    path("group/invite/<str:group_id>", views.invite_member, name="invite_member"),
    path("group/invite/answer/<str:response>/<int:invitation_id>", views.answer_invitation, name="answer_invitation"),
    path("group/create", views.make_group, name="make_group"),
    path("group/select", views.select_group, name="select_group"),


    path('daily/', views.daily_plan, name='daily_plan'),
]
