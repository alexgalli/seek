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
    },

    getTimestamps: function(videoID, callback) {
        $.ajax(
            "/api/get_timestamps",
            {
                method: "post",
                data: { "videoID": videoID },
                success: function(data) {
                    var newTimestamps = $.map(data, function(i) {
                        return new Timestamp(i.time, i.name);
                    });

                    if (callback) callback(newTimestamps);
                }
            }
        );
    },

    setTimestamps: function(videoID, timestamps) {
        $.ajax(
            "/api/set_timestamps",
            {
                method: "post",
                data: {
                    "videoID": videoID,
                    "timestamps": JSON.stringify(timestamps)
                }
            }
        );
    }
}