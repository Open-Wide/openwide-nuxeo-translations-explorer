var NxTranslationsCtrl = (function() {

'use strict';

// Constants
  
var NUXEO_VERSIONS = ['5.6.0', '5.7.3'];
var LANGUAGES = [
  {name: 'English', code: 'en'},
  {name: 'French', code: 'fr'},
  {name: 'German', code: 'de'},
  {name: 'Spanish', code: 'es'},
  {name: 'Portugese', code: 'pt'},
  {name: 'Italian', code: 'it'},

  {name: 'Arabic', code: 'ar'},
  {name: 'Basque', code: 'eu'},
  {name: 'Bresilian Portugese', code: 'pt_BR'},
  {name: 'Canadian French', code: 'fr_CA'}, // since 5.7
  {name: 'Catalan', code: 'ca'},
  {name: 'Chinese', code: 'zh_CN'},
  {name: 'Czech', code: 'cs'}, // since 5.7
  {name: 'Galician', code: 'gl'},
  {name: 'Greek', code: 'el_GR'},
  {name: 'Japanese', code: 'ja'},
  {name: 'Polish', code: 'pl'},
  {name: 'Russian', code: 'ru'},
  {name: 'Serbian', code: 'sr'},
  {name: 'Vietnamese', code: 'vi'}
];

var INITIAL_VERSION = '5.6.0';
var INITIAL_LANGUAGES = ['en', 'fr'];

var DEFAULT_LANGUAGE = 'default';

// Directives & dependencies

var app = angular.module('nxtranslations', ['ui.bootstrap']);

ZeroClipboard.setDefaults( { moviePath: 'js/lib/ZeroClipboard.swf' } );

app.directive('owClipboard', function() {
   return {
    restrict: 'A',
    link: function(scope, element, attrs) { 
      var clip = new ZeroClipboard(element[0]);
      clip.on('complete', function(client, args) {
       $('#clipboardSuccessKey').html($(this).html());
        var $clipboardSuccess = $('#clipboardSuccess');
        $clipboardSuccess.fadeIn(300, function() {
          setTimeout(function() {
            $clipboardSuccess.fadeOut(300);
          }, 2000);
        });
      });
    }
   };
});

// State management

var parseStateString = function(stateString) {
  // http://stackoverflow.com/questions/2090551/parse-query-string-in-javascript
  var args = stateString.substring(1).split('&');
  var argsParsed = {};
  for (var i = 0; i < args.length; i++) {
      var arg = unescape(args[i]);
      if (arg.indexOf('=') == -1) {
          argsParsed[arg.trim()] = true;
      }
      else {
          var kvp = arg.split('=');
          argsParsed[kvp[0].trim()] = kvp[1].trim();
      }
  }
  return argsParsed;
}

var loadState = function() {
  var loadedState = parseStateString(window.location.hash) || {};
  var state = {
    version: loadedState.version || INITIAL_VERSION,
    languages: INITIAL_LANGUAGES,
  };
  if (loadedState.languages) {
    state.languages = loadedState.languages.split(',');
  }
  refreshLanguageButtons(state);
  return state;
};

var saveState = function(state) {
  window.location.hash = "version=" + state.version + "&languages=" + state.languages.join(',');
};

var refreshLanguageButtons = function(state) {
  state.languageButtons = new Array();
  _.each(LANGUAGES, function(value, i) {
    state.languageButtons[i] = state.languages.indexOf(value.code) != -1;
  });
  return state;
};

// Translations files parsing

var decodeRegexp = /\\u([\d\w]{4})/gi;
function decode(s) {
  s = s.replace(decodeRegexp, function (match, grp) {
      return String.fromCharCode(parseInt(grp, 16));
  });
  return unescape(s);
}

function parseProperties(data) {
  var translations = [];
  var lines = data.split('\n');
  for (var i in lines) {
    var splitLine = lines[i].split('=');
    if (splitLine[0].indexOf('#') != 0 && splitLine[1]) {
      translations.push({
        key: splitLine[0],
        value: decode(splitLine[1])
      });
    }
  }
  return translations;
}

function fillTranslations(translations, properties, language) {
  _.each(properties, function(property, i) {
    var item = translations[property.key];
    if (!item) {
      item = translations[property.key] = {
          key: property.key,
          values: []
        };
    }
    
    var missing = true;
    _.each(item.values, function(value, key) {
      if ((value.language == language) || language == DEFAULT_LANGUAGE) {
        missing = false;
      }
      else if (value.language == DEFAULT_LANGUAGE) {
        item.values.splice(key, 1);
      }
    });
    if (missing) {
      item.values.push({language: language, text: property.value});
    }
  });
  return translations;
}

// Translations files cache

var translationsCache = {};
function fetchProperties($http, url, callback) {
  if (translationsCache[url]) {
    callback(translationsCache[url]);
  }
  else {
    var $loaderIcon = $('#loader');
    $loaderIcon.show();
    $http({method: 'GET', url: url}).success(function(data) {
      translationsCache[url] = parseProperties(data);
      callback(translationsCache[url]);
      $loaderIcon.hide();
    });
  }
}

// Controller

return function($scope, $http) {

  $scope.nuxeoVersions = NUXEO_VERSIONS;
  $scope.languages = LANGUAGES;
  $scope.state = loadState();
  
  $scope.refreshTranslations = function() {
    $scope.translations = {};
    $scope.translationsArray = {};
    var languagesToLoad = $scope.state.languages.slice(0);
    languagesToLoad.push(DEFAULT_LANGUAGE);
    _.each(languagesToLoad, function(language, i) {
      var url = 'l10n/' + $scope.state.version + '/messages' + ((language == DEFAULT_LANGUAGE) ? '' : ('_' + language)) + '.properties';
      fetchProperties($http, url, function(properties) {
        $scope.translations = fillTranslations($scope.translations, properties, language);
        $scope.translationsArray = _.values($scope.translations);
      });
    });
  };
  
  $scope.setVersion = function(version) {
    $scope.state.version = version;
    $scope.refreshTranslations();
    saveState($scope.state);
  };
  
  $scope.toggleLanguage = function(language) {
    var i = $scope.state.languages.indexOf(language);
    if (i != -1) {
      delete $scope.state.languages[i];
      $scope.state.languages = _.compact($scope.state.languages);
    }
    else {
      $scope.state.languages.push(language);
    }
    $scope.refreshTranslations();
    saveState($scope.state);
  }
  
  $scope.refreshTranslations();
}

})();
