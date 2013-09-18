from django.db import models
from django.contrib.auth.models import User

class Video(models.Model):
    user = models.ForeignKey(User)
    videoID = models.CharField(max_length=30)
    title = models.CharField(max_length=200)

class Timestamp(models.Model):
    video = models.ForeignKey(Video)
    name = models.TextField()
    # time in seconds
    time = models.BigIntegerField()
