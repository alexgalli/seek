function Video(videoID, title, player) {
    var self = this;

    self.videoID = videoID;
    self.title = ko.observable(title);
    self.timestamps = ko.observableArray();
    self.player = ko.observable(player);

    // for exporting to the api
    self.timestampObjs = ko.computed(function() {
        return $.map(self.timestamps(), function(t) {
            return {name: t.name, time: t.time};
        });
    });

    // add a start and finish timestamp
    var beginning = new Timestamp(0, "BEGINNING");
    var end = ko.observable(new Timestamp(60, "END"));
    self.setEndLength = function (time) {
        end(new Timestamp(time, "END"));
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
