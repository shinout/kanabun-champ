var Junjo  = require('./lib/Junjo/Junjo');
var mysql  = require('mysql');
var md5    = require('./lib/md5');
var fs     = require('fs');
var spawn  = require('child_process').spawn;
var Ngram  = require('./lib/NgramConverter');
var s4q    = Ngram.s4q;
var cl     = require('./lib/Junjo/lib/termcolor').define();
var LS     = require('./lib/LineStream/LineStream');
var dbinfo = require('./config/dbinfo');

var filename = 'docs/words.txt';

function main() {

  // MySQL接続情報
  var client = mysql.createClient({
    user     : dbinfo.user,
    password : dbinfo.password 
  });

  var $j = new Junjo();

  // DB選択
  $j('use', function() {
    client.query('use ' + dbinfo.dbname, this.cb);
  });

  /** prepare tables **/
  // FACET_OBJECT情報をきれいにする
  $j('drop', function() {
    console.green("DROP TABLE keyword");
    client.query("DROP TABLE IF EXISTS `keyword`", this.cb);
  });

  $j('table', function() {
    console.green("CREATE TABLE keyword");
    client.query(
        "CREATE TABLE IF NOT EXISTS `keyword` ("
      + " `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY"
      + ",`keyword` VARCHAR(255) NOT NULL"
      + ",`keyword_hash` VARCHAR(32) NOT NULL"
      + ",`keyword_ngram` TEXT NOT NULL"
      + ",FULLTEXT(`keyword_ngram`)"
      + ",UNIQUE(`keyword_hash`)"
      + " ) ENGINE = MyISAM", this.cb);
  }).after('drop');


  // ファイルからwordを取得してinsert
  $j('words', function() {
    var lines = new LS(filename, {trim : true});
    this.absorb(lines, 'data', function(word, result) {
      saveWord(word, client);
    });
  })
  .timeout(0)
  .after('table');

  $j.on('end', function(err, out) {
    // client.end();
  });

  $j.run();
}


/**
 * @param (string) word
 * @param (object) client : mysql client object
 */
function saveWord(word,client) {

  var $j = new Junjo({timeout: 0});

  $j.inputs({
    word  : 0,
    client: 1
  });


  $j('insert', function(word, client) {
    this.word = word;

    var sql = 
      'insert into keyword values ('
    + '"0",'
    + '"'+ s4q(word) + '",'
    + '"'+ s4q(md5(word)) + '",'
    + '"'+ s4q(Ngram.to_fulltext(word, 1)) + '"'
    + ')';

    console.yellow(sql);
    client.query(sql, this.cb);
  })
  .firstError()
  .fail(function(e) {
    console.red(e.message)
  })
  .post(function(err, info) {
    console.green(this.word, info ? info.insertId : null)
  })
  .after('word', 'client');

  return $j.run(word, client);
}


if (process.argv[1] == __filename) {
  var fname = process.argv[2];
  if (this[fname]) {
    this[fname]();
  }
  else {
    main();
  }
}
