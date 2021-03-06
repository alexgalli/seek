from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required

from django.http import HttpResponse
import json

from models import Video, Timestamp

# TODO - use forms for api

#region private methods

def get_video_query(user, videoID):
    return Video.objects.filter(user=user, videoID=videoID)

def check_arguments(request, arguments):
    for arg in arguments:
        if arg not in request.POST or not request.POST[arg]:
            return HttpResponse(status=400, content="must include " + arg)

# endregion

#region endpoints

@require_POST
def get_videos(request):
    if request.user.is_authenticated():
        # TODO refactor into get_video_query
        vs = Video.objects.filter(user=request.user).order_by("videoID").all()
    else:
        vs = Video.objects.filter(star=True).order_by("videoID").all()

    vsjs = json.dumps([v.render() for v in vs])
    return HttpResponse(status=200, content=vsjs)

@require_POST
@login_required
def add_video(request):
    err = check_arguments(request, ["videoID"])
    if err: return err

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

    return HttpResponse(status=201, content=json.dumps(v.render()))

@require_POST
@login_required
def del_video(request):
    err = check_arguments(request, ["videoID"])
    if err: return err

    # check to see if video exists for user
    vq = get_video_query(request.user, request.POST["videoID"])
    if vq.count() == 0:
        return HttpResponse(status=404, content="videoID %s does not exist for user" % request.POST["videoID"])

    # delete video
    vq[0].delete()

    return HttpResponse(status=200)

@require_POST
@login_required
def star_video(request):
    err = check_arguments(request, ["videoID", "star"])
    if err: return err

    star = request.POST['star'].lower()
    if star != 'true' and star != 'false':
        return HttpResponse(status=400, content="star must be equal to true or false")

    # check to see if video exists for user
    vq = get_video_query(request.user, request.POST["videoID"])
    if vq.count() == 0:
        return HttpResponse(status=404, content="videoID %s does not exist for user" % request.POST["videoID"])

    # set star value
    v = vq[0]
    v.star = star == 'true'
    v.save()

    return HttpResponse(status=200)

@require_POST
def get_timestamps(request):
    err = check_arguments(request, ["videoID"])
    if err: return err

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
    ts = [t.render() for t in Timestamp.objects.filter(video=vq[0]).order_by("time")]

    return HttpResponse(status=200, content_type="application/json", content=json.dumps(ts))

@require_POST
@login_required
def set_timestamps(request):
    err = check_arguments(request, ["videoID"])
    if err: return err

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

#endregion