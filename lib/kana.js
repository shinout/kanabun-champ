function toKatakanaCase() {
  var i, c, a = [];
  for (i = this.length-1; 0 <= i; i--) {
      c = this.charCodeAt(i);
      a[i] = (0x3041 <= c && c <= 0x3096) ? c + 0x0060 : c;
  };
  return String.fromCharCode.apply(null, a);
}

function toHiraganaCase() {
  var i, c, a = [];
  for(i=this.length-1;0<=i;i--) {
    c = this.charCodeAt(i);
    a[i] = (0x30A1 <= c && c <= 0x30F6) ? c - 0x0060 : c;
  };
  return String.fromCharCode.apply(null, a);
};

module.exports = {
  define : function() {
    String.prototype.toKatakanaCase = toKatakanaCase;
    String.prototype.toHiraganaCase = toHiraganaCase;
  },
  toKata : function(str) { return toKatakanaCase.apply(str) },
  toHira : function(str) { return toHiraganaCase.apply(str) }
};
