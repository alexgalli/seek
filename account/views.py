# Create your views here.

from django.http import HttpResponse, HttpResponseRedirect
from django.views.decorators.http import require_POST
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.template import RequestContext
from django.template.loader import get_template

@require_POST
def log_in(request):
    if (not 'username' in request.POST or not 'password' in request.POST
      or not request.POST['username'] or not request.POST['password']):
        return HttpResponse(status=400, content="Must fill in all fields")

    username = request.POST['username']
    password = request.POST['password']

    user = authenticate(username=username, password=password)
    if user is not None:
        if user.is_active:
            login(request, user)
            return HttpResponse(status=200)
        else:
            return HttpResponse(status=400, content="Account has been de-activated")
    else:
        return HttpResponse(status=400, content="Username or password is incorrect")

def log_out(request):
    logout(request)
    return HttpResponseRedirect("/")

# TODO - reimplement forms as django forms
@require_POST
def register(request):
    if not all(k in request.POST and request.POST[k] for k in ('username', 'email', 'password', 'repassword')):
        return HttpResponse(status=400, content="Must fill in all fields")

    email = request.POST["email"]

    from django.core.validators import validate_email
    from django.core.exceptions import ValidationError
    try:
        validate_email(email)
    except ValidationError:
        return HttpResponse(status=400, content="Must provide valid email address")

    username = request.POST["username"]
    if any(User.objects.filter(username=username)):
        return HttpResponse(status=400, content="Username already taken")

    password = request.POST["password"]
    if not password == request.POST["repassword"]:
        return HttpResponse(status=400, content="Passwords must match")

    User.objects.create_user(username=username, email=email, password=password)
    return log_in(request)

@require_POST
@login_required
def change_password(request):
    if not all(k in request.POST and request.POST[k] for k in ('oldpassword', 'password', 'repassword')):
        return HttpResponse(status=400, content="Must fill in all fields")

    password = request.POST["password"]
    repassword = request.POST["repassword"]
    if password != repassword:
        return HttpResponse(status=400, content="New passwords do not match")

    oldpassword = request.POST['oldpassword']
    if not request.user.check_password(oldpassword):
        return HttpResponse(status=400, content="Old password is incorrect")

    request.user.set_password(password)
    request.user.save()
    return HttpResponse(status=200)

from django.contrib.auth import forms as authForms
from django.contrib.auth import views as authViews
def reset_password(request):
    return authViews.password_reset(request, template_name="reset_password.html",
                                    post_reset_redirect="/account/reset_password/sent",
                                    email_template_name="reset_email.txt",
                                    subject_template_name="reset_email_subject.txt",
                                    from_email="webmaster@chapterhouse.io")

def reset_password_sent(request):
    t = get_template("reset_password_sent.html")
    return HttpResponse(t.render(RequestContext(request)))

def reset_password_change(request, uidb36, token):
    return authViews.password_reset_confirm(request,
                                            uidb36=uidb36,
                                            token=token,
                                            template_name="reset_password_change.html",
                                            post_reset_redirect="/account/reset_password/done")

def reset_password_done(request):
    return authViews.password_reset_complete(request,
                                             template_name="reset_password_done.html")