const 	log = x => console.log(x),

		NP = Number.prototype,
		SP = String.prototype,
		AP = Array.prototype;


function IsInRange(VAR, MIN, MAX){
	return (VAR >= MIN && VAR <= MAX) ? 1 : 0;
}

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
		.clear()
		.forEach(e => newResult = e + newResult)
	return newResult
}

/** Convert any number to HEX with BIG-ENDIAN
*/
NP.toHex = function(){
	const getHex = i => ('00' + i.toString(16)).slice(-2);

	let view = new DataView(new ArrayBuffer(4)),
	    result;

	view.setFloat32(0, this);

	result = Array
	    .apply(null, { length: 4 })
	    .map((_, i) => getHex(view.getUint8(i)))
	    .join('');

	return result.toBigEndian()
}

/** Remove elements of a array what is same to ''.
*/
AP.clear = function(){
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

const SCM_DB = {
	'nop'			: {
		opcode : '0000',
		params : []
	},
	'wait'			: {
		opcode : '0001',
		params : ['int']
	},
	'camera_shake'	: {
		opcode : '0003',
		params : ['int']
	},
	'set_lvar_float': {
		opcode : '0007',
		params : ['lvar','float']
	},
	'create_thread'	: {
		opcode : '03a4',
		params : ['short']
	},
	'end_thread'	: {
		opcode : '004e',
		params : []
	},
	'test__short'	: {
		opcode : 'fff1',
		params : ['short']
	},
	'test__long'	: {
		opcode : 'fff2',
		params : ['long']
	},
	'test__int'		: {
		opcode : 'fff3',
		params : ['int']
	},
	'test__lvar'	: {
		opcode : 'fff3',
		params : ['int']
	},
	'test__gvar'	: {
		opcode : 'fff3',
		params : ['int']
	},
}

SP.toUnicode = function() {
  return this.split("").map(s => {
    return `${s.charCodeAt(0).toString(16).padStart(2, '0')}`;
  }).join("");
}

SP.Translate = function(){
	let codeDepurated = []
	
	if (this.match(/[^\w\d]("([^"\n]+)?)(\x20)(([^"\n]+)?")[^\w\d]/)) {
		log('NO ADD SPACES IN STRINGS')
		return
	}

	let LineComand = this
		.r(/(:|@)[\w\d]+/gm, '')
		// remove commits of code
		.r(/(\s+)?\/\/([^\n]+)?/gm, '') 
		.r(/(\s+)?\/\*([^\/]*)?\*\//gm, '')
		.r(/(\s+)?\{([^\$\}]*)?\}/gm, '')
		// remove spaces innesesaries
		.r(/[\x20\t]+$/gm,'')
		.r(/^[\x20\t]+/gm,'')
		// remove jump lines innesesaries
		.r(/^\n+/gm, '')
		.r(/\n$/gm, '')
		
		.split('\n')

	LineComand.forEach((Line, numLine) => {
		LineComand[numLine] = Line.split(' ')

		let lineDepurated = []
		let command = ''
		let typeData = ''
		LineComand[numLine].forEach((Param, numParam) => {
			if (numParam == 0) { // opcode
				lineDepurated.push(SCM_DB[Param].opcode.toBigEndian())
				command = Param
			}
			else {
				typeData = SCM_DB[command].params[--numParam]

				switch (typeData) {
					case 'short':
						Param = Param.replace(/'(.+)'/, '$1')
						Param = Param.substring(0,7)
						Param = (TYPE_CODE.STRING8 + Param.toUnicode()) + '00'
						while(Param.length < 18){
							Param += TYPE_CODE.TERMINAL_NULL
						}
					break;

					case 'long':
						Param = Param.replace(/"(.+)"/, '$1')
						if (Param.length < 15){
							Param = (TYPE_CODE.STRING16 + Param.toUnicode()) + '00'
							while(Param.length < 32){
								Param += TYPE_CODE.TERMINAL_NULL
							}
						}else{
							Param = (TYPE_CODE.STRING_VARIABLE + Param.length + Param.toUnicode())
						}
					break;

					case 'string':
						Param = Param.replace(/('(.+)'|"(.+)")/, '$2$3')
						Param = (TYPE_CODE.STRING_VARIABLE + Param.length + Param.toUnicode())
						INPUT_CODE[i][index] = Param
					break;

					case 'int':
						Param.replace(/^0x.+/mi, hex => {
							return parseInt(hex, 16)
						})

						let byte1   = 0x7F       // 127
						let byte1R  = 0xFF
						let byte2   = 0x7FFF     // 32767
						let byte2R  = 0xFFFF
						let byte4   = 0x7FFFFFFF // 2147483647
						let byte4R  = 0xFFFFFFFF

						let dataType;

						if (0 <= Param) {
							if (Param <= byte4) dataType = TYPE_CODE.INT32;
							if (Param <= byte2) dataType = TYPE_CODE.INT16;
							if (Param <= byte1) dataType = TYPE_CODE.INT8;
						} else {
							//Param *= -1

							if (IsInRange(Param, -(byte1+=2), 0)) {
								dataType = TYPE_CODE.INT8;	
							}
							if (IsInRange(Param, -(byte2+=2), -byte1)) {
								dataType = TYPE_CODE.INT16;
							}
							if (IsInRange(Param, -(byte4+=2), -byte2)) {
								dataType = TYPE_CODE.INT32;
							}

							Param *= -1
							switch (dataType){
								case TYPE_CODE.INT8 :
									Param -= byte1R;
									break;

								case TYPE_CODE.INT16 :
									Param -= byte2R;
									break;

								case TYPE_CODE.INT32 :
									Param -= byte4R;
									break;

								default: break;
							}
							Param *= -1
							Param++;
						}
						Param = Number(Param).toString(16).padStart((()=>{
							let temp
							switch (dataType){
								case TYPE_CODE.INT8 :
									temp = 2
									break;

								case TYPE_CODE.INT16 :
									temp = 4
									break;

								case TYPE_CODE.INT32 :
									temp = 8
									break;

								default: break;
							}
							return temp
						})(), '0')

						Param = dataType + Param.toBigEndian()

					break;

					case 'float':
						Param = TYPE_CODE.FLOAT32 + Number(Param).toHex()
					break;

					case 'lvar':
						Param = 
							TYPE_CODE.LVAR 
							+ Number(Param.r('@','')).toString(16)
								.padStart(4,'0')
								.toBigEndian()
					break;
				}

				lineDepurated.push(Param)
			}
		})

		codeDepurated.push(lineDepurated)
	})
	
	log(codeDepurated)

	return codeDepurated.toString().replace(/,/g,'').toUpperCase()
}
/*
log(`nop
:example
create_thread 'example'
wait 0 {ms}
set_lvar_float 0@ 0.0
set_lvar_float 1@ 0.12
camera_shake 100 {ms}
wait 1000 {ms}
camera_shake 100 {ms}
wait 1000 {ms}
camera_shake 100 {ms}
end_thread`.Translate())*/