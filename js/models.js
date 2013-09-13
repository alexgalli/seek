/* knockout models */

function Video(videoID) {
    var self = this;

    self.videoID = videoID;
    self.timestamps = ko.observableArray();

    self.getThumbnailUrl = function() {
        return "http://img.youtube.com/vi/" + videoID + "/default.jpg";
    }

    self.getTimestamps = function() {
        api.getTimestamps(videoID, function(timestamps) {
            self.timestamps(timestamps);
        });
    }

    self.setTimestamps = function() {
        var ts = $.map(self.timestamps(), function(t) {
            return {
                name: t.name,
                time: t.time
            };
        });

        api.setTimestamps(videoID, ts);
    }

    self.addTimestamp = function(time) {
        var timestamp = new Timestamp(time, "");
        timestamp.name = prompt("(" + timestamp.getDisplay() + ") Name");

        // insert the new timestamp
        self.timestamps.push(timestamp);
        self.timestamps.sort(function (a, b) {
            return a.time === b.time ? 0 :
                a.time < b.time ? -1 : 1;
        });

        // save to API
        self.setTimestamps();
    }

    self.deleteTimestamp = function(ts) {
        self.timestamps.remove(ts);
        self.setTimestamps();
    }
}

function Timestamp(time, name) {
    var self = this;
    self.time = time;
    self.name = name;

    self.getDisplay = function() {
        // pad a zero if necessary
        var seconds = ("0" + Math.floor(self.time % 60));
        seconds = seconds.substr(seconds.length - 2);
        return Math.floor(self.time / 60) + ":" + seconds;
    }

    self.seekTimestamp = function(a, b) {
        $("#player").tubeplayer("seek", self.time);
    }
}

function Player() {
    var self = this;

    self.currentVideo = ko.observable();

    var p = $("#player");

    self.init = function(videoID) {
        if (!videoID) {
            videoID = 'FGVGFfj7POA';
        }

        p.tubeplayer({
            width: 600,
            height: 450,
            allowFullScreen: "true",
            initialVideo: videoID
        });
    }

    self.loadVideo = function(video) {
        self.currentVideo(video);
        $("#player").tubeplayer("cue", video.videoID);
        video.getTimestamps();
    }

    self.playPause = function() {
        p.tubeplayer("play");
    }

    self.getTime = function() {
        return p.tubeplayer("data").currentTime;
    }

    self.jumpTime = function(time) {
        p.tubeplayer("seek", self.getTime() + time);
    }

    self.addTimestamp = function() {
        self.currentVideo().addTimestamp(self.getTime());
    }
}

function SeekViewModel() {
    var self = this;

    self.videos = ko.observableArray();

    self.player = new Player();

    /* event handlers */
    self.register = function() {
        $("#registerModal").modal();
    }

    self.login = function() {
        $("#loginModal").modal();
    }

    self.openVideoModal = function() {
        $("#addVideoModal").modal();
    }

    self.addVideo = function(model, e) {
        if (e.charCode === 13) {
            var videoID = $("#videoID").val();
            var video = new Video(videoID);

            self.videos.unshift(video);
            self.player.loadVideo(video);

            api.addVideo(videoID);

            $.modal.close();

            $("#videoID").val("");

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