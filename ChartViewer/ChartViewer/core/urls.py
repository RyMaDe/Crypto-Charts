from django.urls import path

from . import views


app_name = "core"
urlpatterns = [
    path("CoinData", views.CoinDataAPI.as_view(), name = "CoinDataAPI"),
]
