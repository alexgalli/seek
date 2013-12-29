function SeekViewModel() {
    var self = this;


    self.player = new Player(self);

    /* event handlers */
    self.registerModal = function() {
        $("#registerModal").modal();
    }

    self.loginModal = function() {
        $("#loginModal").modal();
    }

}