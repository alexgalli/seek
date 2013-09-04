from django.conf.urls import patterns, include, url
from django.conf import settings
from django.conf.urls.static import static

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'youtubeplayer.views.home', name='home'),
    # url(r'^youtubeplayer/', include('youtubeplayer.foo.urls')),

    # views
    url(r'^$', 'player.views.index'),

    # api calls
    url(r'^api/get_videos$', 'player.apiviews.get_videos'),
    url(r'^api/add_video$', 'player.apiviews.add_video'),
    url(r'^api/del_video$', 'player.apiviews.del_video'),
    url(r'^api/get_timestamps$', 'player.apiviews.get_timestamps'),
    url(r'^api/set_timestamps$', 'player.apiviews.set_timestamps'),

    # Uncomment the admin/doc line below to enable admin documentation:
    url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
)
