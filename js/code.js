/* knockout models */

function Video(videoID) {
    this.videoID = videoID;

    this.getThumbnailUrl = function() {
        return "http://img.youtube.com/vi/" + this.videoID + "/default.jpg";
    }

    this.loadVideo = function() {
        $("#player").tubeplayer("cue", videoID);
    }
}

function VideosViewModel() {
    var self = this;

    self.videos = ko.observableArray();

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

    self.getVideos();
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

// setup knockout
var model = new VideosViewModel();
ko.applyBindings(model);

// load our videos, and when complete load our player
model.getVideos(function(data) {
    setupTubePlayer(data[0]);
});
