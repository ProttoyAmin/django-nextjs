from django.urls import path, re_path, include

from . import views

urlpatterns = [
    path('', views.institute_list, name='institute_list'),
    path('<int:pk>/', views.institute_info, name='institute_info'),
]