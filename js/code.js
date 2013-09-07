/* knockout models */

function Video(videoID) {
    var self = this;

    self.videoID = videoID;

    self.timestamps = ko.observableArray();

    self.getThumbnailUrl = function() {
        return "http://img.youtube.com/vi/" + self.videoID + "/default.jpg";
    }

    self.loadVideo = function() {
        model.currentVideo(self);
        $("#player").tubeplayer("cue", videoID);
        $("#player").tubeplayer("play");
    }

    self.addTimestamp = function() {
        var playerData = $("#player").tubeplayer("data");

        self.timestamps.push(new Timestamp(playerData.currentTime));
    }
}

function Timestamp(time) {
    this.time = time;

    this.getDisplay = function() {
        return Math.floor(this.time / 60) + " minutes and " + Math.floor(this.time % 60) + " seconds"
    }

    this.deleteTimestamp = function() {
        model.currentVideo().timestamps.remove(this);
    }
}

function VideosViewModel() {
    var self = this;

    self.videos = ko.observableArray();

    self.currentVideo = ko.observable();

    /* API access */
    self.getVideos = function(callback) {
        $.ajax(
            "/api/get_videos",
            {
                method: "post",
                dataType: "json",
                success: function(data) {
                    var newVideos = $.map(data, function(i) {
                        return new Video(i);
                    });
                    self.videos(newVideos);

                    if (callback) callback(newVideos);
                }
            });
    }

    self.addVideo = function(videoID) {
        $.ajax(
            "/api/add_videos",
            {
                method: "post",
                data: { "videoID": videoID }
            }
        );
    }

    /* event handlers */
    self.onAddVideoClick = function() {
        $("#addVideo").modal();
    }

    self.onAddVideoSubmit = function(model, e) {
        if (e.charCode === 13) {
            var videoID = $("#videoID").val();
            var video = new Video(videoID);

            self.videos.unshift(video);
            video.loadVideo();

            self.addVideo(videoID);

            $.modal.close();

            $("#videoID").val("");

            return;
        }
        return true;
    }

    self.onAddTimestamp = function() {
        self.currentVideo().addTimestamp();
    }
}

/* private methods */

// configure ajax requests to pass csrf cookie
function setupCsrf() {
    var csrftoken = $.cookie('csrftoken');

    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    $.ajaxSetup({
        crossDomain: false,
        beforeSend: function(xhr, settings) {
            if (!csrfSafeMethod(settings.type)) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
    }}});
}

// set up the youtube player
function setupTubePlayer(videoID) {
    $("#player").tubeplayer({
        width: 600,
        height: 450,
        allowFullScreen: "true",
        initialVideo: videoID
    });
}

/* code */

// configure AJAX authentication
setupCsrf();

// instantiate model
var model = new VideosViewModel();

// load our videos, and when complete load our player
model.getVideos(function(videos) {
    setupTubePlayer(videos[0].videoID);
    videos[0].loadVideo();

    ko.applyBindings(model);
});
