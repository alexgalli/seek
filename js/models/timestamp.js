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
