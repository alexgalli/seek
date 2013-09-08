# Create your views here.

from django.http import HttpResponse, HttpResponseRedirect
from django.views.decorators.http import require_POST
from django.contrib.auth import authenticate, login, logout

@require_POST
def log_in(request):
    if (not 'username' in request.POST or not 'password' in request.POST
      or not request.POST['username'] or not request.POST['password']):
        return HttpResponse(status=400, content="must specify username and password")

    username = request.POST['username']
    password = request.POST['password']

    user = authenticate(username=username, password=password)
    if user is not None:
        if user.is_active:
            login(request, user)
            return HttpResponseRedirect("/")
        else:
            return HttpResponseRedirect("/?error=inactive")
    else:
        return HttpResponseRedirect("/?error=invalid")

@require_POST
def log_out(request):
    logout(request)
    return HttpResponseRedirect("/")

