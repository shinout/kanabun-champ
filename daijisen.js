var Junjo = require('./lib/Junjo/Junjo');
var u2r   = require('./lib/url2request');
var http = require('http');

var baseurl = "http://kotobank.jp/dictionary/daijisen/";

function main() {
  var $j = new Junjo({timeout: 0});
  for (var i=1; i<= 3555; i++) {
    $j(collectFromPage(baseurl + i + '/'));
  }
  $j.run();
}

function collectFromPage(url) {
  var $j = new Junjo({timeout: 0});

  $j.inputs({
    url : 0
  });

  $j('request', function(url) {
    var options = u2r(url);
    var req = http.request(options, this.cb);
    req.end();
    req.on("error", this.fail.bind(this));
  });

  $j('response', function(res) {
    this.absorbData(res);
  })
  .firstError('shift')
  .after();

  $j('collect', function(html) {
    var ret = html.split('</a></li>').map(function(v) {
      var n = v.lastIndexOf('>');
      var word = v.slice(n+1)
      .replace(/‐/g, '')
      .replace(/・/g, '');
      var n2 = word.indexOf('【');
      var n3 = word.indexOf('〔');
      if (n2 >= 0) word = word.slice(0, n2);
      if (n3 >= 0) word = word.slice(0, n3);
      return word;
    })
    .filter(function(v) {
      if (v.match(/[a-z]/)) return false;
      var len = v.length;
      return len >=6 && len <= 8;
    });
    for (var i=0; i<3; i++) {
      ret.shift();
      ret.pop();
    }
    return ret;
  })
  .out()
  .after();

  $j.on("end", function(err, out) {
    out.forEach(function(v) {
      console.log(v);
    });
  });

  return (url) ? $j.run(url): $j;
}

this.collect = function() {
  var url = baseurl + "93/";
  collectFromPage().run(url);
};

if (process.argv[1] == __filename) {
  var fname = process.argv[2];
  if (this[fname]) {
    this[fname]();
  }
  else {
    main();
  }
}
