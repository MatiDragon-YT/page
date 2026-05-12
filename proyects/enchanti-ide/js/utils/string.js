export const STRING = {
  // Solo un forma abreviada de usar Replace.
  r: function (text, _text = '', _machs = ''){
  	return this.replace(text, _text, _machs)
  },
  rA: function(text, _text = ''){
  	return this.replaceAll(text, _text)
  },
  toHex: function(offset = 0) {
    let result = '';
    for (let i = 0; i < this.length; i++) {
      if (this.charCodeAt(i) > 255){
        throw new Error('Un caracter del String es Unicode')
      }
      
      result += this
      .charCodeAt(i)
      .toString(16)
      .padStart(2,'0');
    }
    for (let i = 0; i < offset; i++) {
      result += '00'
    }
    return result;
  },
  toBigEndian: function(){
    if (this.length % 2 != 0){
      throw new Error('La longitud del String es impar.')
    }
  	let newResult = ''
  	let result = this
  		.split(/([a-f0-9]{2})/i)
  		.clear()
  		.forEach(e => newResult = e + newResult)
  	return newResult
  },
  parseCharScape: function(){
    let nString = this
		.replaceAll('\\n','\n')
		.replaceAll('\\t','\t')
		.replaceAll('\\\\','\\')
    .replaceAll("\\'","'")
		.replaceAll("\\`","`")
    .replaceAll('\\"','"')
    .replace(/\\x([A-F\d]{1,2})/gi,(match, content)=> {
      return String.fromCharCode(content.hexToDec())
    })
    return nString
  },
  hexToFloat: function() {
    let view = new DataView(new ArrayBuffer(4));
  
    this.match(/.{1,2}/g).forEach((byte, i) => {
      view.setUint8(i, parseInt(byte, 16));
    });
  
    return view.getFloat32(0);
  },
}
 