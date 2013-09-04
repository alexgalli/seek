from django.template.loader import get_template
from django.template import Context
from django.http import HttpResponse

def index(self):
    t = get_template('index.html')
    c = Context({})
    html = t.render(c)
    return HttpResponse(html)
