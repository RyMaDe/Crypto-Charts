from django.urls import path

from . import views

app_name = "frontend"
urlpatterns = [
    # View which links to the main page of the website. This is the page to view the charts.
    path("", views.ChartPage, name="ChartPage"),
]
