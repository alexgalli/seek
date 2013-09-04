from django.db import models
from django.contrib.auth.models import User

class Video(models.Model):
    user = models.ForeignKey(User)
    videoID = models.CharField(max_length=30)

class Timestamp(models.Model):
    video = models.ForeignKey(Video)
    minute = models.PositiveIntegerField()
    second = models.PositiveIntegerField()