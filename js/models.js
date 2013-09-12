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

    self.addTimestamp = function() {
        var playerData = $("#player").tubeplayer("data");
        var timestamp = new Timestamp(playerData.currentTime, "");
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

    self.deleteTimestamp = function() {
        model.currentVideo().timestamps.remove(self);
    }

    self.seekTimestamp = function(a, b) {
        $("#player").tubeplayer("seek", self.time);
    }
}

function SeekViewModel() {
    var self = this;

    self.videos = ko.observableArray();

    self.currentVideo = ko.observable();

    /* event handlers */
    self.onRegisterClick = function() {
        $("#registerModal").modal();
    }

    self.onLoginClick = function() {
        $("#loginModal").modal();
    }

    self.onAddVideoClick = function() {
        $("#addVideoModal").modal();
    }

    self.onAddVideoSubmit = function(model, e) {
        if (e.charCode === 13) {
            var videoID = $("#videoID").val();
            var video = new Video(videoID);

            self.videos.unshift(video);
            video.loadVideo();

            api.addVideo(videoID);

            $.modal.close();

            $("#videoID").val("");

            return;
        }
        return true;
    }

    self.onDeleteVideoClick = function() {
        var i = self.videos.indexOf(self.currentVideo());

        api.deleteVideo(self.currentVideo().videoID);
        self.videos.remove(self.currentVideo());

        if (self.videos().length == 0) {
            self.currentVideo(null);
            return;
        } else if (i > 0) {
            i -= 1;
        }
        self.videos()[i].loadVideo();
    }

    self.loadVideo = function(video) {
        self.currentVideo(video);
        $("#player").tubeplayer("cue", video.videoID);
        video.getTimestamps();
    }

}