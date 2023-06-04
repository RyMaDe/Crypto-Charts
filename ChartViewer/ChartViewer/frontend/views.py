from django.shortcuts import render

def ChartPage(request):
    context = {"Crypto": ""}
    return render(request, "core/index.html", context)
