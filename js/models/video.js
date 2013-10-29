function Video(videoID, title, star, player, ts) {
    var self = this;

    self.videoID = videoID;
    self.title = ko.observable(title);
    self.star = ko.observable(star);
    self.timestamps = ko.observableArray();
    self.player = ko.observable(player);

    if (ts) {
        self.timestamps(ts);
    }

    // for exporting to the api
    self.timestampObjs = ko.computed(function() {
        return $.map(self.timestamps(), function(t) {
            return {name: t.name, time: t.time};
        });
    });

    // add a start and finish timestamp
    var beginning = new Timestamp(0, "BEGINNING", false);
    var end = ko.observable(new Timestamp(60, "END", false));
    self.setEndLength = function (time) {
        end(new Timestamp(time, "END", false));
    }

    self.timestampsDisplay = ko.computed(function() {
        var b = [].concat.apply(
            [beginning],
            [
                self.timestamps(),
                [end()]
            ]
        );

        return b;
    })

    self.getThumbnailUrl = function() {
        return "http://img.youtube.com/vi/" + videoID + "/default.jpg";
    }

    self.toggleStar = function() {
        self.star(!self.star());
        api.starVideo(videoID, self.star());
    }

    self.getTimestamps = function() {
        api.getTimestamps(videoID, function(timestamps) {
            self.timestamps(timestamps);
        });
    }

    self.setTimestamps = function() {
        api.setTimestamps(videoID, self.timestampObjs());
    }

    self.addTimestamp = function(time, name) {
        var timestamp = new Timestamp(time, name);

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
