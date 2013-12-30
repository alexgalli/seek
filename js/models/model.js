function SeekViewModel() {
    var self = this;

    self.saveWarning = false;

    self.player = new Player(self);

    self.helpModal = function() {
        $("#helpModal").modal();
    }

    self.registerModal = function() {
        $("#registerModal").modal();
    }

    self.loginModal = function() {
        $("#loginModal").modal();
    }

    self.saveWarn = function() {
        if (self.saveWarning == true) {
            self.saveWarning = false;
            self.helpModal();
            return false;
        }
        return true;
    }
}