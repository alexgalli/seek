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

    def get_response(self, method, data):
        c = Client()
        c.login(username="user", password="password")
        return c.post("/api/" + method, data=data)

    def get_video_count(self):
        return Video.objects.filter(user=self.get_user(), videoID="asdf").count()

    def add_video(self):
        v = Video(user=self.get_user(), videoID="asdf")
        v.save()
        return v

    def test_add_video(self):
        assert self.get_video_count() == 0
        self.add_video()
        assert self.get_video_count() == 1

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

    def add_video_with_timestamp(self):
        v = self.add_video()
        Timestamp(video=v, minutes=1, seconds=30).save()

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
        assert ts[0]["minutes"] == 1
        assert ts[0]["seconds"] == 30

    def test_bad_videoID_returns_badrequest(self):
        assert self.get_get_timestamps({"videoID": ''}).status_code == 400

    def test_wrong_videoID_returns_notfound(self):
        self.add_video_with_timestamp()
        assert self.get_get_timestamps({"videoID": 'fdsa'}).status_code == 404

