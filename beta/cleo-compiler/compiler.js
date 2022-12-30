// Tab Size: 4

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

let CUSTOM_VARIABLES = `
2=PLAYER_CHAR
3=PLAYER_ACTOR
11=PLAYER_GROUP
409=ONMISSION
`

CUSTOM_VARIABLES = CUSTOM_VARIABLES.split('\n').clear()

CUSTOM_VARIABLES.forEach((l,i)=>{
	CUSTOM_VARIABLES[i] = l.split('=')
})

//log({CUSTOM_VARIABLES})

/*
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
*/
const SCM_DB = {
	'nop'			: {
		opcode : '0000',
		params : []
	},
	'wait'			: {
		opcode : '0001',
		params : ['int']
	},
	'jump'			: {
		opcode : '0002',
		params : ['label']
	},
	'camera_shake'	: {
		opcode : '0003',
		params : ['int']
	},
	'set_var_int': {
		opcode : '0004',
		params : ['gvar','int']
	},
	'set_var_float': {
		opcode : '0005',
		params : ['gvar','float']
	},
	'set_lvar_int': {
		opcode : '0006',
		params : ['lvar','int']
	},
	'set_lvar_float': {
		opcode : '0007',
		params : ['lvar','float']
	},
	'add_val_to_int_var': {
		opcode : '0008',
		params : ['gvar','int']
	},
	'add_val_to_float_var': {
		opcode : '0009',
		params : ['gvar','float']
	},
	'create_thread'	: {
		opcode : '004f',
		params : ['short']
	},
	'end_thread'	: {
		opcode : '004e',
		params : []
	},
	'[short]'	: {
		opcode : 'ffff',
		params : ['short']
	},
	'[long]'	: {
		opcode : 'ffff',
		params : ['long']
	},
	'[string]'	: {
		opcode : 'ffff',
		params : ['string']
	},
	'[int]'		: {
		opcode : 'ffff',
		params : ['int']
	},
	'[float]'		: {
		opcode : 'ffff',
		params : ['float']
	},
	'[lvar]'	: {
		opcode : 'ffff',
		params : ['lvar']
	},
	'[gvar]'	: {
		opcode : 'ffff',
		params : ['gvar']
	},
}

SP.toUnicode = function() {
  return this.split("").map(s => {
    return `${s.charCodeAt(0).toString(16).padStart(2, '0')}`;
  }).join("");
}

