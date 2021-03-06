/* exported config */
if ( typeof angular !== "undefined" ) {
  angular.module( "risevision.common.i18n.config", [] )
    .constant( "LOCALES_PREFIX", "locales/translation_" )
    .constant( "LOCALES_SUFIX", ".json" );
}

const config = {
  STORAGE_ENV: "prod",
  COMPONENTS_PATH: "components/"
};
