from django.shortcuts import render
# from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
import requests, json
import environ

env = environ.Env()
environ.Env.read_env()

class CoinDataAPI(APIView):
    def get(self, request):
        coin = request.GET.get("coin") # coin symbol
        url = "https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY&symbol="+coin+"&market=GBP&apikey="
        data = requests.get(url+env("Alphavantage_API")).json()
        
        return Response(data)
