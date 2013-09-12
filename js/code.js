

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
    if (!videoID) {
        videoID = 'FGVGFfj7POA';
    }

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
var model = new SeekViewModel();

// load our videos, and when complete load our player
api.getVideos(function(videos) {
    if (videos.length != 0) {
        model.videos(videos);
        setupTubePlayer(videos[0].videoID);
        model.loadVideo(videos[0]);
    } else {
        setupTubePlayer();
    }

    ko.applyBindings(model);
});
