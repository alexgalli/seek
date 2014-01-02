from django.template.loader import get_template
from django.template import RequestContext
from django.http import HttpResponse

def index(request):
    c = RequestContext(request)
    c["user"] = request.user

    if request.user.id != None:
        t = get_template("loggedin.html")
    else:
        t = get_template("loggedout.html")

    html = t.render(c)
    return HttpResponse(html)