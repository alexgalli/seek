/* knockout models */

function Video(videoID) {
    this.videoID = videoID;

    this.getThumbnailUrl = function() {
        return "http://img.youtube.com/vi/" + this.videoID + "/default.jpg";
    }

    this.loadVideo = function() {
        $("#player").tubeplayer("cue", videoID);
        $("#player").tubeplayer("play");
    }
}

function Timestamp(time) {
    this.time = time;

    this.getDisplay = function() {
        return Math.floor(this.time / 60) + " minutes and " + Math.floor(this.time % 60) + " seconds"
    }

    this.deleteTimestamp = function() {
        model.timestamps.remove(this);
    }
}

function VideosViewModel() {
    var self = this;

    self.videos = ko.observableArray();
    self.timestamps = ko.observableArray();

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

                    if (callback) callback(data);
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

            video.loadVideo();
            self.videos.unshift(video);

            self.addVideo(videoID);

            $.modal.close();

            $("#videoID").val("");

            return;
        }
        return true;
    }

    self.onAddTimestamp = function() {
        var playerData = $("#player").tubeplayer("data");

        self.timestamps.push(new Timestamp(playerData.currentTime));
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

// file modal dialogs


// configure AJAX authentication
setupCsrf();

// setup knockout
var model = new VideosViewModel();
ko.applyBindings(model);

// load our videos, and when complete load our player
model.getVideos(function(data) {
    setupTubePlayer(data[0]);
});
