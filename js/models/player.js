function Player() {
    var self = this;

    var p;

    self.currentVideo = ko.observable();
    self.isPlayerReady = ko.observable(false);

    // <editor-fold desc="looping functionality">
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

    //<editor-fold desc="transport">

    self.helpText = ko.observable("");

    // enable key bindings
    $(document).keydown(function (e) {
        // check to see if modal open
        if ($(".modal.current").length != 0) {
            return true;
        }

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
        }
        return true;
    });

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

    // <editor-fold desc="timestamp management">
    self.currentTime = ko.observable();
    self.currentTimeDisplay = ko.computed(function() {
        return new Timestamp().getDisplay(self.currentTime());
    });
    self.newTimestampName = ko.observable();

    self.addTimestampModal = function() {
        self.newTimestampName("");
        self.currentTime(self.getTime());
        $("#addTimestampModal").modal();
    }

    self.addTimestamp = function() {
        $.modal.close();
        if (!self.newTimestampName()) {
            self.newTimestampName("&nbsp;")
        }
        self.currentVideo().addTimestamp(self.getTime(), self.newTimestampName());
    }

    self.deleteTimestamp = function(timestamp) {
        if (self.startPoint() == timestamp) self.startPoint(null);
        if (self.endPoint() == timestamp) self.endPoint(null);
        self.currentVideo().deleteTimestamp(timestamp);
    }
    // </editor-fold>

}
