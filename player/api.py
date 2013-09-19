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
        vs = [{"videoID": v.videoID, "title": v.title} for v in Video.objects.filter(user=request.user).order_by("videoID").all()]
        return HttpResponse(status=200, content=json.dumps(vs))
    else:
        vs = [
            {"videoID": "_lK4cX5xGiQ", "title": "Tenacious D - Tribute"},
            {"videoID": "iaAkWy55V3A", "title": "30 Shredders In One Solo!"},
            {"videoID": "1ZxN9iQM7OY", "title": "Otis Redding - Hard To Handle"}
        ]

        return HttpResponse(status=200, content=json.dumps(vs))

@require_POST
@login_required
def add_video(request):
    # check input
    if "videoID" not in request.POST or not request.POST["videoID"]:
        return HttpResponse(status=400, content="must include videoID")

    videoID = request.POST["videoID"]

    # check to see if video exists for user
    # TODO refactor to use get_video_query
    if Video.objects.filter(user=request.user, videoID=videoID).count() != 0:
        return HttpResponse(status=409, content="videoID %s already exists for user" % videoID)

    # look up video in youtube api
    from gdata.youtube.service import YouTubeService
    yt_service = YouTubeService()
    data = yt_service.GetYouTubeVideoEntry(video_id=videoID)

    # save new video for user
    v = Video(videoID=videoID, user=request.user, title=data.media.title.text)
    v.save()

    return HttpResponse(status=201, content=json.dumps({"videoID": v.videoID, "title": v.title}))

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
def get_timestamps(request):
    # check input
    if "videoID" not in request.POST or not request.POST["videoID"]:
        return HttpResponse(status=400, content="must include videoID")

    # give a default value for Tribute
    if not request.user.id and request.POST["videoID"] == "_lK4cX5xGiQ":
        ts = [
            {"name": "..and he said!", "time": 91},
            {"name": "we played the first thing", "time": 114},
            {"name": "ROCK", "time": 162},
            {"name": "ah - dee - skibbee dibbee - do dee", "time": 208},
            {"name": "solo", "time": 218}
        ]
        return HttpResponse(status=200, content_type="application/json", content=json.dumps(ts))

    # look up the video
    vq = get_video_query(request.user, request.POST["videoID"])
    if vq.count() == 0:
        return HttpResponse(status=404, content="videoID %s does not exist for user" % request.POST["videoID"])

    # get the list of all timestamps for this video
    ts = [{"name": t.name, "time": t.time} for t in Timestamp.objects.filter(video=vq[0]).order_by("time")]

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

    if not all(isinstance(t, dict) and "name" in t and "time" in t for t in ts):
        return HttpResponse(status=400, content="invalid timestamps json")

    # look up video
    vq = get_video_query(request.user, request.POST["videoID"])
    if vq.count() == 0:
        return HttpResponse(status=404, content="videoID %s does not exist for user" % request.POST["videoID"])
    v = vq[0]

    # clear existing timestamps
    oldTimestamps = Timestamp.objects.filter(video=v).delete()

    # attach timestamps to video
    newTimestamps = [Timestamp(video=v, name=t["name"], time=t["time"]) for t in ts]
    for t in newTimestamps:
        t.save()

    return HttpResponse(status=200)
