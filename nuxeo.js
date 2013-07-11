$(document).ready(function() {

// Constants

var LIMIT = 100;

// Translations database

var db = []; // {l: language, key: key, value: value, search: formatted value for search}

// Functions

var decodeRegexp = /\\u([\d\w]{4})/gi;
function decode(s) {
  s = s.replace(decodeRegexp, function (match, grp) {
      return String.fromCharCode(parseInt(grp, 16));
  });
  return unescape(s);
}

function formatForSearch(s) {
  return s.toLowerCase();
}

function loadTranslations(file, language, callback) {
  $.ajax({
    url: file,
    contentType: 'text/plain; charset=UTF-8'
  }).done(function(data, textStatus, jqXHR) {
    var lines = jqXHR.responseText.split('\n');
    for (var i in lines) {
      var splitLine = lines[i].split('=');
      if (splitLine[0].indexOf('#') != 0 && splitLine[1]) {
        var decodedValue = decode(splitLine[1]);
        db.push({
          l: language,
          key: splitLine[0],
          value: decodedValue,
          search: formatForSearch(decodedValue + '|' + splitLine[0])
        });
      }
    }
    db = db.sort(function(a, b) {
      return a.key.localeCompare(b.key);
    });
    if (typeof callback == 'function') {
      callback();
    }
  });
}

function search(query) {
  var formattedQuery = formatForSearch(query);
  var exactResults = [];
  var results = [];
  for (var i in db) {
    var entry = db[i];
    var index = entry.search.indexOf(query);
    if (index != -1) {
      if (index == 0) {
        exactResults.push(entry);
      }
      else {
        results.push(entry);
      }
      if (results.length > LIMIT) {
        break;
      }
    }
  }
  results = exactResults.concat(results);
  
  var table = '<table class="table table-striped"><tbody>';
  for (var i in results) {
    var result = results[i];
    table += '<tr><td><img src="img/' + result.l + '.png"></td><td class="clipboard" data-clipboard-text="' + result.key + '"><b>' + result.key + '</b></td><td>' + result.value + '</td></tr>';
  }
  if (results.length >= LIMIT) {
    table += '<tr><td colspan="3">(more than ' + LIMIT + ' results)</td></tr>';
  }
  else {
    table += '<tr><td colspan="3">(' + results.length + ' results)</td></tr>';
  }
  table += '</tbody></table>';
  $('#results').html(table);
  
  $('.clipboard').each(function() {
    var clip = new ZeroClipboard(this, {
      moviePath: "lib/ZeroClipboard.swf"
    });
    clip.on('complete', function(client, args) {
      $('#clipboardSuccessText').html($(this).html());
      $clipboardSuccess = $('#clipboardSuccess');
      $clipboardSuccess.fadeIn(300, function() {
        setTimeout(function() {
          $clipboardSuccess.fadeOut(300);
        }, 2000);
      });
    });
  });
}

// Initialization

loadTranslations('messages/messages.properties', 'en', function () {
  loadTranslations('messages/messages_fr.properties', 'fr', function () {
    search($('#find').val());
    $('#entryCount').html(db.length);
  });
});

$('#find').on('keyup', function() {
  search($(this).val());
});
$('#resetSearch').click(function () {
  search('');
  $('#find').val('');
});


});
