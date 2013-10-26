/* knockout models */

function Video(videoID, title, player) {
    var self = this;

    self.videoID = videoID;
    self.title = ko.observable(title);
    self.timestamps = ko.observableArray();
    self.player = ko.observable(player);

    // for exported to the api
    self.timestampObjs = ko.computed(function() {
        return $.map(self.timestamps(), function(t) {
            return {name: t.name, time: t.time};
        });
    });
    // add a start and finish timestamp
    var beginning = new Timestamp(0, "BEGINNING");
    var end = new Timestamp(60, "END")
    self.timestampsDisplay = ko.computed(function() {
        var b = [].concat.apply(
            [beginning],
            [
                self.timestamps(),
                [end]
            ]
        );

        return b;
    })

    self.getThumbnailUrl = function() {
        return "http://img.youtube.com/vi/" + videoID + "/default.jpg";
    }

    self.getTimestamps = function() {
        api.getTimestamps(videoID, function(timestamps) {
            self.timestamps(timestamps);
        });
    }

    self.setTimestamps = function() {
        api.setTimestamps(videoID, self.timestampObjs());
    }

    self.addTimestamp = function(time) {
        var timestamp = new Timestamp(time, "");
        timestamp.name = prompt("(" + timestamp.getDisplay() + ") Name");

        self.timestamps.push(timestamp);
        self.timestamps.sort(function (a, b) {
            return a.time === b.time ? 0 : a.time < b.time ? -1 : 1;
        });

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

    // toggle potential start/end point
    self.loopStart = ko.observable(true);
    self.loopEnd = ko.computed(function() {
        return !self.loopStart();
    })

    // toggle loop markers
    self.loopActive = ko.observable(false);

    // toggle button activity
    self.buttonInactive = ko.observable(false);

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

    self.startPointIndex = ko.computed(function() {
        if (self.currentVideo()) {
            return self.currentVideo().timestampsDisplay().indexOf(self.startPoint());
        } else {
            return -1;
        }
    })

    self.endPointIndex = ko.computed(function() {
        if (self.currentVideo()) {
            return self.currentVideo().timestampsDisplay().indexOf(self.endPoint());
        } else {
            return -1;
        }
    })

    self.testTimeInLoop = ko.computed(function() {
        return function() {
            if (!self.startPoint()) return true;
            var time = self.getTime();
            var endTime = self.endPoint() ? self.endPoint().time : self.getMaxTime();
            return time >= self.startPoint().time && time <= endTime;
        }
    });

    /*
    self.playbackRates = ko.computed(function() {
        // update every time a video is loaded
        // TODO - figure out why getAvailable doesn't return rates even when it's ready
        var rates = p ? p.getAvailablePlaybackRates() : null;
        if (self.isPlayerReady() && self.currentVideo() && rates) {
            return rates;
        }
        return [1.0];
    });
    */

    self.init = function(video) {
        var videoID = video ? video.videoID : 'FGVGFfj7POA';

        window.onYouTubePlayerAPIReady = function () {
            p = new YT.Player('player', {
                width: 700,
                height: 485,
                videoId: videoID,
                playerVars: {
                    html5: 1,
                    //origin: 'http://127.0.0.1:8000',
                    controls: 1,
                    modestbranding: 1,
                    showinfo: 0,
                    rel: 0
                },
                events: {
                    'onReady': function() {
                        // if we've not loaded a video, and were passed one in our constructor, load it up
                        if (!self.currentVideo() && video) {
                            self.loadVideo(video);
                        }

                        // update our observable
                        self.isPlayerReady(true);

                        // start checking for loop
                        window.setInterval(function() {
                            var state = p.getPlayerState();
                            if (state == 1) {
                                if (!self.testTimeInLoop()()) {
                                    self.seek(self.startPoint());
                                }
                            }
                        }, 100);
                    }
                }
            });
        };

        // Load the IFrame Player API code asynchronously.
        var tag = document.createElement('script');
        tag.src = "https://www.youtube.com/player_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    self.loadVideo = function(video) {
        self.currentVideo(video);
        self.startPoint(null);
        self.endPoint(null);
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

    self.seek = function(timestamp, index) {
        // clear looping if we're out of the loop bounds
        if (self.startPoint() && index < self.startPointIndex()
            || self.endPoint() && index > self.endPointIndex()) {
            self.clearLooping();
        }

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

    /* TIMESTAMP LOOP BUTTON */

    self.clearLooping = function() {
        // zero out classes
        $(self.currentVideo().timestampsDisplay()).each(function(i, ts) {
            ts.loopStart(true);
            ts.loopActive(false);
            ts.buttonInactive(false);
        })

        // zero endpoints
        self.startPoint(null);
        self.endPoint(null);
    }

    self.loop = function(timestamp, index) {
        var timestamps = self.currentVideo().timestampsDisplay();

        // set startpoint if loop unset or if it's before our current startpoint
        if (!self.startPoint() || index < self.startPointIndex()) {
            // deactivate old start point
            if (self.startPoint()) {
                self.startPoint().loopActive(false);
            }

            $(timestamps).each(
                function(i, ts) {
                    // deactive all previous timestamps
                    if (i < index) {
                        ts.loopStart(false);
                        ts.loopActive(false);
                        ts.buttonInactive(true);
                    }

                    // for all following timestamp
                    if (i > index) {
                        ts.loopStart(false);

                        // deactivate buttons past end point
                        if (self.endPoint() && i > self.endPointIndex()) {
                            ts.buttonInactive(true);
                        }
                    }
                });

            // set clicked timestamp to .loopstart.active
            timestamp.loopStart(true);
            timestamp.loopActive(true);
            timestamp.buttonInactive(false);

            self.startPoint(timestamp);
        }
        // clear looping
        else if (self.startPointIndex() == index) {
            self.clearLooping();
        }
        // clear endpoint
        else if (self.endPointIndex() == index) {
            // restore loop
            $(timestamps).each(function(i, ts) {
                if (i > index) {
                    ts.loopStart(false);
                }
                if (i > self.startPointIndex()) {
                    ts.buttonInactive(false);
                }
            });

            // remove active
            timestamp.loopActive(false);

            // zero endpoint
            self.endPoint(null);
        }
        // set endpoint
        else if (self.startPointIndex() < index) {
            // remove active from current endpoint if it exists
            if (self.endPoint()) {
                self.endPoint().loopActive(false);
            }

            // set new endpoint
            timestamp.loopActive(true);
            self.endPoint(timestamp);

            $(timestamps).each(function (i, ts) {
                // set buttons in bound active, other inactive
                ts.buttonInactive(
                    i < self.startPointIndex() || i > self.endPointIndex()
                );
            })


            // TODO - add function to set button activity between start and endpoint
        }
    }
}

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