SP.Translate = function(){
	let codeDepurated = []
	let totalSizePerLine = []
	
	if (this.match(/[^\w\d]("([^"\n]+)?)(\x20)(([^"\n]+)?")[^\w\d]/)) {
		log('NO ADD SPACES IN STRINGS')
		return
	}

	let LineComand = this
		//.r(/^(\x20+)?:[\w\d]+/gm, '')
		// remove commits of code
		.r(/(\s+)?\/\/([^\n]+)?/gm, '') 
		.r(/(\s+)?\/\*([^\/]*)?\*\//gm, '')
		.r(/(\s+)?\{([^\$\}]*)?\}/gm, '')
		// remove spaces innesesaries
		.r(/[\x20\t]+$/gm,'')
		.r(/(\t|\x20)(\t|\x20)+/gm,'$1')
		.r(/^[\x20\t]+/gm,'')
		// remove jump lines innesesaries
		.r(/^\n+/gm, '')
		.r(/\n$/gm, '')
		.split('\n')

	let codeOfEnter = this.split('\n').clear();

	LineComand.forEach((Line, numLine) => {
		if (Line.match(/^:/)) {
			totalSizePerLine.push(Line.r(':','').toUpperCase())
			//log(totalSizePerLine)
		}
		else {
			LineComand[numLine] = Line.split(' ')

			let lineDepurated = []
			let setOp = ''
			let isNegative = false
			let command = ''
			let typeData = ''
			
			LineComand[numLine].forEach((Argument, numArgument) => {
				if (numArgument >= 1) {
					if (/(^[a-zA-Z]{2}|^[a-zA-Z]$|^[=/*+\-%^]$)/m.test(Argument)){
						//log(Argument+': es un comentario')
						LineComand[numLine][numArgument] = ''
					}
				}
				LineComand[numLine] = LineComand[numLine].clear()
			})

			//log(LineComand[numLine])

			LineComand[numLine].forEach((Argument, numArgument) => {
				if (numArgument == 0) { // command
					if(/^[A-Fa-f\d]{4}:/m.test(Argument)){
						// is opcode
						setOp = Argument.r(':','')

						if(/^[8-9A-Fa-f]/.test(Argument)){
							isNegative = true
							setOp = (
								parseInt(setOp, 16) - 0b1000000000000000
							).toString(16).padStart(4,'0')
						}

						Object.entries(SCM_DB).every(([key, value]) => {
						  if (value.opcode == setOp) {
						  	Argument = key
						  	return false
						  }
						  return true
						})

						if (isNegative == true){
							setOp = (
								parseInt(setOp, 16) + 0b1000000000000000
							).toString(16)
						}
					}else{
						// is keyword
						if(Argument[0] == '!'){ // is negative
							Argument = Argument.r('!','')
							isNegative = true
						}

						setOp = SCM_DB[Argument].opcode

						if (isNegative == true){
							setOp = (
								parseInt(setOp, 16) + 0b1000000000000000
							).toString(16)
						}
					}
					lineDepurated.push(setOp.toBigEndian())

					command = Argument

					totalSizePerLine.push(2)
				}
				else { // is Argument
					totalSizePerLine.push(1)

					typeData = SCM_DB[command].params[--numArgument]

					switch (typeData) {
						case 'short':
							totalSizePerLine.push(8)
							Argument = Argument.r(/'(.+)'/, '$1')
							Argument = Argument.substring(0,7)
							Argument = (TYPE_CODE.STRING8 + Argument.toUnicode()) + '00'
							while(Argument.length < 18){
								Argument += TYPE_CODE.TERMINAL_NULL
							}
						break;

						case 'long':
							Argument = Argument.r(/"(.+)"/, '$1')
							if (Argument.length < 15){
								totalSizePerLine.push(16)
								Argument = (TYPE_CODE.STRING16 + Argument.toUnicode()) + '00'
								while(Argument.length < 32){
									Argument += TYPE_CODE.TERMINAL_NULL
								}
							}else{
								Argument = Argument.substring(0,255)
								totalSizePerLine.push(Argument.length)
								Argument = (TYPE_CODE.STRING_VARIABLE + Argument.length + Argument.toUnicode())
							}
						break;

						case 'string':
							Argument = Argument.r(/('(.+)'|"(.+)")/, '$2$3')
							Argument = Argument.substring(0,255)
							totalSizePerLine.push(Argument.length)
							Argument = (TYPE_CODE.STRING_VARIABLE + Argument.length + Argument.toUnicode())
							INPUT_CODE[i][index] = Argument
						break;

						case 'int':
							Argument = Argument.r(/^0x.+/mi, hex => {
								return parseInt(hex, 16)
							})
							Argument = Argument.r('true', 1)
							Argument = Argument.r('false', 0)


							let byte1   = 0x7F       // 127
							let byte1R  = 0xFF
							let byte2   = 0x7FFF     // 32767
							let byte2R  = 0xFFFF
							let byte4   = 0x7FFFFFFF // 2147483647
							let byte4R  = 0xFFFFFFFF

							let dataType;

							if (0 <= Argument) {
								if (Argument <= byte4) dataType = TYPE_CODE.INT32;
								if (Argument <= byte2) dataType = TYPE_CODE.INT16;
								if (Argument <= byte1) dataType = TYPE_CODE.INT8;
							}
							else {
								//Argument *= -1

								if (IsInRange(Argument, -(byte1+=2), 0)) {
									dataType = TYPE_CODE.INT8;
								}
								if (IsInRange(Argument, -(byte2+=2), -byte1)) {
									dataType = TYPE_CODE.INT16;
								}
								if (IsInRange(Argument, -(byte4+=2), -byte2)) {
									dataType = TYPE_CODE.INT32;
								}

								Argument *= -1
								switch (dataType){
									case TYPE_CODE.INT8 :
										Argument -= byte1R;
										break;

									case TYPE_CODE.INT16 :
										Argument -= byte2R;
										break;

									case TYPE_CODE.INT32 :
										Argument -= byte4R;
										break;

									default: break;
								}
								Argument *= -1
								Argument++;
							}

							Argument = Number(Argument).toString(16).padStart((()=>{
								let temp
								switch (dataType){
									case TYPE_CODE.INT8 :
										temp = 2
										totalSizePerLine.push(1)
										break;

									case TYPE_CODE.INT16 :
										temp = 4
										totalSizePerLine.push(2)
										break;

									case TYPE_CODE.INT32 :
										temp = 8
										totalSizePerLine.push(4)
										break;

									default: break;
								}
								return temp
							})(), '0')

							Argument = dataType + Argument.toBigEndian()
						break;

						case 'float':
							totalSizePerLine.push(4)

							Argument = TYPE_CODE.FLOAT32 + Number(Argument).toHex()
						break;

						case 'lvar':
							totalSizePerLine.push(2)

							Argument = 
								TYPE_CODE.LVAR 
								+ Number(Argument.r('@','')).toString(16)
									.padStart(4,'0')
									.toBigEndian();
						break;

						case 'gvar':
							totalSizePerLine.push(2)

							if(/\$/.test(Argument)){
								Argument = Argument.r(/(i|f)?\$/,'')

								if (/\w/.test(Argument)){
									let coincide = false

									CUSTOM_VARIABLES.forEach(v => {
										if (Argument == v[1]) coincide = v[0]
									})

									if (coincide == false){
										Argument = parseInt(Number(String(parseInt(Argument, 35)).substring(0, 4) / 2))
										if (Argument > 1000) Argument /= 5
										if (Argument > 500) Argument /= 2
										Argument = parseInt(Argument)
										//log(Argument)
									}
									else {
										Argument = coincide
									}
								}
								else{
									Argument = Argument * 4
								}
							}

							else {
								Argument = Number(Argument.r('&',''))
							}

							Argument = TYPE_CODE.GVAR + (
								Argument.toString(16)
								.substring(0, 4)
								.padStart(4,'0')
								.toBigEndian()
							)
						break;

						case 'label':
							totalSizePerLine.push(4)

							Argument = TYPE_CODE.INT32 + `<${Argument}>`
						break;

						default:
							Argument = ''
						break;

					}

					lineDepurated.push(Argument)
				}
			})

			codeDepurated.push(lineDepurated)
		}
	})
	
	//log(codeDepurated)

	let codeOfFinal = codeDepurated.toString().r(/,/g,'').toUpperCase();

	let codeOfFinalDepurated = codeOfFinal.r(/<@([^<>]+)>/g, input => {
		let encontrado = false
		let saltar = 0
		let etiqueta = input.substring(2, input.length-1)
		//log(input)

		totalSizePerLine.forEach((elemento)=>{
			if (encontrado == false){
				switch (typeof elemento){
					case 'number':
						saltar += elemento
					break;
					case 'string':
						if (elemento == etiqueta){
							encontrado = true
							//log(saltar)
							saltar = (0xFFFFFFFF - saltar + 1).toString(16).padStart(4, 0).toUpperCase()
							//log(saltar)
						}
					break;
				}
			}
		})
		if (encontrado == false) {
			alert("No se encontro la etiqueta de punto de salto: " +etiqueta+
				"\n- Revise si la escribio correctamente o si incluso la creeo.")
			return 'F3FFFFFF'
		}

		return saltar.toBigEndian()
	})

	return codeOfFinalDepurated
}
// 0001<@MAIN>0001<@MAIN>0001<@MAIN>
/*log(`0000: nop
create_thread 'example'
    :example
    wait 0 {ms}
    camera_shake 100 {ms}
    0001: wait 1000 ms
    0003: camera_shake 100 ms
    0001: wait 1000 ms
    jump @example
end_thread

set_lvar_int 30@ = 4763
set_lvar_float 0@ = 0.12

set_var_int $16 = 21
set_var_float $17 = 45.78`.Translate())
//*/


/** Compile and save code SCM of GTA SA
 * @param: String - Source code.
 * @param: String - Name file for can save.
 * @return: String - Preview of output code compiled.
*/
String.prototype.toCompileSCM = function(Name_File){
	if (Name_File.length == 0){
		alert ("E-00: Añada un nombre al archivo.");
		return
	}

	if(!Name_File.match(/\./)){
		alert ("E-01: Añada una extencion al archivo.");
		return
	}

	if (this.length == 0){
		alert ("E-02: Añada comandos al archivo.");
		return
	}

	let cleaned_hex = this.Translate();

	if (cleaned_hex.length % 2) {
		alert ("E-03: la longitud de la cadena hexadecimal limpiada es impar.");
		return;
	}

	let binary = new Array();
	for (let i=0; i<cleaned_hex.length/2; i++) {
		let h = cleaned_hex.substr(i*2, 2);
		binary[i] = parseInt(h,16);
	}

	let byteArray = new Uint8Array(binary);
	let a = window.document.createElement('a');

	a.href = window.URL.createObjectURL(new Blob([byteArray], { type: 'application/octet-stream' }));
	a.download = Name_File;

	// Append anchor to body.
	document.body.appendChild(a)
	a.click();

	// Remove anchor from body
	document.body.removeChild(a)

	return cleaned_hex
}