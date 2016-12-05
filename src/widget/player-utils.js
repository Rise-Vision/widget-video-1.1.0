var RiseVision = RiseVision || {};

RiseVision.Video = RiseVision.Video || {};

RiseVision.Video.PlayerUtils = ( function() {
  "use strict";

  /*
   *  Public  Methods
   */
  function getAspectRatio( width, height ) {

    var r;

    function gcd( a, b ) {
      return ( b == 0 ) ? a : gcd( b, a % b );
    }

    r = gcd( width, height );

    return width / r + ":" + height / r;
  }

  function getPlaylist( list ) {
    var i,
      playlist = [];

    for ( i = 0; i < list.length; i += 1 ) {
      playlist.push( {
        file: list[ i ],
        type: this.getVideoFileType( list[ i ] )
      } );
    }

    return playlist;
  }

  function getVideoFileType( url ) {
    var extensions = [ ".mp4", ".webm" ],
      urlLowercase = url.toLowerCase(),
      type = null,
      i;

    for ( i = 0; i <= extensions.length; i += 1 ) {
      if ( urlLowercase.indexOf( extensions[ i ] ) !== -1 ) {
        type = extensions[ i ].substr( extensions[ i ].lastIndexOf( "." ) + 1 );
        break;
      }
    }

    return type;
  }

  return {
    "getAspectRatio": getAspectRatio,
    "getPlaylist": getPlaylist,
    "getVideoFileType": getVideoFileType
  };

} )();
