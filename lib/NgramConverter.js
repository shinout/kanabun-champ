var NgramConverter = (function() {
  var NgramConverter = { };

  /** string for query **/
  function s4q(str) {
    return String(str).replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
  }

  NgramConverter.to_fulltext = function(str, n) {
    return _to_ngram(str, n);
  };

  NgramConverter.to_query = function(str, n) {
    return _to_ngram(str, n, true);
  };

  NgramConverter.make_match_sql = function(word, column, n) {
    if (word == '') return '';

    var ngram = NgramConverter.to_query(word, n);
    return "MATCH(" + column + ") AGAINST('" + ngram + "' IN BOOLEAN MODE)";
  };

  function _to_ngram(str, n, query_flag) {
    var str_array = str.split(/[\s]+/);

    var result = []; 
    str_array.forEach(function(str) {
      if (query_flag) {
        result.push(_to_ngram_query(str, n));
      }else{
        result.push(_to_ngram_fulltext(str, n));
      }
    });
    return result.join(' ');
  }

  function _to_ngram_fulltext(str, n){
    var ngrams = [];
    str = str.trim();
    if (str == '') return '';
    
    for (var i = 0, l = str.length; i < l; i++) {
      var ngram = str.substr(i, n);
      ngrams.push(ngram);
    }

    return ngrams.join(' ');
  }

  function _to_ngram_query(str, n) {
    var ngrams = [];
    str = str.trim();
    if (str == '') return '';

    var length = str.length;
    if (length < n) {
      return "+" + s4q(str) + "*";
    }

    for (var i = 0, l = length - n + 1; i < l; i++) {
      ngram = str.substr(i, n);
      ngrams.push("+" + s4q(ngram));
    }

    return ngrams.join(' ');
  }

  NgramConverter.s4q = s4q;

  return NgramConverter;
})();

module.exports = NgramConverter;
