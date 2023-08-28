from django.urls import path

from . import views


app_name = "core"
urlpatterns = [
    # View to gain access to the Crypto data.
    path("CoinData", views.CoinDataAPI.as_view(), name = "CoinDataAPI"),
]
