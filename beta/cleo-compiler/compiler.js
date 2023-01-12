'use strict';
// Tab Size: 4

const 	log = x  => console.log(x),
		sleep = ms => new Promise(resolve => setTimeout(resolve, ms)),

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
	let result = []

	this.forEach((e) => {
		if(!e=='') result.push(e)
	})

	return result
}

const TYPE_CODE = {
	TERMINAL_NULL		:'00',
	INT32				:'01',
	GVAR				:'02',
	LVAR				:'03',
	INT8				:'04',
	INT16				:'05',
	FLOAT32				:'06',
	GVAR_ARRAY			:'07',
	LVAR_ARRAY			:'08',
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

const ELEMENT_TYPE = {
	INT      : '00',
	FLOAT    : '01',
	STRING8  : '02',
	STRING16 : '03'
}

const LS = {
	t : localStorage,
	get : (x) => LS.t.getItem(x),
	set : (x,y) => LS.t.setItem(x, y)
}

let CUSTOM_VARIABLES = await fetch('./data/CustomVariables.ini')
CUSTOM_VARIABLES = await CUSTOM_VARIABLES.text()
CUSTOM_VARIABLES = CUSTOM_VARIABLES
	.r(/;.+/g,'')
	.r(/\r/g,'\n')
	.split('\n')
	.clear()
CUSTOM_VARIABLES.forEach((l,i)=>{
	CUSTOM_VARIABLES[i] = l.r(/(.+)=(.+)/,'$2=$1').toUpperCase().split('=')
})
CUSTOM_VARIABLES = Object.fromEntries(CUSTOM_VARIABLES)
//log(CUSTOM_VARIABLES)

let CONSTANTS = await fetch('./data/constants.txt')
CONSTANTS = await CONSTANTS.text()
CONSTANTS = CONSTANTS
	.r(/(^const|end$)/gm, '')
	.r(/\r/g, '\n')
	.r(/^[\x20\t]+/gm, '')
	.r(/(\x20+)?=(\x20+)?/g, '=')
	.toUpperCase()
	.split('\n')
	.clear()
CONSTANTS.forEach((e,i) => CONSTANTS[i] = e.split('='))
CONSTANTS = Object.fromEntries(CONSTANTS)
//log(CONSTANTS)

let MODELS = await fetch('./data/models.ide')
MODELS = await MODELS.text()
MODELS = MODELS
	.r(/\r/g,'')
	.r(/(\d+) (.+)/g, '$2 $1')
	.toUpperCase()
	.split('\n')
	.clear()
MODELS.forEach((e,i) => MODELS[i] = e.split(' '))
MODELS = Object.fromEntries(MODELS)

let SCM_DB = {}
async function dbSBL(game){
	let DATA_DB = await fetch(`https://raw.githubusercontent.com/sannybuilder/library/master/${game}/${game}.json`)
	DATA_DB = await DATA_DB.json()
	DATA_DB.extensions.forEach(extension =>{
		//log(extension.name)
		extension.commands.forEach((command, c) =>{
			//if (c < 2) {
				if (command.attrs){
					if (command.attrs.is_unsupported == undefined){
						SCM_DB[command.name.toLowerCase()] = {
							opcode : command.id.toLowerCase(),
							params : []
						}
						//log(command.input)// is (array || undefined)

						if (command.input) {
							command.input.forEach(param =>{
								SCM_DB[command.name.toLowerCase()].params.push(param.type.toLowerCase())
							})
						}
					}
				}
				else{
					SCM_DB[command.name.toLowerCase()] = {
						opcode : command.id.toLowerCase(),
						params : []
					}
					if (command.input) {
						command.input.forEach(param =>{
							SCM_DB[command.name.toLowerCase()].params.push(param.type.toLowerCase())
						})
					}
				}
			//}
		})
	})
	return true
}


const $IDE_mode = $('#mode')
if (LS.get('Compiler/IDE:mode') == null) LS.set('Compiler/IDE:mode', 'sa')
$IDE_mode.value = LS.get('Compiler/IDE:mode')
await dbSBL(LS.get('Compiler/IDE:mode'))

let game = LS.get('Compiler/IDE:mode')
await dbSBL(game)

let version = await fetch(`https://raw.githubusercontent.com/sannybuilder/library/master/${game}/version.txt`)
version = await version.text()
$('#version_sbl').innerHTML = 'SBL ' + version

//await sleep(1000)
//log(SCM_DB)

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

SP.toUnicode = function() {
  return this.split("").map(s => {
    return `${s.charCodeAt(0).toString(16).padStart(2, '0')}`;
  }).join("-");
}
SP.Translate = function(_SepareWithComes = false){
	const come = a => {
		if (_SepareWithComes){
			return a + ','
		}
		return a
	}

	let codeDepurated = []
	let totalSizePerLine = []
	
	if (this.match(/[^\w\d]("([^"\n]+)?)(\x20)(([^"\n]+)?")[^\w\d]/)
		|| this.match(/[^\w\d]('([^'\n]+)?)(\x20)(([^'\n]+)?')[^\w\d]/)
		|| this.match(/[^\w\d](`([^`\n]+)?)(\x20)(([^`\n]+)?`)[^\w\d]/)) {
		log('NO ADD SPACES IN STRINGS')
		return
	}

	let LineComand = this
		.r(/^not /m, '!')
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
					if (/^[a-z_]+$/mi.test(Argument)){
						LineComand[numLine][numArgument] = CONSTANTS[Argument.toUpperCase()] || ''
					}
					if (/^[!=+\-/*%\^]+$/mi.test(Argument)) {
						LineComand[numLine][numArgument] = ''
					}
				}
			})
			LineComand[numLine] = LineComand[numLine].clear()
			//log(LineComand)

			//log(LineComand[numLine])

			LineComand[numLine].forEach((Argument, numArgument) => {
				if (numArgument == 0) { // command
					Argument = Argument.toLowerCase()
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

						if (isNegative){
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

						if (SCM_DB[Argument]){
							setOp = SCM_DB[Argument].opcode
						}else{
							//log(`KEYWORD UNDEFINED: ${Argument}\nCHANGED TO 0000: nop`)
							setOp = '0000'
						}

						if (isNegative){
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

					let foundType = false
					const TYPES = ['any','int','float','lvar','gvar','var_any','short','long','label','bool']
					TYPES.forEach(a => {
						if (foundType == false && a == typeData){
							foundType = true
						}
					})
					if (foundType == false) typeData = 'any';

					if (typeData == 'any'){
						//log({typeData, Argument})
						if (/^[\d#\-]/m.test(Argument))
							typeData = /[.f]/.test(Argument) ? 'float' : 'int';
						if (/^@/m.test(Argument))
							typeData = 'label';
						if (/^\d@([ifsv])?/m.test(Argument))
							typeData = 'lvar';
						if (/^([ifsv])?[$&]./m.test(Argument))
							typeData = 'gvar';
						if (/^'/m.test(Argument))
							typeData = 'short';
						if (/^["`]/m.test(Argument))
							typeData = 'long';
						//log({typeData, Argument})
					}
					if (typeData == 'var_any'){
						typeData = /^\d@([ifsv])?/m.test(Argument) ? 'lvar' : 'gvar';
					}
					if (typeData != 'short' && Argument[0] == "'") typeData = 'short';
					if (typeData != 'long' && Argument[0] == '"' || Argument[0] == "`") typeData = 'long';
					if (typeData != 'int' && Argument[0] == '#' || typeData == 'bool') typeData = 'int';
					if (typeData == 'int' || typeData == 'float'){
						if (/\@/.test(Argument)) typeData = 'lvar';
						if (/[$&]/.test(Argument)) typeData = 'gvar';
					}

					switch (typeData) {
						case 'short':
							Argument = /'(.+)'/.test(Argument) ? Argument.r(/'(.+)'/, '$1') : '\x00'
							Argument = Argument.substring(0,7)
							totalSizePerLine.push(9)

							Argument = (come(TYPE_CODE.STRING8) + Argument.toUnicode() + '-00').padEnd(26,'-00')
						break;

						case 'long':
							Argument = Argument.r(/("(.+)"|`(.+)`)/, '$2$3')
							Argument = Argument.substring(0,255)

							totalSizePerLine.push(Argument.length + (SCM_DB[command].opcode[1] == '0' ? 2 : 1))
							Argument = (come(TYPE_CODE.STRING_VARIABLE) + come(Argument.length.toString(16).padStart(2, '0')) + Argument.toUnicode()) + (SCM_DB[command].opcode[1] == '0' ? '00' : '')
							
							//log(SCM_DB[command].opcode)
							switch (SCM_DB[command].opcode){
								case '05b6' : 
									totalSizePerLine[totalSizePerLine.length - 1] = 128
									Argument = Argument.padEnd(260,'0')
								break;
								//case '0660':
								//case '0661':
								//case '0662':
								//break;
							}
							/*
							Argument = Argument.r(/('(.+)'|"(.+)")/, '$2$3')
							Argument = Argument.substring(0,255)

							let ArgumentLength = Argument.length
							let ArgumentTranslate = Argument.toUnicode()
							let ArgumentLengthTranslate = ArgumentTranslate.length

							log({Argument, ArgumentLength, ArgumentTranslate, ArgumentLengthTranslate})
							
							totalSizePerLine.push(Argument.length + 2)
							Argument = (come(TYPE_CODE.STRING_VARIABLE) + come(Argument.length.toString(16).padStart(2, '0')) + Argument.toUnicode()) + '00'
							//}
						*/
						break;

						case 'int':
							Argument = Argument
								.r(/^(-)?0x.+/mi, hex => {
									return parseInt(hex, 16).toString()
								})
								.r(/^#.+/m, model =>{
									return MODELS[model.r('#','').toUpperCase()] || '-1'
									//log(Argument)
								})

							let byte1   = 0x7F       // 127
							let byte1R  = 0xFF
							let byte2   = 0x7FFF     // 32767
							let byte2R  = 0xFFFF
							let byte4   = 0x7FFFFFFF // 2147483647
							let byte4R  = 0xFFFFFFFF

							let dataType;

							if (0 <= Argument) {
								if (Argument <= byte4) dataType = come(TYPE_CODE.INT32);
								if (Argument <= byte2) dataType = come(TYPE_CODE.INT16);
								if (Argument <= byte1) dataType = come(TYPE_CODE.INT8);
							}
							else {
								//Argument *= -1

								if (IsInRange(Argument, -(byte1+=2), 0)) {
									dataType = come(TYPE_CODE.INT8);
								}
								if (IsInRange(Argument, -(byte2+=2), -byte1)) {
									dataType = come(TYPE_CODE.INT16);
								}
								if (IsInRange(Argument, -(byte4+=2), -byte2)) {
									dataType = come(TYPE_CODE.INT32);
								}

								Argument *= -1
								switch (dataType){
									case come(TYPE_CODE.INT8) :
										Argument -= byte1R;
										break;

									case come(TYPE_CODE.INT16) :
										Argument -= byte2R;
										break;

									case come(TYPE_CODE.INT32) :
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
									case come(TYPE_CODE.INT8) :
										temp = 2
										totalSizePerLine.push(1)
										break;

									case come(TYPE_CODE.INT16) :
										temp = 4
										totalSizePerLine.push(2)
										break;

									case come(TYPE_CODE.INT32) :
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

							Argument = come(TYPE_CODE.FLOAT32) + Number(Argument.r('f','')).toHex()
						break;

						case 'lvar':
							totalSizePerLine.push(2)

							Argument = 
								come(TYPE_CODE.LVAR) 
								+ Number(Argument.r(/@(i|f|s|v)?/,'')).toString(16)
									.padStart(4,'0')
									.toBigEndian();
						break;

						case 'gvar':
							if(/[\(\)]/.test(Argument)){ // is array
								//log(Argument)
								Argument = '<'+Argument+'>'
							}
							else {
								totalSizePerLine.push(2)

								if(/\$/.test(Argument)){
									Argument = Argument.r(/(i|f|s|v)?\$/,'')

									if (/\w/.test(Argument)){
										let coincide = false

										if (CUSTOM_VARIABLES[Argument.toUpperCase()] != undefined){
											coincide = CUSTOM_VARIABLES[Argument.toUpperCase()] * 4
										}

										if (!coincide){
											Argument = parseInt(Number(String(parseInt(Argument, 35)).substring(0, 4) / 2))
											if (Argument > 1000) Argument /= 5
											if (Argument > 500) Argument /= 2
											Argument = parseInt(Argument)
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

								Argument = come(TYPE_CODE.GVAR) + (
									Argument.toString(16)
									.substring(0, 4)
									.padStart(4,'0')
									.toBigEndian()
								)
							}
						break;

						case 'label':
							totalSizePerLine.push(4)

							Argument = come(TYPE_CODE.INT32) + `<${Argument}>`
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

	let codeOfFinal = (_SepareWithComes
						  ? codeDepurated.toString().r(/,,/g,',')
						  : codeDepurated.toString().r(/,/g,'').r(/\-/g,'')
					  ).r(/\./g,'').toUpperCase()

	let codeOfFinalDepurated = codeOfFinal.r(/<@([^<>]+)>/g, input => {
		let found = false
		let jump = 0
		let label = input.substring(2, input.length-1)
		//log(input)

		totalSizePerLine.forEach(element => {
			if (!found){
				switch (typeof element){
					case 'number':
						jump += element
					break;
					case 'string':
						if (element == label){
							found = true
							//log(jump)
							jump = (0xFFFFFFFF - jump + 1).toString(16).padStart(4, 0).toUpperCase()
							//log(jump)
						}
					break;
				}
			}
		})
		if (!found) {
			console.log("No se encontro la label de punto de salto: " +label+
				"\n- Revise si la escribio correctamente o si incluso la creeo.")
			return "<@"+label+">"
		}

		return jump.toBigEndian()
	})

	return codeOfFinalDepurated
}
// 0001<@MAIN>0001<@MAIN>0001<@MAIN>
/*log(`nop
start_new_script 'example'
    :example
    wait 0 ms
    shake_cam 100 {ms}
    0001: wait 1000 // ms
    0003: shake_cam 100 ms
    0001: wait 1000 ms
    goto @example
terminate_this_script`.Translate())
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

	let code_hex = this.Translate();

	if (code_hex.length % 2) {
		log(this.Translate())
		alert ("E-03: la longitud de la cadena hexadecimal es impar.");
		return;
	}

	let binary = new Array();
	for (let i=0; i<code_hex.length/2; i++) {
		let h = code_hex.substr(i*2, 2);
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

	return code_hex
}

const $SBL_State = $('#state')
if ($SBL_State){
	const c = $SBL_State.classList
	$SBL_State.innerText = 'Okey'
	c.remove('loading')

	$('#HEX').select()
	$('#OUTHEX').value = $('#HEX').value.Translate(true)

	$IDE_mode.onchange = async function(){
		$SBL_State.innerText = 'Loading...'
		c.add('loading')
		LS.set('Compiler/IDE:mode', $IDE_mode.value)
		
		game = LS.get('Compiler/IDE:mode')
		await dbSBL(game)

		version = await fetch(`https://raw.githubusercontent.com/sannybuilder/library/master/${game}/version.txt`)
		version = await version.text()
		
		$('#version_sbl').innerHTML = 'SBL ' + version
		$SBL_State.innerText = 'Okey'
		c.remove('loading')
	}
}