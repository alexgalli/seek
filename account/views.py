# Create your views here.

from django.http import HttpResponse, HttpResponseRedirect
from django.views.decorators.http import require_POST
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User

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

# TODO - reimplement forms as django forms
@require_POST
def register(request):
    if not all(k in request.POST and request.POST[k] for k in ('username', 'email', 'password', 'repassword')):
        return HttpResponse(status=400, content="must provide valid values for username, email, password")

    email = request.POST["email"]

    from django.core.validators import validate_email
    from django.core.exceptions import ValidationError
    try:
        validate_email(email)
    except ValidationError:
        return HttpResponse(status=400, content="must provide valid email")

    username = request.POST["username"]
    if any(User.objects.filter(username=username)):
        return HttpResponse(status=400, content="username already taken")

    password = request.POST["password"]
    if not password == request.POST["repassword"]:
        return HttpResponse(status=400, content="passwords must match")

    User.objects.create_user(username=username, email=email, password=password)
    return log_in(request)
