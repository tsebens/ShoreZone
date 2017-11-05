/**
 * YouTube utilities
 */


var youtube_player = false;
var youtube_timer = false;
var youtube_id = false;
var youtube_player_ready = false;
var youtube_progress_memory = false;
var youtube_playback_memory = 2;

function youtube_ready() {
  return youtube_id && youtube_player_ready;
}

function onPlayerReady(event) {
  //debug("Youtube Player ready");
  youtube_player_ready = true;
  youtube_player.mute();
  if (youtube_progress_memory) {
    //debug("youtube_progress_memory: " + youtube_progress_memory);
    youtube_player.seekTo(youtube_progress_memory, true);
    youtube_player.playVideo();
  }
}

function onPlayerStateChange(event) {

  //debug("onPlayerStateChange: " + youtube_player.getPlayerState());


  var state = youtube_player.getPlayerState();

  if (state == 1 && !youtube_timer) {

    if (youtube_progress_memory) {
      szVideoWidget.setPlaybackOn(false);
      szVideoWidget.setVideoPosition(youtube_progress_memory);
      youtube_progress_memory = false;
    }

    if (youtube_playback_memory != 1) {
      szVideoWidget.setPlaybackOn(false);
    }

    youtube_timer = setInterval(CheckVideoProgress, 500/szVideoWidget.playbackRate);

  } else if (state == 0) {      // YT.PlayerState.ENDED

  } else if (state == 2) {      // YT.PlayerState.PAUSED

  } else if (state == 3) {      // YT.PlayerState.BUFFERING
  }

  if (state != 1 && youtube_timer) {
    window.clearInterval(youtube_timer);
    youtube_timer = false;
  }
}

function CheckVideoProgress() {
  var duration = youtube_player.getDuration();
  szVideoWidget.update_track(szVideoWidget.getVideoPosition(), duration);
}

function changePlaybackSpeed(dir) {
  if (!youtube_player)
    return;
  var availRates = youtube_player.getAvailablePlaybackRates();
  var currRate = youtube_player.getPlaybackRate();
  var i = availRates.indexOf(currRate);
  var j = i + dir;
  if (j>=0 && j<availRates.length) {
    szVideoWidget.setPlaybackRate(availRates[j], j==0, j==(availRates.length-1))
  }
}

function onYouTubeIframeAPIReady() {
  // YouTube API calls this function when download of the API is complete
   youtube_player = new YT.Player("video_youtube", {
   height: "390",
   width: "640",
   videoId: youtube_id,
   playerVars: {"autoplay": 0, "controls": 0, "rel": 0},
   events: {
     "onReady": onPlayerReady,
     "onStateChange": onPlayerStateChange
     }
   });
   //debug("YouTube API set up");
}

