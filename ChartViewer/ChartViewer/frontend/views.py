from django.shortcuts import render

def ChartPage(request):
    context = {"Crypto": ""}
    # Render the index html page. This is the main page of the website where charts are displayed.
    return render(request, "core/index.html", context)
