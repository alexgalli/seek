/* knockout models */

function Video(videoID) {
    this.videoID = videoID;

    this.getThumbnailUrl = function() {
        return "http://img.youtube.com/vi/" + this.videoID + "/default.jpg";
    }
}

function VideosViewModel() {
    var self = this;

    self.videos = ko.observableArray();

    self.loadVideos = function() {
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
                }
            });
    }

    self.loadVideos();
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

/* code */

setupCsrf();

var model = new VideosViewModel();
ko.applyBindings(model);
model.loadVideos();
