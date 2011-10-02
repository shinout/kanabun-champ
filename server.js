var http         = require('http');
var Junjo        = require('./lib/Junjo/Junjo');
var umecob       = require('./lib/Junjo/test/umecob');
var pubdir       = __dirname + '/public'
var viewdir      = __dirname + '/views'
var StaticHoster = require('./lib/Junjo/scripts/lib/StaticHoster');
var staticHoster = new StaticHoster(pubdir);
var EventSetter  = require('./lib/EventSetter');
var cl           = require('./lib/Junjo/lib/termcolor').define();
var kanabun      = require('./kanabun');

/** http hosting **/
var server = http.createServer(function(req, res) {
  if (staticHoster.host(req, res, true)) return;

  var urlElems = req.url.split('/');
  urlElems.shift();
  var type = urlElems[0], key = decodeURIComponent(urlElems[1]);
  var $j = new Junjo();

  $j.catcher = function(e, args) {
    console.red(e.stack);
    this.err = e;
    this.out = {
      statusCode: 404,
      contents: '404 not found.'
    };
    this.$.error = true;
    console.log(this.out, $j.out)
    this.terminate();
  };

  $j('controller', function(type, key) {
    this.$.type = type, this.$.key = key;

    var ctlr = require('./controllers/' + type);
    if (typeof ctlr == 'function') ctlr = ctlr({key: key});
    if (ctlr instanceof Junjo) this.sub = ctlr;
    else return ctlr;
  })
  .firstError('shift');

  $j('umecob', function(out) {
    out || (out = {});
    var data = out.data || {};
    var tpl  = out.tpl || this.$.type;
    this.sub = umecob({
      tpl_id  : viewdir + '/' + tpl + '.html',
      data    : out ? out.data : {},
      attach  : { hostname : process.env['HOSTNAME']}
    });
  })
  .after('controller')
  .firstError('shift')
  .post(function(out) {
    if (this.$.error) return;
    this.out.statusCode = 202;
    this.out.contents = out;
  });

  $j.on('end', function(err, out) {
    res.writeHead(out.statusCode, {'Content-Type' : 'text/html'});
    res.end(out.contents);
  });

  $j.run(type || 'index', key);
});

server.listen(3330);

/** socket.io **/
var io = require('socket.io').listen(server);
var ioClients = {};

io.sockets.on('error', function(ioClient) {
  console.error("error event", ioClient);
});

io.sockets.on('connection', function(ioClient) {
  EventSetter.toSocketIO(ioClient, {
    characters: {
      validate : function(data) {
        console.cyan(data.trim());
        return data.trim().split('');
      },

      OK : function(chars, data) {
        var $j = new Junjo();

        $j.inputs({
          chars: 0
        });

        $j('table', function() {
          var row = -1, col = 0, chtables = [];

          chars.forEach(function(ch, k) {
            if ( (row != 2 && col % 5 == 0) || (row == 2 && col % 4 == 0) ) {
              row++;
              col = 0;
              chtables[row] = [];
            }
            chtables[row][col] = ch;
            col++;
          });
          return chtables;
        })
        .next('table_umecob', function(chtables) {
          this.sub = umecob({
            tpl_id  : viewdir + '/partial/table.html',
            data    : {table : chtables}
          });
        })
        .post(function(err, out) {
          ioClient.emit('tableOK', out);
        });

        $j('hash', function(table) {
          var hash = {};
          table.forEach(function(tr, k) {
            tr.forEach(function(td, j) {
              hash[td] = [k, j];
            });
          });
          ioClient.emit('hashOK', hash);
        }).after('table');

        $j('words', kanabun())
        .after('chars')
        .firstError('shift')
        .post(function(words) {
          return words.sort(function(a, b) {
            return a.length > b.length ? -1: 1;
          });
        })
        .next('words_umecob', function(words) {
          this.sub = umecob({
            tpl_id  : viewdir + '/partial/words.html',
            data    : {words: words}
          });
        })
        .post(function(err, out) {
          ioClient.emit('wordsOK', out);
        });


        $j.run(chars);
      },

      NG : function(e, data) { return e.stack }
    },

    search : {
      validate : function(data) {
        return true;
      },

      OK : function(result, data) {
      },

      NG : function(e, data) { return e }
    }
  });
});
