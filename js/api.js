var api = {
    getVideos: function(callback) {
        $.ajax(
            "/api/get_videos",
            {
                method: "post",
                dataType: "json",
                success: function(data) {
                    var newVideos = $.map(data, function(i) {
                        return new Video(i);
                    });

                    if (callback) callback(newVideos);
                }
            });
    },

    addVideo: function(videoID) {
        $.ajax(
            "/api/add_video",
            {
                method: "post",
                data: { "videoID": videoID }
            }
        );
    },

    deleteVideo: function(videoID) {
        $.ajax(
            "/api/del_video",
            {
                method: "post",
                data: { "videoID": videoID }
            }
        );
    }
}