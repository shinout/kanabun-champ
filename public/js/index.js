var hash = {};
registerEvents(socket, {

  table: {
    OK : function(data) {
      $("#gameTable").html(data);
    },

    NG : function(e) {
      console.log(e);
    }
  },

  hash: {
    OK : function(data) {
      console.log(data);
      hash = data;
    },

    NG : function(e) {
      console.log(e);
    }
  },
  
  words: {
    OK : function(data) {
      $("#input").blur();
      $("#wordsHolder").html(data);
      $("#wordsHolder li:first-child").trigger("click");
    },

    NG : function(e) {
      console.log(e);
    }
  }
});

$(function() {

  $("#input")
  .focus()
  .keydown(function(evt) {
    if (evt.keyCode == 13) {
      socket.emit('characters', $(this).val());
    }
    evt.stopPropagation();
    return true;
  });

  $('#wordsHolder li').live('click', function(evt) {
    $('.selected').removeClass('selected');
    $(this).toggleClass('selected');
    this.innerText.split('').forEach(function(ch) {
      if (hash[ch]) {
        var p = hash[ch];
        $('#p' + p[0] + '_' + p[1]).addClass('selected');
      }
    });
    $('#gameTable caption').text(this.innerText);
  });

  $(window).keydown(function(evt) {
    if (!$("#wordsHolder li").size()) return true;
    var current = $('#wordsHolder li.selected');
    switch (evt.keyCode) {
      case 37: // LEFT
      case 38: // UP
        var el = current.prev();
        if (!el.length) return true;
          el.trigger('click');
        break;
      case 39: // RIGHT
      case 40: // DOWN
      case 32: // SPACE
        var el = current.next();
        if (!el.length) return true;
          el.trigger('click');
        break;
      default: break;
    }
    return true;
  });

});




function registerEvents(socket, objs) {
  Object.keys(objs).forEach(function(evtname) {
    var o = objs[evtname];

    socket.on(evtname + 'OK', function() {
      return o.OK.apply(socket, arguments);
    });

    socket.on(evtname + 'NG', function() {
      return o.NG.apply(socket, arguments);
    });
  });
}
