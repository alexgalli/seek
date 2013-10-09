from django.template.loader import get_template
from django.template import RequestContext
from django.http import HttpResponse

def index(request):
    c = RequestContext(request)
    c["user"] = request.user

    t = get_template('index.html')
    html = t.render(c)
    return HttpResponse(html)
