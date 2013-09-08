from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required

from django.http import HttpResponse
import json

from models import Video, Timestamp

def get_video_query(user, videoID):
    return Video.objects.filter(user=user, videoID=videoID)

@require_POST
def get_videos(request):
    if request.user.is_authenticated():
        # TODO refactor into get_video_query
        vs = [v.videoID for v in Video.objects.filter(user=request.user).order_by("videoID").all()]
        return HttpResponse(status=200, content=json.dumps(vs))
    else:
        vs = ["rvdYly4A5W0", "iaAkWy55V3A", "1ZxN9iQM7OY"]
        return HttpResponse(status=200, content=json.dumps(vs))

@require_POST
@login_required
def add_video(request):
    # check input
    if "videoID" not in request.POST or not request.POST["videoID"]:
        return HttpResponse(status=400, content="must include videoID")

    # check to see if video exists for user
    # TODO refactor to use get_video_query
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

@require_POST
@login_required
def set_timestamps(request):
    # check input
    if "videoID" not in request.POST or not request.POST["videoID"]:
        return HttpResponse(status=400, content="must include videoID")

    if "timestamps" not in request.POST or not request.POST["timestamps"]:
        return HttpResponse(status=400, content="must include timestamps")

    # parse input
    try:
        ts = json.loads(request.POST["timestamps"])
    except ValueError:
        return HttpResponse(status=400, content="invalid timestamps json")

    if not all(isinstance(t, dict) and "minutes" in t and "seconds" in t for t in ts):
        return HttpResponse(status=400, content="invalid timestamps json")

    # look up video
    vq = get_video_query(request.user, request.POST["videoID"])
    if vq.count() == 0:
        return HttpResponse(status=404, content="videoID %s does not exist for user" % request.POST["videoID"])
    v = vq[0]

    # attach timestamps to video
    timestamps = [Timestamp(video=v, minutes=t["minutes"], seconds=t["seconds"]) for t in ts]
    for t in timestamps:
        t.save()

    return HttpResponse(status=200)
