from django import forms

class AddVideoForm(forms.Form):
    youtubeUrl = forms.URLField(min_length=1, label="Enter YouTube URL")

class AddTimestampForm(forms.Form):
    timestampName = forms.CharField(label="New timestamp at ")