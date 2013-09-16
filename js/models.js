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
}

function Player() {
    var self = this;

    var p;

    self.currentVideo = ko.observable();
    self.isPlayerReady = ko.observable(false);

    self.startPoint = ko.observable(null);
    self.endPoint = ko.observable(null);

    self.playbackRates = ko.computed(function() {
        // update every time a video is loaded
        // TODO - figure out why getAvailable doesn't return rates even when it's ready
        var rates = p ? p.getAvailablePlaybackRates() : null;
        if (self.isPlayerReady() && self.currentVideo() && rates) {
            return rates;
        }
        return [1.0];
    });

    self.init = function(video) {
        var videoID = video ? video.videoID: 'FGVGFfj7POA';

        // TODO add dynamic youtube script tag loader
        window.onYouTubePlayerAPIReady = function () {
            p = new YT.Player('player', {
                width: 600,
                height: 450,
                videoId: videoID,
                playerVars: {
                    html5: 1,
                    controls: 1,
                    modestbranding: 1,
                    showinfo: 0,
                    rel: 0
                },
                events: {
                    'onReady': function() {
                        // if we've not loaded a video, and were passed on in our constructor, load one up
                        if (!self.currentVideo() && video) {
                            self.loadVideo(video);
                        }

                        // update our observable
                        self.isPlayerReady(true);
                    }
                }
            });
        };
    }

    self.loadVideo = function(video) {
        self.currentVideo(video);
        p.cueVideoById(video.videoID);
        video.getTimestamps();
    }

    self.playPause = function() {
        // https://developers.google.com/youtube/js_api_reference#Playback_status
        var state = p.getPlayerState();

        if (state == 1 || state == 3) p.pauseVideo();
        if (state == -1 || state == 2 || state == 5) p.playVideo();
        if (state == 0) {
            p.seekTo(0);
            p.playVideo();
        }
    }

    self.getTime = function() {
        return p.getCurrentTime();
    }

    self.getMaxTime = function() {
        return p.getDuration();
    }

    self.seek = function(timestamp) {
        p.seekTo(timestamp.time);
    }

    self.seekDiff = function(model, e) {
        var time = parseInt(e.target.value);
        var newTime = self.getTime() + time;
        if (newTime < 0) newTime = 0;

        var maxTime = self.getMaxTime();
        if (newTime > maxTime) newTime = maxTime;
        p.seekTo(newTime);
    }

    self.addTimestamp = function() {
        self.currentVideo().addTimestamp(self.getTime());
    }

    self.deleteTimestamp = function(timestamp) {
        if (self.startPoint() == timestamp) self.startPoint(null);
        if (self.endPoint() == timestamp) self.endPoint(null);
        self.currentVideo().deleteTimestamp(timestamp);
    }

    self.setPlaybackRate = function(model, e) {
        p.setPlaybackRate(e.target.value);
    }

    self.setStartPoint = function(timestamp) {
        if (! self.startPoint()) {
            self.startPoint(timestamp);
        } else {
            self.startPoint(null);
        }
    }

    self.setEndPoint = function(timestamp) {
        if (! self.endPoint()) {
            self.endPoint(timestamp);
        } else {
            self.endPoint(null);
        }
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
            var youtubeUrl = $("#youtubeUrl").val();

            // http://stackoverflow.com/questions/5830387/how-to-find-all-youtube-video-ids-in-a-string-using-a-regex/5831191#5831191
            var re = /https?:\/\/(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube\.com\S*[^\w\-\s])([\w\-]{11})(?=[^\w\-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/ig;
            var res = re.exec(youtubeUrl);
            if (! res || res.length < 2) return;

            var videoID = res[1];

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