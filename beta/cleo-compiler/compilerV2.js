const 	log = x => console.log(x),

		NP = Number.prototype,
		SP = String.prototype,
		AP = Array.prototype;

/** Shotcun of String.replace()
*/
SP.r = function(text, _text, _flags){
	_text = _text || ''
	_flags = _flags || ''
	return this.replace(text, _text, _flags)
}

/** Polifill and shotcun of String.replaceAll()
*/
SP.rA = function(text, _text){
	var temp = this
	_text = _text || ''

	if(temp.indexOf(text, 0) !== -1){
		temp = temp
		.r(text, _text)
		.rA(text, _text)
	}
	
	return temp
}

SP.toBigEndian = function(){
	let newResult = ''
	let result = this
		.split(/([a-f0-9]{2})/i)
		.Clear()
		.forEach(e => newResult = e + newResult)
	return newResult.toUpperCase()
}

/** Convert any number to HEX with BIG-ENDIAN
*/
NP.toHex = function(){
	if (/\./.test(this)){
		const getHex = i => ('00' + i.toString(16)).slice(-2);

		let view = new DataView(new ArrayBuffer(4)),
		    result;

		view.setFloat32(0, this);

		result = Array
		    .apply(null, { length: 4 })
		    .map((_, i) => getHex(view.getUint8(i)))
		    .join('');

		return result.toBigEndian().toUpperCase()
	}
	return this.toUpperCase()
}

/** Remove elements of a array what is same to ''.
*/
AP.Clear = function(){
	this.forEach((e,i) => {
		if(e=='')this.splice(i,1)
	})
	return this
}

const TYPE_CODE = {
	TERMINAL_NULL		:'00',
	INT32				:'01',
	GVAR				:'02',
	LVAR				:'03',
	INT8				:'04',
	INT16				:'05',
	FLOAT32				:'06',
	GVAR_ARRAY_OFFSET	:'07',
	LVAR_ARRAY_INDEX	:'08',
	STRING8				:'09',
	GVAR_STRING8		:'0A',
	LVAR_STRING8		:'0B',
	GVAR_ARRAY_STRING8	:'0C',
	LVAR_ARRAY_STRING8	:'0D',
	STRING_VARIABLE		:'0E',
	STRING16			:'0F',
	GVAR_STRING16		:'10',
	LVAR_STRING16		:'11',
	GVAR_ARRAY_STRING16	:'12',
	LVAR_ARRAY_STRING16	:'13'
}

const REG = {
	INT			: /(\d+|0x[0-9a-f]+)([^\w]|\s|$)/gmi,
	FLOAT		: /(^|[\s\(\)\[\],])((\d+)\.(\d+)|\.\d+|\d+(\.|f))([\s\(\)\[\],]|$)/gm,
	MODEL		: /(\#[\w\d]+)/g,
	LVAR		: /\d+@(i|f)?([^\d\w]|$)/gm,
	GVAR		: /((\x{00}|s|v)(\$[0-9A-Z_a-z]+))/g,
	MVAR		: /(\&amp;\d+)/g,
	LONG		: /\"([^\n"]+)?\"/g,
	SHORT		: /\'([^\n']+)?\'/g,
	COMMENT		: /(\/\/[^\n]+|\/\*[^\/]*\*\/|\{[^\$][^\{\}]*\})/g,
	DIRECTIVE	: /(\{\$[^{}\n]+\})/g,
	LABEL		: /(^|[\s\(,])(\@+\w+|\:+\w+)/gm,
	JUMP		: /(^|\s)([A-Za-z0-9_]+\(\))/gm
}

SP.parseCodeEnter = function(){
	let value = this
		// remove jump lines innesesaries
		.r(/^\n+/gm, '')
		// remove spaces innesesaries
		.r(/[\x20\t]+$/gm,'')
		.r(/^[\x20\t]+/gm,'')
		
		// remove commits of code
		.r(/(\s+)?\/\/([^\n]+)?/gm, '') 
		.r(/(\s+)?\/\*([^\/]*)?\*\//gm, '')
		.r(/(\s+)?\{([^\$\}]*)?\}/gm, '')

	return value
}

let INPUT_CODE = `
create_thread 'example'   
nop 		
	wait 0
    end_thread



`
INPUT_CODE = INPUT_CODE.parseCodeEnter()
log(INPUT_CODE)