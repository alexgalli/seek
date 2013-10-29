function Timestamp(time, name, showDelete) {
    var self = this;
    self.time = time;
    self.name = name;
    self.showDelete = ko.observable(true);

    if (showDelete === false) {
        self.showDelete(false);
    }

    // toggle potential start/end point
    self.loopStart = ko.observable(true);
    self.loopEnd = ko.computed(function() {
        return !self.loopStart();
    })

    // toggle loop markers
    self.loopActive = ko.observable(false);

    // toggle button activity
    self.buttonInactive = ko.observable(false);

    self.getDisplay = function(t) {
        if (arguments.length == 0) {
            t = self.time;
        }

        // pad a zero if necessary
        var seconds = ("0" + Math.floor(t % 60));
        seconds = seconds.substr(seconds.length - 2);
        return Math.floor(t / 60) + ":" + seconds;
    }
}
