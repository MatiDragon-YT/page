const PREVENTION = 0
function log(x){console.log(x)}

const SP = String.prototype

Array.prototype.Clear = function(){
	this.forEach((e,i) => {
		if(e=='')this.splice(i,1)
	})
	return this
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

SP.ToBigEndian = function(){
	let newResult = ''
	let result = this
		.split(/([a-f0-9]{2})/i)
		.Clear()
		.forEach(e => newResult = e + newResult)
	return newResult.toUpperCase()
}

Number.prototype.ToHex = function(){
	const getHex = i => ('00' + i.toString(16)).slice(-2);

	let view = new DataView(new ArrayBuffer(4)),
	    result;

	view.setFloat32(0, this);

	result = Array
	    .apply(null, { length: 4 })
	    .map((_, i) => getHex(view.getUint8(i)))
	    .join('');

	return result.ToBigEndian().toUpperCase()
}

function IsInRange(VAR, MIN, MAX){
	return (VAR >= MIN && VAR <= MAX) ? 1 : 0;
}

const TypeCode = {
	Null				:'00',
	EndArgument			:'00',
	Int32				:'01',
	Global				:'02',
	Local				:'03',
	Int8				:'04',
	Int16				:'05',
	Float32				:'06',
	GlobalArrayOffset	:'07',
	LocarArrayIndex		:'08',
	String8				:'09',
	GlobalVarString8	:'0A',
	LocarVarString8		:'0B',
	GlobalArrayString8	:'0C',
	LocarArrayString8	:'0D',
	StringVariable		:'0E',
	String16			:'0F',
	GlobalVarString16	:'10',
	LocarVarString16	:'11',
	GlobalArrayString16	:'12',
	LocarArrayString16	:'13'
}

function TranslateSCM(INPUT_CODE){
	console.time('Compiled in time')

	INPUT_CODE = INPUT_CODE
		// se borran los comentarios
		.replace(/(\n+)?(\/\/[^\n]+)/gm, '')
		.replace(/(\n+)?(\/\*[^\/]*\*\/)/gmi, '')
		.replace(/(\n+)?(\{[^\$][^\{\}]*\})/gmi, '')

	if (INPUT_CODE.match(/(".+\x20.+"|'.+\x20.+')/)){
		log('!!!!!!!!!!!!!!!!!!!!!!!!!\nNOT ADD SPACES AT STRINGS\n!!!!!!!!!!!!!!!!!!!!!!!!!\n')
		return void(0)
	}

	//log(INPUT_CODE)

	const strAsUnicode = str => {
	  return str.split("").map(s => {
	    return `${s.charCodeAt(0).toString(16).padStart(2, '0')}`;
	  }).join("");
	}

	const SCM_DATABASE = {
		//  opcode, parametros
		'NADA' : [
			'0000', 0
		],
		'DETENER' : [
			'0001',['int']
		],
		'AGITAR_CAMARA' : [
			'0003',['int']
		],
		'SET_LVAR_FLOAT':[
			'0007',['lvfloat','float']
		],
		'CREAR_HILO' : [
			'03A4',['short']
		],
		'PARAR_HILO' : [
			'004E',0
		],
		'TEST__SHORT' : [
			'FFF1',['short']
		],
		'TEST__LONG' : [
			'FFF2',['long']
		],
		'TEST__INT' : [
			'FFF3',['int']
		],
		'TEST__LVAR' : [
			'FFF3',['int']
		],
		'TEST__GVAR' : [
			'FFF3',['int']
		]
	}

	// eliminamos espaciados innecesarios
	INPUT_CODE = INPUT_CODE.replace(/^\n/gm,'').replace(/\n+/gm,'\n').replace(/\n$/gm,'')//.replace(/$/gm, ' ')

	//log(INPUT_CODE)


	INPUT_CODE = INPUT_CODE.split('\n') // se divide el codigo de entrada por lineas, para trabajarlas de una en una

	INPUT_CODE.forEach((line_code,i) => {
		//log({line_code,i})
		
		INPUT_CODE[i] = INPUT_CODE[i].split(/\x20/) // de divide la linea por espacios para determinar los parametros

		log(INPUT_CODE[i])

		if (INPUT_CODE[i].length > 1){

			INPUT_CODE[i].forEach((parameter,index)=>{
				if (index > 0){
					if(SCM_DATABASE[INPUT_CODE[i][0]].length > 1){
						//log(SCM_DATABASE[INPUT_CODE[i][0]][1])
						SCM_DATABASE[INPUT_CODE[i][0]][1].forEach((iParam, iIndex) => {
							
							if(iParam == 'short'){
								parameter = parameter.replace(/'(.+)'/, '$1')
								parameter = (TypeCode.String8 + strAsUnicode(parameter) ).toUpperCase() + TypeCode.EndArgument
								while(parameter.length < 18){
									parameter += TypeCode.Null
								}
								INPUT_CODE[i][index] = parameter
							}

							if(iParam == 'long'){
								parameter = parameter.replace(/"(.+)"/, '$1')
								if (parameter.length < 15){
									parameter = (TypeCode.String16 + strAsUnicode(parameter) ).toUpperCase() + TypeCode.EndArgument
									while(parameter.length < 32){
										parameter += TypeCode.Null
									}
								}else{
									parameter = (TypeCode.StringVariable + parameter.length + strAsUnicode(parameter) ).toUpperCase()
								}
								INPUT_CODE[i][index] = parameter
							}

							if(iParam == 'string'){
								parameter = parameter.replace(/('(.+)'|"(.+)")/, '$2$3')
								parameter = (TypeCode.StringVariable + parameter.length + strAsUnicode(parameter) ).toUpperCase()
								INPUT_CODE[i][index] = parameter
							}

							if(iParam == 'int'){
								parameter.replace(/^0x.+/mi, hex => {
									return parseInt(hex, 16)
								})

								let byte1   = 0x7F       // 127
								let byte1R  = 0xFF
								let byte2   = 0x7FFF     // 32767
								let byte2R  = 0xFFFF
								let byte4   = 0x7FFFFFFF // 2147483647
								let byte4R  = 0xFFFFFFFF

								let dataType;

								if (0 <= parameter) {
									if (parameter <= byte4) dataType = TypeCode.Int32;
									if (parameter <= byte2) dataType = TypeCode.Int16;
									if (parameter <= byte1) dataType = TypeCode.Int8;
								} else {
									//parameter *= -1

									if (IsInRange(parameter, -(byte1+=2), 0)) {
										dataType = TypeCode.Int8;	
									}
									if (IsInRange(parameter, -(byte2+=2), -byte1)) {
										dataType = TypeCode.Int16;
									}
									if (IsInRange(parameter, -(byte4+=2), -byte2)) {
										dataType = TypeCode.Int32;
									}

									parameter *= -1
									switch (dataType){
										case TypeCode.Int8 :
											parameter -= byte1R;
											break;

										case TypeCode.Int16 :
											parameter -= byte2R;
											break;

										case TypeCode.Int32 :
											parameter -= byte4R;
											break;

										default: break;
									}
									parameter *= -1
									parameter++;
								}
								parameter = Number(parameter).toString(16).padStart((()=>{
									let temp
									switch (dataType){
										case TypeCode.Int8 :
											temp = 2
											break;

										case TypeCode.Int16 :
											temp = 4
											break;

										case TypeCode.Int32 :
											temp = 8
											break;

										default: break;
									}
									return temp
								})(), '0').toUpperCase()

								parameter = parameter.split(/([\d\w]{2})/)

								//log(parameter)
								parameter = (parameter[7]||'') + (parameter[5]||'') + (parameter[3]||'') + (parameter[1]||'')
								
								//log(parameter)

								INPUT_CODE[i][index] = dataType + parameter
							}

							/*
							const IsParam = {
								Float : (x) => {
									return /\d?(\d+).\d?(\d+)(?!@)/.test(x)
								},
								LVar : (x) => {
									return /@/.test(x)
								}
							}

							if(IsParam.Float(INPUT_CODE[i][index])){
								INPUT_CODE[i][index] = TypeCode.Float32 + Number(parameter).ToHex()	
								
							}
							//['lvfloat','float']
							if(IsParam.LVar(INPUT_CODE[i][index])){
								parameter = 
									TypeCode.Local 
									+ Number(parameter.r('@','')).toString(16)
										.padStart(4,'0')
										.ToBigEndian()

								INPUT_CODE[i][index] = parameter
							}
							*/
							//log({iParam,iIndex,parameter,k:INPUT_CODE[i][index],index,i})
								
						})
					}
				}
			})
			
		}


		INPUT_CODE[i][0] = SCM_DATABASE[INPUT_CODE[i][0]][0] // cambia las palabras claves por los opcodes

		let a = INPUT_CODE[i][0].split(/([\d\w]{2})/) // se divide el numero de opcodes en 2, para que la parte
		INPUT_CODE[i][0] = a[3] + a[1] 				  // el frontal se invierta por la trasera
	})

	if (PREVENTION == 1){
		INPUT_CODE = '0000,' + INPUT_CODE + ',4E00'
	}
	log('\n'+INPUT_CODE)

	let OUTPUT_CODE = INPUT_CODE.toString().replace(/,/g,'')
	//log('\nCodeParsed:\n'+OUTPUT_CODE)
	console.timeEnd('Compiled in time')
	return OUTPUT_CODE
}
/*
TranslateSCM(`
//CREAR_HILO 'caca'
NADA
DETENER 0 {ms}
AGITAR_CAMARA 100 {ms}
DETENER 1000 {ms}
AGITAR_CAMARA 100 {ms}
DETENER 1000 {ms}
AGITAR_CAMARA 100 {ms}
PARAR_HILO
`)


//log('\nCodeOriginal:\na4030963616361000000000000010004000300042800004e00'.toUpperCase())
//*/