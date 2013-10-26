function SeekViewModel() {
    var self = this;

    self.videos = ko.observableArray();

    self.player = new Player();

    // load our videos, and when complete load our player
    api.getVideos(self.player, function(videos) {
        if (videos.length != 0) {
            self.videos(videos);
            self.player.init(videos[0]);
        } else {
            self.player.init();
        }

        ko.applyBindings(self);
    });

    /* event handlers */
    self.registerModal = function() {
        $("#registerModal").modal();
    }

    self.loginModal = function() {
        $("#loginModal").modal();
    }

    self.addVideoModal = function() {
        $("#addVideoModal").modal();
    }

    self.addVideo = function(model, e) {
        if (e.charCode === 13) {
            var youtubeUrl = $("#youtubeUrl").val();

            // http://stackoverflow.com/questions/5830387/how-to-find-all-youtube-video-ids-in-a-string-using-a-regex/5831191#5831191
            var re = /https?:\/\/(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube\.com\S*[^\w\-\s])([\w\-]{11})(?=[^\w\-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/ig;
            var res = re.exec(youtubeUrl);
            if (! res || res.length < 2) return;

            var videoID = res[1];

            var video = new Video(videoID, '', self.player);

            self.videos.unshift(video);
            self.player.loadVideo(video);

            api.addVideo(videoID, function(data) {
                video.title(data.title);
            });

            $.modal.close();

            $("#youtubeUrl").val("");

            return;
        }
        return true;
    }

    self.deleteVideo = function() {
        var i = self.videos.indexOf(self.player.currentVideo());

        api.deleteVideo(self.player.currentVideo().videoID);
        self.videos.remove(self.player.currentVideo());

        if (self.videos().length == 0) {
            self.player.currentVideo(null);
            return;
        } else if (i > 0) {
            i -= 1;
        }
        self.player.loadVideo(self.videos()[i]);
    }
}