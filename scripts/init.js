var Junjo  = require('../lib/Junjo/Junjo');
var path   = require('path');
var fs     = require('fs');
var util   = require('util');
var cl     = require('../lib/Junjo/lib/termcolor').define();

const PROJECT_ROOT    = path.normalize(__dirname + '/../');
const DBCONF_FILENAME = PROJECT_ROOT + "config/dbinfo.js";
const DBCONF_SKELETON = PROJECT_ROOT + "config/dbinfo.skeleton.js";

function main() {
  var $j = new Junjo();

  $j('global.dependency', function() {
      console.white("checking dependency");
      require('mysql');
  })
  .fail(function(e) {
    this.err = e;
    console.red("you must install mysql module first. 'npm install mysql'");
    this.terminate();
  })
  .post(function() {
    console.green("checking dependency ..DONE");
  });

  // making skeleton
  $j('dbconf.exist', function() {
    console.white("checking if db config file exists");
    path.exists(DBCONF_FILENAME, this.cb);
  })
  .after('global.dependency')
  .post(function(bool) {
    if (bool) {
      console.green("db config file already exists");
      this.skip('dbconf.create');
    }
    return bool;
  })
  .next('dbconf.create', function(bool) {
    console.white("creating db config file");
    util.pump(
      fs.createReadStream(DBCONF_SKELETON), 
      fs.createWriteStream(DBCONF_FILENAME), this.cb);
  })
  .firstError()
  .post(function(err) {
    console.green("config file was created.");
  });


  return $j.run();
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
