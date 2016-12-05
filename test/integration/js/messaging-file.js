/* global requests, suiteSetup, suite, test, assert, RiseVision, sinon */

var ready = false,
  isV2Running = false,
  storage,
  check = function( done ) {
    if ( ready ) {
      done();
    } else {
      setTimeout( function() {
        check( done )
      }, 1000 );
    }
  };

suiteSetup( function( done ) {
  if ( isV2Running ) {
    requests[ 0 ].respond( 404 );
    requests[ 1 ].respond( 200 );
  }

  check( done );
} );

suite( "waiting", function() {
  test( "should show waiting message", function() {
    assert.equal( document.querySelector( ".message" ).innerHTML, "Please wait while your video is downloaded.", "message is correct" );
  } );
} );

suite( "no video", function() {
  suiteSetup( function() {
    storage.dispatchEvent( new CustomEvent( "rise-storage-no-file", {
      "detail": null,
      "bubbles": true
    } ) );
  } );

  test( "should show the no video message", function() {
    assert.equal( document.querySelector( ".message" ).innerHTML, "The selected video does not exist or has been moved to Trash.", "message is correct" );
  } );
} );

suite( "video file throttled", function() {
  suiteSetup( function() {
    storage.dispatchEvent( new CustomEvent( "rise-storage-file-throttled", {
      "detail": null,
      "bubbles": true
    } ) );
  } );

  test( "should show the file unavailable message", function() {
    assert.equal( document.querySelector( ".message" ).innerHTML, "The selected video is temporarily unavailable.", "message is correct" );
  } );
} );

suite( "no storage subscription", function() {
  suiteSetup( function() {
    storage.dispatchEvent( new CustomEvent( "rise-storage-subscription-expired" ) );
  } );

  test( "should show the storage subscription not active message", function() {
    assert.equal( document.querySelector( ".message" ).innerHTML, "Rise Storage subscription is not active.", "message is correct" );
  } );
} );

suite( "storage api error", function() {
  suiteSetup( function() {
    storage.dispatchEvent( new CustomEvent( "rise-storage-api-error", {
      "detail": {
        "result": false,
        "code": 500,
        "message": "Could not retrieve Bucket Items"
      },
      "bubbles": true
    } ) );
  } );

  test( "should show the storage api error message", function() {
    assert.equal( document.querySelector( ".message" ).innerHTML, "Sorry, there was a problem communicating with Rise Storage.", "message is correct" );
  } );
} );

suite( "normal storage response", function() {
  suiteSetup( function() {
    storage.dispatchEvent( new CustomEvent( "rise-storage-response", {
      "detail": {
        "added": true,
        "name": "Widgets/videos/big_buck_bunny.webm",
        "url": "https://www.googleapis.com/storage/v1/b/risemedialibrary-b428b4e8-c8b9-41d5-8a10-b4193c789443/o/Widgets%2Fvideos%2Fbig_buck_bunny.webm?alt=media"
      },
      "bubbles": true
    } ) );
  } );

  test( "should not show a message", function() {
    assert.isTrue( ( document.getElementById( "container" ).style.display === "block" ), "video container is showing" );
    assert.isTrue( ( document.getElementById( "messageContainer" ).style.display === "none" ), "message container is hidden" );
  } );
} );

suite( "storage error", function() {
  test( "should show storage error message", function() {
    storage.dispatchEvent( new CustomEvent( "rise-storage-error", {
      "detail": {
        "error": {
          "currentTarget": {
            "status": 0
          }
        }
      },
      "bubbles": true
    } ) );

    assert.equal( document.querySelector( ".message" ).innerHTML, "Sorry, there was a problem communicating with Rise Storage.", "message text" );
    assert.isTrue( ( document.getElementById( "messageContainer" ).style.display === "block" ), "message visibility" );
  } );

  test( "should call play function 5 seconds after a storage error", function() {
    var clock = sinon.useFakeTimers(),
      spy = sinon.spy( RiseVision.Video, "play" );

    storage.dispatchEvent( new CustomEvent( "rise-storage-error", {
      "detail": {
        "error": {
          "currentTarget": {
            "status": 0
          }
        }
      },
      "bubbles": true
    } ) );

    clock.tick( 4500 );
    assert( spy.notCalled );
    clock.tick( 500 );
    assert( spy.calledOnce );

    clock.restore();
    RiseVision.Video.play.restore();
  } );
} );

suite( "rise cache error", function() {
  test( "should show rise cache error message", function() {
    storage.dispatchEvent( new CustomEvent( "rise-cache-error", {
      "detail": {
        "error": {
          "message": "The request failed with status code: 500"
        }
      },
      "bubbles": true
    } ) );

    assert.equal( document.querySelector( ".message" ).innerHTML, "There was a problem retrieving the file from Rise Cache.", "message text" );
    assert.isTrue( ( document.getElementById( "messageContainer" ).style.display === "block" ), "message visibility" );
  } );

  test( "should show rise cache error message for 404 status", function() {
    storage.dispatchEvent( new CustomEvent( "rise-cache-error", {
      "detail": {
        "error": {
          "message": "The request failed with status code: 404"
        }
      },
      "bubbles": true
    } ) );

    assert.equal( document.querySelector( ".message" ).innerHTML, "The file does not exist or cannot be accessed.", "message text" );
    assert.isTrue( ( document.getElementById( "messageContainer" ).style.display === "block" ), "message visibility" );
  } );

  test( "should show rise cache error message for 507 status", function() {
    storage.dispatchEvent( new CustomEvent( "rise-cache-error", {
      "detail": {
        "error": {
          "message": "The request failed with status code: 507"
        }
      },
      "bubbles": true
    } ) );

    assert.equal( document.querySelector( ".message" ).innerHTML, "There is not enough disk space to save the file on Rise Cache.", "message text" );
    assert.isTrue( ( document.getElementById( "messageContainer" ).style.display === "block" ), "message visibility" );
  } );

  test( "should call play function 5 seconds after a rise cache error", function() {
    var clock = sinon.useFakeTimers(),
      spy = sinon.spy( RiseVision.Video, "play" );

    storage.dispatchEvent( new CustomEvent( "rise-cache-error", {
      "detail": {
        "error": {
          "message": "The request failed with status code: 500"
        }
      },
      "bubbles": true
    } ) );

    clock.tick( 4500 );
    assert( spy.notCalled );
    clock.tick( 500 );
    assert( spy.calledOnce );

    clock.restore();
    RiseVision.Video.play.restore();
  } );
} );

suite( "cache file unavailable", function() {

  test( "should show file unavailable message", function() {
    storage.dispatchEvent( new CustomEvent( "rise-cache-file-unavailable", {
      "detail": {
        "status": 202,
        "message": "File is downloading"
      },
      "bubbles": true
    } ) );

    assert.equal( document.querySelector( ".message" ).innerHTML, "File is downloading", "message text" );
    assert.isTrue( ( document.getElementById( "messageContainer" ).style.display === "block" ), "message visibility" );
  } );

  test( "should call play function 5 seconds after a file unavailable", function() {
    var clock = sinon.useFakeTimers(),
      spy = sinon.spy( RiseVision.Video, "play" );

    storage.dispatchEvent( new CustomEvent( "rise-cache-file-unavailable", {
      "detail": {
        "status": 202,
        "message": "File is downloading"
      },
      "bubbles": true
    } ) );

    clock.tick( 4500 );
    assert( spy.notCalled );
    clock.tick( 500 );
    assert( spy.calledOnce );

    clock.restore();
    RiseVision.Video.play.restore();
  } );
} );
