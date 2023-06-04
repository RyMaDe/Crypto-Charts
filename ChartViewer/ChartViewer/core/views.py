# from django.shortcuts import render
# from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response

class ChartPage(APIView):
    def get(self, request):
        return Response("Hello World!")
