function IsInRange(VAR, MIN, MAX){
	if (VAR >= MIN && VAR <= MAX) return 1;
	return 0
}

function log(x){console.log(x)}

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
								parameter = parameter.replace(/('(.+)'|"(.+)")/, '$2$3')
								parameter = ('09' + strAsUnicode(parameter) ).toUpperCase() + '00'
								while(parameter.length < 18){
									parameter += '00'
								}
								INPUT_CODE[i][index] = parameter
							}

							if(iParam == 'long'){
								parameter = parameter.replace(/('(.+)'|"(.+)")/, '$2$3')
								if (parameter.length < 15){
									parameter = ('0F' + strAsUnicode(parameter) ).toUpperCase() + '00'
									while(parameter.length < 32){
										parameter += '00'
									}
								}else{
									parameter = ('0E' + parameter.length + strAsUnicode(parameter) ).toUpperCase()
								}
								INPUT_CODE[i][index] = parameter
							}

							if(iParam == 'int'){
								parameter.replace(/^0x.+/mi, hex => {
									return parseInt(hex, 16)
								})

								let bit1   = 0x7F       // 127
								let bit1R  = 0xFF
								let bit2   = 0x7FFF     // 32767
								let bit2R  = 0xFFFF
								let bit4   = 0x7FFFFFFF // 2147483647
								let bit4R  = 0xFFFFFFFF

								let dataType;

								if (0 <= parameter) {
									if (parameter <= bit4) dataType = '01';
									if (parameter <= bit2) dataType = '05';
									if (parameter <= bit1) dataType = '04';
								}
								else {
									//parameter *= -1

									if (IsInRange(parameter, -(bit1+=2), 0)) {
										dataType = '04';	
									}
									if (IsInRange(parameter, -(bit2+=2), -bit1)) {
										dataType = '05';
									}
									if (IsInRange(parameter, -(bit4+=2), -bit2)) {
										dataType = '01';
									}

									parameter *= -1
									switch (dataType){
										case '04' :
											parameter -= bit1R;
											break;

										case '05' :
											parameter -= bit2R;
											break;

										case '01' :
											parameter -= bit4R;
											break;

										default: break;
									}
									parameter *= -1
									parameter++;
								}
								parameter = Number(parameter).toString(16).padStart((()=>{
									let temp
									switch (dataType){
										case '04' :
											temp = 2
											break;

										case '05' :
											temp = 4
											break;

										case '01' :
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

						})
					}
				}
			})
			
		}


		INPUT_CODE[i][0] = SCM_DATABASE[INPUT_CODE[i][0]][0] // cambia las palabras claves por los opcodes

		let a = INPUT_CODE[i][0].split(/([\d\w]{2})/) // se divide el numero de opcodes en 2, para que la parte
		INPUT_CODE[i][0] = a[3] + a[1] 				  // el frontal se invierta por la trasera
	})

	log('\n'+INPUT_CODE)

	let OUTPUT_CODE = INPUT_CODE.toString().replace(/,/g,'')
	//log('\nCodeParsed:\n'+OUTPUT_CODE)
	console.timeEnd('Compiled in time')
	return OUTPUT_CODE
}

/*
TranslateSCM(`
CREAR_HILO 'caca'
NADA
// noop
DETENER 0
AGITAR_CAMARA 40
NADA
PARAR_HILO
`)

log('\nCodeOriginal:\na4030963616361000000000000010004000300042800004e00'.toUpperCase())
*/