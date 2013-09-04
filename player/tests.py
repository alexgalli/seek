"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""

from django.test import TestCase
from django.test.client import Client

from django.contrib.auth.models import User
from models import Video

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

    def add_video(self):
        Video(user=self.get_user(), videoID="asdf").save()

    def test_add_video(self):
        assert self.get_video_count() == 0
        self.add_video()
        assert self.get_video_count() == 1

    def test_valid_ID_deletes_video(self):
        self.add_video()
        res = self.get_del_response({"videoID": "asdf"})
        assert res.status_code == 200
        assert self.get_video_count() == 0

    def test_no_ID_returns_badrequest(self):
        assert self.get_del_response({}).status_code == 400

    def test_bad_ID_returns_badrequest(self):
        assert self.get_del_response({"videoID": ""}).status_code == 400

    def test_wrong_ID_returns_badrequest(self):
        self.add_video()
        assert self.get_del_response({"videoID": "fdsa"}).status_code == 404







