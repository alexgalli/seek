function Player(model) {
    var self = this;

    var p;

    self.videos = ko.observableArray();
    self.currentVideo = ko.observable();
    self.isPlayerReady = ko.observable(false);
    self.helpText = ko.observable("");

    // load our videos, and when complete load our player
    api.getVideos(self, function(videos) {
        if (videos.length != 0) {
            self.videos(videos);
            self.init(videos[0]);
        } else {
            self.init();
        }

        ko.applyBindings(model);
    });

    // <editor-fold desc="looping functionality">
    self.startPoint = ko.observable(null);
    self.endPoint = ko.observable(null);

    self.loopConnector = ko.computed(function() {
        if (self.startPoint() && self.endPoint()) {
            var length = $(".loop-end.active").offset().top - $(".loop-start.active").offset().top;
            return length + "px";
        }
        return "500px";
    });

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
        }
    }

    // </editor-fold>

    //<editor-fold desc="playback rates">
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
    self.setPlaybackRate = function(model, e) {
        p.setPlaybackRate(e.target.value);
    }
     */
    //</editor-fold>

    //<editor-fold desc="youtube player management">
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
                    },
                    'onStateChange': function(e) {
                        // if we've loaded a new video, update our end timestamp
                        if (e.data == YT.PlayerState.CUED) {
                            self.loadEndTimestamp();
                        }
                        // if we're looping and have reached the end, go back to start point
                        if (e.data == YT.PlayerState.ENDED && self.startPoint()) {
                            p.seekTo(self.startPoint().time);
                            p.playVideo();
                        }
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
        // hack - in order to detect cue, need to make sure it's in a non-queued-state first
        self.playPause();

        self.currentVideo(video);
        self.clearLooping();
        p.cueVideoById(video.videoID);

        /* we pass back timestamps with the video
        if (user) {
            video.getTimestamps();
        }
        */
    }

    self.loadEndTimestamp = function() {
        // before we can get get the time, video must be started
        p.mute();
        p.playVideo();
        function pauseWhenQueued() {
            var t = self.getMaxTime();
            if (t > 0) {
                p.pauseVideo();
                p.unMute();
                self.currentVideo().setEndLength(t);
            }
            else {
                setTimeout(pauseWhenQueued, 10);
            }
        }
        pauseWhenQueued();
    }
    //</editor-fold>

    //<editor-fold desc="key bindings">

    // enable key bindings - TODO refactor this into keys.js and constants
    $(document).keydown(function (e) {
        if ($(".modal.current").length != 0) {
            if (e.charCode == 13) {
                return false;
            }
        } else {
            switch (e.keyCode) {
                case 32:
                    self.playPause();
                    return false;
                case 37:
                    if (e.shiftKey === true) {
                        self.seekDiff(-30);
                    } else {
                        self.seekDiff(-5);
                    }
                    return false;
                case 39:
                    if (e.shiftKey === true) {
                        self.seekDiff(30);
                    } else {
                        self.seekDiff(5);
                    }
                    return false;
                case 65:
                    self.addTimestampModal();
                    return false;
                case 107:
                case 187:
                    self.addVideoModal();
                    return false;
            }
        }
        return true;
    });

    //</editor-fold>

    //<editor-fold desc="transport">
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

    self.seekDiffEvent = function(model, e) {
        self.seekDiff(parseInt(e.target.value));
    }

    self.seekDiff = function(diff) {
        var newTime = self.getTime() + diff;
        if (newTime < 0) newTime = 0;

        var maxTime = self.getMaxTime();
        if (newTime > maxTime) newTime = maxTime;
        p.seekTo(newTime);
    }
    //</editor-fold>

    //<editor-fold desc="video management">
    self.addVideoModal = function() {
        $("#addVideoModal").clearForm();
        $("#addVideoModal").find(".warning").text("");
        $("#addVideoModal").modal();
    }

    self.addVideo = function() {
        var youtubeUrl = $("#id_youtubeUrl").val();

        // http://stackoverflow.com/questions/5830387/how-to-find-all-youtube-video-ids-in-a-string-using-a-regex/5831191#5831191
        var re = /https?:\/\/(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube\.com\S*[^\w\-\s])([\w\-]{11})(?=[^\w\-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/ig;
        var res = re.exec(youtubeUrl);
        if (! res || res.length < 2) return;

        var videoID = res[1];

        var video = new Video(videoID, '', false, self, []);

        self.videos.unshift(video);
        self.loadVideo(video);

        api.addVideo(videoID, function(data) {
            video.title(data.title);
        });

        $.modal.close();
    }

    self.deleteVideo = function(video) {
        var i = self.videos.indexOf(video);

        api.deleteVideo(video.videoID);
        self.videos.remove(video);

        if (self.videos().length == 0) {
            self.currentVideo(null);
            return;
        } else if (i > 0) {
            i -= 1;
        }
        self.loadVideo(self.videos()[i]);
    }
    //</editor-fold>

    // <editor-fold desc="timestamp management">
    self.currentTime = ko.observable()

    self.currentTimeDisplay = ko.computed(function() {
        return new Timestamp().getDisplay(self.currentTime());
    });

    self.addTimestampModal = function() {
        self.currentTime(self.getTime());
        $("#addTimestampModal").clearForm();
        $("#addTimestampModal").modal();
    }

    self.addTimestamp = function() {
        var timestampName = $("#id_timestampName").val();
        if (!timestampName) {
            timestampName = "&nbsp;";
        }
        self.currentVideo().addTimestamp(self.currentTime(), timestampName);

        $.modal.close();
    }

    self.deleteTimestamp = function(timestamp) {
        if (self.startPoint() == timestamp) self.startPoint(null);
        if (self.endPoint() == timestamp) self.endPoint(null);
        self.currentVideo().deleteTimestamp(timestamp);
    }
    // </editor-fold>

}
