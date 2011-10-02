var Junjo = require('./lib/Junjo/Junjo');
var mysql  = require('mysql');
var cl     = require('./lib/Junjo/lib/termcolor').define();
var dbinfo = require('./config/dbinfo');

function kanabun(kanas) {

  // MySQL接続情報
  var client = mysql.createClient({
    user     : dbinfo.user,
    password : dbinfo.password 
  });

  var $j = new Junjo();

  $j('kanaHash', function(kanas) {
    var hash = {};
    kanas.forEach(function(k) {
      hash[k] = true;
    });
    return hash;
  });

  // DB選択
  $j('use', function() {
    client.query('use ' + dbinfo.dbname, this.cb);
  });

  $j('keywords', function() {
    client.query('select keyword from keyword', this.cb);
  })
  .post(function(err, results) {
    return results.map(function(v) {
      return v.keyword;
    });
  })
  .after('use');

  $j('check', function(hash, words) {
    return words.filter(function(word) {
      if (!word.length) return false;
      return word.split('').every(function(ch) {
        return hash[ch];
      });
    });
  })
  .out()
  .after('kanaHash', 'keywords');

  $j.catcher = function(e) {
    console.red(e.stack)
    this.err = e
  }

  $j.on('end', function(err, out) {
    client.end();
  });

  return (kanas) ? $j.run(kanas) : $j;
}

function main() {
  var kanas = process.argv[2].split('');
  var $j = kanabun();

  $j.on('end', function(err, out) {
    out.forEach(function(word) {
      var color = (function() {
        switch (word.length) {
          case 6:
          default: return "yellow";
          case 7: return "cyan";
          case 8: return "green";
        }
      })();
      console[color](word);
    });
  });

  $j.run(kanas);
}


if (process.argv[1] == __filename) {
  var fname = process.argv[3];
  if (this[fname]) {
    this[fname]();
  }
  else {
    main();
  }
}

module.exports = kanabun;
