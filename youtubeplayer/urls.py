from django.conf.urls import patterns, include, url

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'youtubeplayer.views.home', name='home'),
    # url(r'^youtubeplayer/', include('youtubeplayer.foo.urls')),

    url(r'^api/add_video$', 'player.views.add_video'),
    url(r'^api/del_video$', 'player.views.del_video'),

    # Uncomment the admin/doc line below to enable admin documentation:
    url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
)
