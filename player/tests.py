"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""

from django.test import TestCase
from django.test.client import Client

import json

from django.contrib.auth.models import User
from models import Video, Timestamp

class PlayerTestCase(TestCase):
    def setUp(self):
        u = User.objects.create_user("user", password="password")
        u.save()

    def get_user(self):
        return User.objects.filter(username="user")[0]

    def get_response(self, method, data, log_in=True):
        c = Client()
        if log_in:
            c.login(username="user", password="password")
        return c.post("/api/" + method, data=data)

    def get_video(self):
        return Video.objects.filter(user=self.get_user(), videoID="asdf")[0]

    def get_video_count(self):
        return Video.objects.filter(user=self.get_user(), videoID="asdf").count()

    def add_video(self, videoID="asdf"):
        v = Video(user=self.get_user(), videoID=videoID)
        v.save()
        return v

    def test_add_video(self):
        assert self.get_video_count() == 0
        self.add_video()
        assert self.get_video_count() == 1

    def add_video_with_timestamp(self):
        v = self.add_video()
        Timestamp(video=v, name="ts", time=90).save()

class get_videos(PlayerTestCase):
    def get_get_videos_response(self, data, log_in=True):
        return self.get_response("get_videos", data, log_in=log_in)

    def test_logged_in_without_videos_returns_no_videos(self):
        res = self.get_get_videos_response({})
        assert res.status_code == 200
        vs = json.loads(res.content)
        assert len(vs) == 0

    def test_logged_in_with_videos_returns_videos(self):
        self.add_video("aaaa")
        self.add_video("bbbb")
        self.add_video("cccc")
        res = self.get_get_videos_response({})
        assert res.status_code == 200
        vs = json.loads(res.content)
        assert len(vs) == 3
        assert vs[0] == "aaaa"
        assert vs[1] == "bbbb"
        assert vs[2] == "cccc"

    def test_not_logged_in_returns_default_videos(self):
        res = self.get_get_videos_response({}, log_in=False)
        assert res.status_code == 200
        vs = json.loads(res.content)
        assert len(vs) == 3
        assert vs[0] == "rvdYly4A5W0"
        assert vs[1] == "iaAkWy55V3A"
        assert vs[2] == "1ZxN9iQM7OY"

class add_video(PlayerTestCase):
    def get_add_response(self, data):
        return self.get_response("add_video", data)

    def test_valid_ID_creates_video(self):
        res = self.get_add_response({"videoID": "asdf"})
        assert res.status_code == 201

        assert Video.objects.filter(user=self.get_user(), videoID="asdf").count() == 1

    def test_no_ID_returns_badrequest(self):
        res = self.get_add_response({})
        assert res.status_code == 400

    def test_bad_ID_returns_badrequest(self):
        res = self.get_add_response({"videoID": ""})
        assert res.status_code == 400

    def test_duplicate_ID_returns_conflict(self):
        self.get_add_response({"videoID": "asdf"})
        res = self.get_add_response({"videoID": "asdf"})
        assert res.status_code == 409

class del_video(PlayerTestCase):
    def get_del_response(self, data):
        return self.get_response("del_video", data)

    def test_valid_ID_deletes_video(self):
        self.add_video()
        res = self.get_del_response({"videoID": "asdf"})
        assert res.status_code == 200
        assert self.get_video_count() == 0

    def test_no_ID_returns_badrequest(self):
        assert self.get_del_response({}).status_code == 400

    def test_bad_ID_returns_badrequest(self):
        assert self.get_del_response({"videoID": ""}).status_code == 400

    def test_wrong_ID_returns_notfound(self):
        self.add_video()
        assert self.get_del_response({"videoID": "fdsa"}).status_code == 404

class get_timestamps(PlayerTestCase):
    def get_get_timestamps(self, data):
        return self.get_response("get_timestamps", data)

    def test_valid_videoID_with_no_timestamps_returns_no_timestamps(self):
        self.add_video()
        res = self.get_get_timestamps({'videoID': 'asdf'})
        assert res.status_code == 200
        ts = json.loads(res.content)
        assert isinstance(ts, list)
        assert len(ts) == 0

    def test_valid_videoID_with_one_timestamp_returns_one_timestamp(self):
        self.add_video_with_timestamp()
        res = self.get_get_timestamps({'videoID': 'asdf'})
        assert res.status_code == 200
        ts = json.loads(res.content)
        assert isinstance(ts, list)
        assert len(ts) == 1
        assert ts[0]["name"] == "ts"
        assert ts[0]["time"] == 90

    def test_bad_videoID_returns_badrequest(self):
        assert self.get_get_timestamps({"videoID": ''}).status_code == 400

    def test_wrong_videoID_returns_notfound(self):
        self.add_video_with_timestamp()
        assert self.get_get_timestamps({"videoID": 'fdsa'}).status_code == 404

class set_timestamps(PlayerTestCase):
    def get_set_timestamps(self, data):
        return self.get_response("set_timestamps", data)

    def test_valid_videoID_with_timestamps_adds_timestamps(self):
        self.add_video()
        ts = [
            {"name": "verse", "time": 90},
            {"name": "chorus", "time": 165}
        ]
        assert self.get_set_timestamps({"videoID": "asdf", "timestamps": json.dumps(ts)}).status_code == 200

        ts = Timestamp.objects.filter(video=self.get_video()).order_by("time").all()
        assert len(ts) == 2
        assert ts[0].name == "verse"
        assert ts[0].time == 90
        assert ts[1].name == "chorus"
        assert ts[1].time == 165

    def test_valid_videoID_with_no_timestamps_clears_existing(self):
        self.add_video_with_timestamp()
        ts = []
        assert self.get_set_timestamps({"videoID": "asdf", "timestamps": json.dumps(ts)}).status_code == 200

        ts = Timestamp.objects.filter(video=self.get_video()).all()
        assert len(ts) == 0

    def test_no_videoID_returns_badrequest(self):
        assert self.get_set_timestamps({"timestamps": "[]"}).status_code == 400

    def test_bad_videoID_returns_badrequest(self):
        assert self.get_set_timestamps({"videoID": "", "timestamps": "[]"}).status_code == 400

    def test_wrong_videoID_returns_notfound(self):
        self.add_video()
        assert self.get_set_timestamps({"videoID": "fdsa", "timestamps": "[]"}).status_code == 404

    def test_malformed_timestamp_JSON_returns_badrequest(self):
        self.add_video()
        assert self.get_set_timestamps({"videoID": "asdf", "timestamps": "[[[}}}asdf"}).status_code == 400

    def test_incomplete_timestamp_JSON_returns_badrequest(self):
        self.add_video()
        assert self.get_set_timestamps({"videoID": "asdf", "timestamps": "[{}]"}).status_code == 400
