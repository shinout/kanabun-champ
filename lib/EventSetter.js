var EventSetter = {};

EventSetter.toSocketIO = function(ioClient, objs) {
  Object.keys(objs).forEach(function(evtname) {
    var o = objs[evtname];
    ioClient.on(evtname, function() {
      try {
        var result = o.validate.apply(ioClient, arguments);
        if (result === false || result === null) throw new Error(evtname + ' : validation failed.');

        Array.prototype.unshift.call(arguments, result);
        var ret = o.OK.apply(ioClient, arguments);

        if (ret) ioClient.emit(evtname + 'OK', ret);
      }
      catch (e) {
        Array.prototype.unshift.call(arguments, e);
        var err = o.NG.apply(ioClient, arguments);

        if (err) ioClient.emit(evtname + 'NG', err);
      }
    });
  });
  return objs;
};
module.exports = EventSetter;

