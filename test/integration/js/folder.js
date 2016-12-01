/* global requests, suiteSetup, suite, suiteTeardown, test, assert, RiseVision, sinon, config */

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

suite( "Storage Initialization - file added", function() {
  var onInitStub;

  suiteSetup( function() {
    onInitStub = sinon.stub( RiseVision.Video, "onFileInit" );
    storage.dispatchEvent( new CustomEvent( "rise-storage-response", {
      "detail": {
        "added": true,
        "name": "Widgets/videos/a_food_show.webm",
        "url": "https://storage.googleapis.com/risemedialibrary-b428b4e8-c8b9-41d5-8a10-b4193c789443/Widgets%2Fvideos%2Fa_food_show.webm"
      },
      "bubbles": true
    } ) );
  } );

  suiteTeardown( function() {
    RiseVision.Video.onFileInit.restore();
  } );

  test( "should set fileType attribute of storage component", function() {
    assert.equal( storage.filetype, "video" );
  } );

  test( "should set folder attribute of storage component", function() {
    assert.equal( storage.folder, "Widgets/videos/" );
  } );

  test( "should set companyid attribute of storage component", function() {
    assert.equal( storage.companyid, "b428b4e8-c8b9-41d5-8a10-b4193c789443" );
  } );

  test( "should set env attribute of storage component", function() {
    assert.equal( storage.env, config.STORAGE_ENV );
  } );

  test( "RiseVision.Video.onFileInit should be called", function() {
    assert( onInitStub.calledOnce );
  } );

} );

suite( "added", function() {
  var refreshStub;

  suiteSetup( function() {
    refreshStub = sinon.stub( RiseVision.Video, "onFileRefresh", function() {} );

    storage.dispatchEvent( new CustomEvent( "rise-storage-response", {
      "detail": {
        "added": true,
        "name": "Widgets/videos/big_buck_bunny.webm",
        "url": "https://www.googleapis.com/storage/v1/b/risemedialibrary-b428b4e8-c8b9-41d5-8a10-b4193c789443/o/Widgets%2Fvideos%2Fbig_buck_bunny.webm?alt=media"
      },
      "bubbles": true
    } ) );
  } );

  suiteTeardown( function() {
    RiseVision.Video.onFileRefresh.restore();
  } );

  test( "Should call onFileRefresh when files added", function() {
    assert( refreshStub.calledOnce );
  } );

} );

suite( "changed", function() {
  var refreshStub;

  suiteSetup( function() {
    refreshStub = sinon.stub( RiseVision.Video, "onFileRefresh" );

    storage.dispatchEvent( new CustomEvent( "rise-storage-response", {
      "detail": {
        "changed": true,
        "name": "Widgets/videos/big_buck_bunny.webm",
        "url": "https://www.googleapis.com/storage/v1/b/risemedialibrary-b428b4e8-c8b9-41d5-8a10-b4193c789443/o/Widgets%2Fvideos%2Fbig_buck_bunny.webm?alt=media"
      },
      "bubbles": true
    } ) );
  } );

  suiteTeardown( function() {
    RiseVision.Video.onFileRefresh.restore();
  } );

  test( "Should call onFileRefresh when files changed", function() {
    assert( refreshStub.calledOnce );
  } );

} );

suite( "unchanged", function() {
  var refreshStub;

  suiteSetup( function() {
    refreshStub = sinon.stub( RiseVision.Video, "onFileRefresh" );

    storage.dispatchEvent( new CustomEvent( "rise-storage-response", {
      "detail": {
        "changed": false,
        "name": "Widgets/videos/big_buck_bunny.webm",
        "url": "https://www.googleapis.com/storage/v1/b/risemedialibrary-b428b4e8-c8b9-41d5-8a10-b4193c789443/o/Widgets%2Fvideos%2Fbig_buck_bunny.webm?alt=media"
      },
      "bubbles": true
    } ) );
  } );

  suiteTeardown( function() {
    RiseVision.Video.onFileRefresh.restore();
  } );

  test( "Should not call onFileRefresh when files have not changed", function() {
    assert( refreshStub.notCalled );
  } );

} );

suite( "deleted", function() {
  var refreshStub;

  suiteSetup( function() {
    refreshStub = sinon.stub( RiseVision.Video, "onFileRefresh" );

    storage.dispatchEvent( new CustomEvent( "rise-storage-response", {
      "detail": {
        "deleted": true,
        "name": "Widgets/videos/big_buck_bunny.webm",
        "url": "https://www.googleapis.com/storage/v1/b/risemedialibrary-b428b4e8-c8b9-41d5-8a10-b4193c789443/o/Widgets%2Fvideos%2Fbig_buck_bunny.webm?alt=media"
      },
      "bubbles": true
    } ) );
  } );

  suiteTeardown( function() {
    RiseVision.Video.onFileRefresh.restore();
  } );

  test( "Should call onFileRefresh when files deleted", function() {
    assert( refreshStub.calledOnce );
  } );

} );

suite( "Storage Refresh - JW Player error", function() {

  test( "should refresh on a JW player error", function() {
    var onRefreshStub = sinon.stub( RiseVision.Video, "onFileRefresh", function() {} );

    RiseVision.Video.hasPlayerError = function() {
      return true;
    }

    storage.dispatchEvent( new CustomEvent( "rise-storage-response", {
      "detail": {
        "changed": false,
        "name": "Widgets/videos/big_buck_bunny.webm",
        "url": "https://www.googleapis.com/storage/v1/b/risemedialibrary-b428b4e8-c8b9-41d5-8a10-b4193c789443/o/Widgets%2Fvideos%2Fbig_buck_bunny.webm?alt=media"
      },
      "bubbles": true
    } ) );

    assert( onRefreshStub.calledOnce );

    RiseVision.Video.onFileRefresh.restore();
  } );

} );

suite( "Network Recovery", function() {

  test( "should call onFileRefresh() if in state of storage error and network recovered", function() {
    var onRefreshStub = sinon.stub( RiseVision.Video, "onFileRefresh", function() {} );

    // force a storage error in the scenario of a network failure
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

    // force a response in the scenario of the network recovered
    storage.dispatchEvent( new CustomEvent( "rise-storage-response", {
      "detail": {
        "changed": false,
        "name": "Widgets/videos/big_buck_bunny.webm",
        "url": "https://www.googleapis.com/storage/v1/b/risemedialibrary-b428b4e8-c8b9-41d5-8a10-b4193c789443/o/Widgets%2Fvideos%2Fbig_buck_bunny.webm?alt=media"
      },
      "bubbles": true
    } ) );

    assert( onRefreshStub.calledOnce );

    RiseVision.Video.onFileRefresh.restore();
  } );

} );
