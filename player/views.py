from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required

from django.http import HttpResponse

from models import Video

@require_POST
@login_required
def add_video(request):
    # check input
    if 'videoID' not in request.POST or not request.POST["videoID"]:
        return HttpResponse(status=400, content="must include videoID")

    # check to see if video exists for user
    if Video.objects.filter(user=request.user, videoID=request.POST["videoID"]).count() != 0:
        return HttpResponse(status=409, content="videoID %s already exists for user" % request.POST["videoID"])

    # save new video for user
    v = Video(videoID = request.POST["videoID"], user = request.user)
    v.save()

    return HttpResponse(status=201)

@require_POST
@login_required
def del_video(request):
    # check input
    if 'videoID' not in request.POST or not request.POST["videoID"]:
        return HttpResponse(status=400, content="must include videoID")

    # check to see if video exists for user
    vq = Video.objects.filter(user=request.user, videoID=request.POST["videoID"])
    if vq.count() == 0:
        return HttpResponse(status=404, content="videoID %s doesn't exist for user" % request.POST["videoID"])

    # delete video
    vq[0].delete()

    return HttpResponse(status=200)
