/* global jwplayer */

var RiseVision = RiseVision || {};

RiseVision.Video = RiseVision.Video || {};

RiseVision.Video.Player = function( params ) {
  "use strict";

  var _autoPlay,
    _stretching,
    _pauseDuration,
    _playerInstance = null,
    _utils = RiseVision.Video.PlayerUtils,
    _viewerPaused = false,
    _pauseTimer = null,
    _files = null,
    _updateWaiting = false;

  /*
   *  Private Methods
   */
  function _onComplete() {
    RiseVision.Video.playerEnded();
  }

  function _onPause() {
    if ( !_viewerPaused ) {
      // user has paused, set a timer to play again
      clearTimeout( _pauseTimer );

      _pauseTimer = setTimeout( function() {
        if ( _playerInstance.getState().toUpperCase() !== "PLAYING" ) {
          // continue playing the current video
          _playerInstance.play();
        }
      }, _pauseDuration * 1000 );
    }
  }

  function _onPlaylistItem( index ) {
    RiseVision.Video.playerItemChange( index );
  }

  function _onPlayerError( error ) {
    if ( error ) {
      RiseVision.Video.playerError( {
        type: "video",
        message: error.message
      } );
    }
  }

  function _onSetupError( error ) {
    if ( error ) {
      RiseVision.Video.playerError( {
        type: "setup",
        message: error.message
      } );
    }
  }

  function _configureHandlers() {
    //var playFn = play;

    // handle a JWPlayer setup error
    _playerInstance.on( "setupError", function( error ) {
      _onSetupError( error );
    } );

    // handle when JWPlayer is ready
    _playerInstance.on( "ready", function() {

      _playerInstance.on( "playlistComplete", function() {
        _onComplete();
      } );

      _playerInstance.on( "playlistItem", function( data ) {
        _onPlaylistItem( data.index );
      } );

      _playerInstance.on( "error", function( error ) {
        _onPlayerError( error );
      } );

      _playerInstance.setVolume( params.video.volume );

      if ( params.video.controls && _pauseDuration > 1 ) {
        _playerInstance.on( "pause", function() {
          _onPause();
        } );
      }

      // player is ready
      RiseVision.Video.playerReady();

    } );
  }

  function _getSetupData( files ) {
    return {
      controls: params.video.controls,
      height: params.height,
      playlist: _utils.getPlaylist( files ),
      skin: { name: "rise" },
      stretching: _stretching,
      width: params.width
    };
  }

  /*
   *  Public Methods
   */
  function init( files ) {
    _playerInstance = jwplayer( "player" );

    _files = files;

    _stretching = ( params.video.scaleToFit ) ? "uniform" : "none";

    // ensure autoPlay is true if controls value is false, otherwise use params value
    _autoPlay = ( !params.video.controls ) ? true : params.video.autoplay;

    // check if this setting exists due to merge of file and folder
    if ( params.video.pause ) {
      // convert pause value to number if type is "string"
      params.video.pause = ( typeof params.video.pause === "string" ) ? parseInt( params.video.pause, 10 ) : params.video.pause;

      // if not of type "number", set its value to 0 so a pause does not get applied
      _pauseDuration = ( isNaN( params.video.pause ) ) ? 0 : params.video.pause;
    } else {
      // ensure no pause duration occurs
      _pauseDuration = 0;
    }

    // setup JWPlayer
    _playerInstance.setup( _getSetupData( files ) );
    _configureHandlers();

  }

  function play() {
    _viewerPaused = false;

    if ( _updateWaiting ) {
      _updateWaiting = false;
      // load a new playlist
      _playerInstance.load( _utils.getPlaylist( _files ) );
    }

    if ( _autoPlay ) {
      _playerInstance.play();
    }

  }

  function pause() {
    _viewerPaused = true;
    clearTimeout( _pauseTimer );

    if ( _playerInstance.getState().toUpperCase() === "PLAYING" ) {
      _playerInstance.pause();
    }
  }

  function reset() {

    pause();

    function onPlay() {
      // remove handling the play event
      _playerInstance.off( "play", onPlay );

      // pause the video at the start
      _playerInstance.pause();
    }

    function onSeeked() {
      // remove handling the seeked event
      _playerInstance.off( "seeked", onSeeked );

      // pause the video at the start
      _playerInstance.pause();
    }

    // if status is COMPLETE, a future play call will start playlist over from beginning automatically
    if ( _playerInstance.getState().toUpperCase() !== "COMPLETE" ) {

      // avoid jwplayer promise error in console with setTimeout - http://goo.gl/L4gkTm
      setTimeout( function() {
        if ( _playerInstance.getPlaylistIndex() !== 0 ) {
          _playerInstance.on( "play", onPlay );

          // change to first video in list
          _playerInstance.playlistItem( 0 );
        } else {
          // handle when video continues playing after seeking to position
          _playerInstance.on( "seeked", onSeeked );

          // move position back to start of video
          _playerInstance.seek( 0 );
        }
      }, 100 );

    }

  }

  function update( files ) {
    _files = files;
    _updateWaiting = true;
  }

  return {
    "init": init,
    "pause": pause,
    "play": play,
    "reset": reset,
    "update": update
  };
};
