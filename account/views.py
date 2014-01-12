# Create your views here.

from django import forms
from django.http import HttpResponse, HttpResponseRedirect
from django.views.decorators.http import require_POST
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.template import RequestContext
from django.template.loader import get_template

from account.forms import LoginForm, RegisterForm, ChangePasswordForm

from django.contrib.auth import views as authViews

@require_POST
def log_in(request):
    form = LoginForm(request.POST)

    if not form.is_valid():
        return HttpResponse(status=400, content="Must fill in all fields")

    username = form.cleaned_data["username"]
    password = form.cleaned_data["password"]

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

@require_POST
def register(request):
    form = RegisterForm(request.POST)
    if not form.is_valid():
        return HttpResponse(status=400, content=form.get_error_message())

    email = form.cleaned_data["email"]
    username = form.cleaned_data["username"]
    password = form.cleaned_data["password"]

    if any(User.objects.filter(username=username)):
        return HttpResponse(status=400, content="Username already taken")

    if not password == request.POST["repassword"]:
        return HttpResponse(status=400, content="Passwords must match")

    User.objects.create_user(username=username, email=email, password=password)

    return log_in(request)

@require_POST
@login_required
def change_password(request):
    form = ChangePasswordForm(request.POST)
    if not form.is_valid():
        return HttpResponse(status=400, content="Must fill in all fields")

    password = form.cleaned_data["password"]
    repassword = form.cleaned_data["repassword"]
    oldpassword = form.cleaned_data['oldpassword']

    if password != repassword:
        return HttpResponse(status=400, content="New passwords do not match")

    if not request.user.check_password(oldpassword):
        return HttpResponse(status=400, content="Old password is incorrect")

    request.user.set_password(password)
    request.user.save()
    return HttpResponse(status=200)

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