function Video(videoID) {
    this.videoID = videoID;

    this.getThumbnailUrl = function () {
        return "http://img.youtube.com/vi/" + this.videoID + "/default.jpg"
    }
};

function VideosViewModel() {
    self.videos = ko.observableArray([
        new Video("rvdYly4A5W0"),
        new Video("iaAkWy55V3A"),
        new Video("1ZxN9iQM7OY")
    ])
};

ko.applyBindings(new VideosViewModel());