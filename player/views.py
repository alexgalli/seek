from django.template.loader import get_template
from django.template import RequestContext
from django.http import HttpResponse

from account.forms import LoginForm, RegisterForm, ChangePasswordForm
from player.forms import AddVideoForm, AddTimestampForm

def index(request):
    c = RequestContext(request)
    c["user"] = request.user
    c["form"] = {}

    c["form"]["addvideo"] = AddVideoForm()
    c["form"]["addtimestamp"] = AddTimestampForm()

    if request.user.id != None:
        t = get_template("loggedin.html")
        c["form"]["account"] = ChangePasswordForm()
    else:
        t = get_template("loggedout.html")
        c["form"]["login"] = LoginForm()
        c["form"]["register"] = RegisterForm()

    html = t.render(c)
    return HttpResponse(html)