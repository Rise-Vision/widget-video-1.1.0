/* global gadgets, _ */

var RiseVision = RiseVision || {};

RiseVision.Video = {};

RiseVision.Video = ( function( window, gadgets ) {
  "use strict";

  var _additionalParams,
    _mode,
    _isLoading = true,
    _configDetails = null,
    _prefs = null,
    _storage = null,
    _nonStorage = null,
    _message = null,
    _player = null,
    _viewerPaused = true,
    _resume = true,
    _currentFiles = [],
    _currentPlaylistIndex = null,
    _errorLog = null,
    _errorTimer = null,
    _errorFlag = false,
    _storageErrorFlag = false,
    _playerErrorFlag = false,
    _unavailableFlag = false;

  /*
   *  Private Methods
   */
  function _done() {
    gadgets.rpc.call( "", "rsevent_done", null, _prefs.getString( "id" ) );

    // Any errors need to be logged before the done event.
    if ( _errorLog !== null ) {
      logEvent( _errorLog, true );
    }

    logEvent( { "event": "done" }, false );
  }

  function _ready() {
    gadgets.rpc.call( "", "rsevent_ready", null, _prefs.getString( "id" ),
      true, true, true, true, true );
  }

  function _clearErrorTimer() {
    clearTimeout( _errorTimer );
    _errorTimer = null;
  }

  function _startErrorTimer() {
    _clearErrorTimer();

    _errorTimer = setTimeout( function() {
      // notify Viewer widget is done
      _done();
    }, 5000 );
  }

  function _getCurrentFile() {
    if ( _currentFiles && _currentFiles.length > 0 ) {
      if ( _mode === "file" ) {
        return _currentFiles[ 0 ];
      } else if ( _mode === "folder" ) {
        if ( _currentPlaylistIndex ) {
          // retrieve the currently played file
          return _currentFiles[ _currentPlaylistIndex ];
        }
      }
    }

    return null;
  }

  /*
   *  Public Methods
   */
  function hasStorageError() {
    return _storageErrorFlag;
  }

  function hasPlayerError() {
    return _playerErrorFlag;
  }

  function showError( message, isStorageError ) {
    _errorFlag = true;
    _storageErrorFlag = typeof isStorageError !== "undefined";

    _message.show( message );

    _currentPlaylistIndex = null;

    // if Widget is playing right now, run the timer
    if ( !_viewerPaused ) {
      _startErrorTimer();
    }

  }

  function logEvent( params, isError ) {
    if ( isError ) {
      _errorLog = params;
    }

    if ( !params.file_url ) {
      params.file_url = _getCurrentFile();
    }

    RiseVision.Common.LoggerUtils.logEvent( getTableName(), params );
  }

  function onFileInit( urls ) {
    if ( _mode === "file" ) {
      // urls value will be a string
      _currentFiles[ 0 ] = urls;
    } else if ( _mode === "folder" ) {
      // urls value will be an array
      _currentFiles = urls;
    }

    _unavailableFlag = false;

    _message.hide();

    if ( !_viewerPaused ) {
      play();
    }
  }

  function onFileRefresh( urls ) {
    if ( _mode === "file" ) {
      // urls value will be a string of one url
      _currentFiles[ 0 ] = urls;
    } else if ( _mode === "folder" ) {
      // urls value will be an array of urls
      _currentFiles = urls;
    }

    if ( _player ) {
      _player.update( _currentFiles );
    }

    // in case refreshed file fixes an error with previous file, ensure flag is removed so playback is attempted again
    _errorFlag = false;
    _playerErrorFlag = false;
    _storageErrorFlag = false;
    _unavailableFlag = false;
    _errorLog = null;
  }

  function onFileUnavailable( message ) {
    _unavailableFlag = true;

    _message.show( message );

    _currentPlaylistIndex = null;

    // if Widget is playing right now, run the timer
    if ( !_viewerPaused ) {
      _startErrorTimer();
    }
  }

  function pause() {

    _viewerPaused = true;

    // in case error timer still running (no conditional check on errorFlag, it may have been reset in onFileRefresh)
    _clearErrorTimer();

    if ( _player ) {
      if ( !_resume ) {
        _currentPlaylistIndex = null;
        _player.reset();
      } else {
        _player.pause();
      }
    }

  }

  function play() {
    if ( _isLoading ) {
      _isLoading = false;

      // Log configuration event.
      logEvent( {
        event: "configuration",
        event_details: _configDetails
      }, false );
    }

    _viewerPaused = false;

    logEvent( { "event": "play" }, false );

    if ( _errorFlag ) {
      _startErrorTimer();
      return;
    }

    if ( _unavailableFlag ) {
      if ( _mode === "file" && _storage ) {
        _storage.retry();
      }

      return;
    }

    if ( _player ) {
      // Ensures possible error messaging gets hidden and video gets shown
      _message.hide();

      _player.play();
    } else {
      if ( _currentFiles && _currentFiles.length > 0 ) {
        _player = new RiseVision.Video.Player( _additionalParams, _mode );
        _player.init( _currentFiles );
      }
    }

  }

  function getTableName() {
    return "video_v2_events";
  }

  function playerEnded() {
    _currentPlaylistIndex = null;

    _done();
  }

  function playerReady() {
    // Ensures loading messaging is hidden and video gets shown
    _message.hide();

    if ( !_viewerPaused && _player ) {
      _player.play();
    }
  }

  function playerItemChange( index ) {
    _currentPlaylistIndex = index;
  }

  function setAdditionalParams( params, mode ) {
    var isStorageFile;

    _additionalParams = _.clone( params );
    _mode = mode;
    _prefs = new gadgets.Prefs();

    document.getElementById( "container" ).style.width = _prefs.getInt( "rsW" ) + "px";
    document.getElementById( "container" ).style.height = _prefs.getInt( "rsH" ) + "px";

    _additionalParams.width = _prefs.getInt( "rsW" );
    _additionalParams.height = _prefs.getInt( "rsH" );

    if ( _additionalParams.video.hasOwnProperty( "resume" ) ) {
      _resume = _additionalParams.video.resume;
    }

    _message = new RiseVision.Common.Message( document.getElementById( "container" ),
      document.getElementById( "messageContainer" ) );

    if ( RiseVision.Common.Utilities.isLegacy() ) {
      showError( "This version of Video Widget is not supported on this version of Rise Player. " +
        "Please use the latest Rise Player version available at https://help.risevision.com/user/create-a-display" );
    } else {
      // show wait message while Storage initializes
      _message.show( "Please wait while your video is downloaded." );

      if ( _mode === "file" ) {
        isStorageFile = ( Object.keys( _additionalParams.storage ).length !== 0 );

        if ( !isStorageFile ) {
          _configDetails = "custom";

          _nonStorage = new RiseVision.Video.NonStorage( _additionalParams );
          _nonStorage.init();
        } else {
          _configDetails = "storage file";

          // create and initialize the Storage file instance
          _storage = new RiseVision.Video.StorageFile( _additionalParams );
          _storage.init();
        }
      } else if ( _mode === "folder" ) {
        _configDetails = "storage folder";

        // create and initialize the Storage folder instance
        _storage = new RiseVision.Video.StorageFolder( _additionalParams );
        _storage.init();
      }
    }

    _ready();
  }

  // An error occurred with JW Player.
  function playerError( error ) {
    var details = null,
      params = {},
      message = "Sorry, there was a problem playing the video.",
      MEDIA_ERROR = "Error loading media: File could not be played",
      YOUTUBE_ERROR = "Error loading YouTube: Video could not be played",
      PLAYER_ERROR = "Error loading player: No media sources found",
      PLAYLIST_ERROR = "Error loading playlist: No playable sources found",
      ENCODING_MESSAGE = "There was a problem playing that video. It could be that we don't " +
        "support that format or it is not encoded correctly.",
      FORMAT_MESSAGE = "The format of that video is not supported";

    if ( error ) {
      if ( error.type && error.message ) {
        details = error.type + " - " + error.message;
      } else if ( error.type ) {
        details = error.type;
      } else if ( error.message ) {
        details = error.message;
      }

      // Display appropriate on-screen error message.
      if ( error.message ) {
        if ( ( error.message === MEDIA_ERROR ) || ( error.message === YOUTUBE_ERROR ) ) {
          message = ENCODING_MESSAGE;
        } else if ( error.message === PLAYER_ERROR || error.message === PLAYLIST_ERROR ) {
          message = FORMAT_MESSAGE;
        }
      }
    }

    params.event = "player error";
    params.event_details = details;
    _playerErrorFlag = true;

    logEvent( params, true );
    showError( message );
  }

  function stop() {
    pause();
  }

  return {
    "getTableName": getTableName,
    "hasPlayerError": hasPlayerError,
    "hasStorageError": hasStorageError,
    "logEvent": logEvent,
    "onFileInit": onFileInit,
    "onFileRefresh": onFileRefresh,
    "onFileUnavailable": onFileUnavailable,
    "pause": pause,
    "play": play,
    "setAdditionalParams": setAdditionalParams,
    "showError": showError,
    "playerEnded": playerEnded,
    "playerReady": playerReady,
    "playerError": playerError,
    "playerItemChange": playerItemChange,
    "stop": stop
  };

} )( window, gadgets );
