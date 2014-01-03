function SeekViewModel() {
    var self = this;

    self.saveWarning = false;

    self.player = new Player(self);

    // configure modals

    self.helpModal = function() {
        $("#helpModal").modal();
    }

    $("#registerModal").ajaxForm({
        type: "POST",
        error: function(r) {
            $("#registerModal").find(".warning").text(r.responseText);
        },
        success: function() {
            location.reload(true);
        }
    })

    self.registerModal = function() {
        $("#registerModal").clearForm();
        $("#registerModal").find(".warning").text("");
        $("#registerModal").modal();
    }

    $("#loginModal").ajaxForm({
        type: "POST",
        error: function(r) {
            $("#loginModal").find(".warning").text(r.responseText);
        },
        success: function() {
            location.reload(true);
        }
    })

    self.loginModal = function() {
        $("#loginModal").clearForm();
        $("#loginModal").find(".warning").text("");
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
        $("#accountModal").find(".warning").text("");
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