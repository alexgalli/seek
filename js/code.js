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

// configure AJAX authentication
setupCsrf();

// instantiate model
var model = new SeekViewModel();

// load our videos, and when complete load our player
api.getVideos(function(videos) {
    if (videos.length != 0) {
        model.videos(videos);
        model.player.init(videos[0].videoID);
        model.player.loadVideo(videos[0]);
    } else {
        model.player.init();
    }

    ko.applyBindings(model);
});
