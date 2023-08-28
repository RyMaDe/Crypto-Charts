from django.shortcuts import render
# from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
import requests, json
import environ

env = environ.Env()
environ.Env.read_env()
# Environment variables to access the API key.

class CoinDataAPI(APIView):
    def get(self, request):
        """
        When the front-end JS file makes an API request, it will provide the coin symbol.
        An API call is then made to the Alphavantage API to get the API data.
        This slows down the website significantly.
        We then make changes to the data received from the API call and then
        send it back to the front end.
        """
        coin = request.GET.get("coin") # coin symbol
        url = "https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY&symbol="+coin+"&market=GBP&apikey="
        data = requests.get(url+env("Alphavantage_API")).json()
        # The data contains metadata as well as Price data.

        #print(json.dumps(data, indent=4))
        #print(json.dumps(data["Time Series (Digital Currency Daily)"], indent =4))

        # For the crypto data to be used for the Tooltip, it requires that all the data is sorted
        # by the date in ascending order.
        # As the data is already in descending order, we just need to reverse the list
        # rather than sort, saving time.
        timeSeries = dict(reversed(list(data["Time Series (Digital Currency Daily)"].items())))
        data["Time Series (Digital Currency Daily)"] = timeSeries

        # Return the Crypto data to the front-end.
        return Response(data)

