from django.db import models
from django.contrib.auth.models import User

class Video(models.Model):
    user = models.ForeignKey(User)
    videoID = models.CharField(max_length=30)
    title = models.CharField(max_length=200)
    star = models.BooleanField(default=False)

    def render(self):
        ts = [t.render() for t in Timestamp.objects.filter(video=self).order_by("time")]
        return {
            "videoID": self.videoID,
            "title": self.title,
            "star": self.star,
            "timestamps": ts
        }

class Timestamp(models.Model):
    video = models.ForeignKey(Video)
    name = models.TextField()
    # time in seconds
    time = models.BigIntegerField()

    def render(self):
        return {
            "name": self.name,
            "time": self.time
        }
