function SeekViewModel() {
    var self = this;

    self.saveWarning = false;

    self.player = new Player(self);

    // configure modals

    self.helpModal = function() {
        $("#helpModal").modal();
    }

    self.registerModal = function() {
        $("#registerModal").clearForm();
        $("#registerModal").modal();
    }

    self.loginModal = function() {
        $("#loginModal").clearForm();
        $("#loginModal").modal();
    }

    $("#accountModal").ajaxForm({
        type: "POST",
        error: function(r) {
            $("#accountModal").find(".warning").text(r.responseText);
        },
        success: function() {
            $("#accountModal").find(".warning").text("Password changed successfully");
        }
    });

    self.accountModal = function() {
        $("#accountModal").clearForm();
        $("#accountModal").modal();
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