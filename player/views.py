from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required

from django.http import HttpResponse
import json

from models import Video, Timestamp

def get_video_query(user, videoID):
    return Video.objects.filter(user=user, videoID=videoID)

@require_POST
@login_required
def add_video(request):
    # check input
    if "videoID" not in request.POST or not request.POST["videoID"]:
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
    if "videoID" not in request.POST or not request.POST["videoID"]:
        return HttpResponse(status=400, content="must include videoID")

    # check to see if video exists for user
    vq = get_video_query(request.user, request.POST["videoID"])
    if vq.count() == 0:
        return HttpResponse(status=404, content="videoID %s does not exist for user" % request.POST["videoID"])

    # delete video
    vq[0].delete()

    return HttpResponse(status=200)

@require_POST
@login_required
def get_timestamps(request):
    # check input
    if "videoID" not in request.POST or not request.POST["videoID"]:
        return HttpResponse(status=400, content="must include videoID")

    # look up the video
    vq = get_video_query(request.user, request.POST["videoID"])
    if vq.count() == 0:
        return HttpResponse(status=404, content="videoID %s does not exist for user" % request.POST["videoID"])

    # get the list of all timestamps for this video
    ts = [{"minutes": t.minutes, "seconds": t.seconds} for t in Timestamp.objects.filter(video=vq[0])]

    return HttpResponse(status=200, content_type="application/json", content=json.dumps(ts))
