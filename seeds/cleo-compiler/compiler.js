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

const LS = {
	t : localStorage,
	get : (x) => LS.t.getItem(x),
	set : (x,y) => LS.t.setItem(x, y)
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
	LINT      : '00',
	LFLOAT    : '01',
	LSTRING8  : '02',
	LSTRING16 : '03',
	GINT      : '80',
	GFLOAT    : '81',
	GSTRING8  : '82',
	GSTRING16 : '83'
}

function fetchPercentece(response, background){
  const contentLength = response.headers.get('Content-Length');
  // Gets length in bytes (must be provided by server)
  let loaded = 0;
  // Will be used to track loading
  return new Response(
	new ReadableStream({
	// Creates new readable stream on the new response object
	  start(controller) {
	  // Controller has methods on that allow the new stream to be constructed
		const reader = response.body.getReader();
		// Creates a new reader to read the body of the fetched resources
		read();
		// Fires function below that starts reading
		function read() {
		  reader.read()
		  .then((progressEvent) => {
		  // Starts reading, when there is progress this function will fire
			if (progressEvent.done) {
			  controller.close();
			  return; 
			  // Will finish constructing new stream if reading fetched of resource is complete
			}
			loaded += progressEvent.value.byteLength;
			// Increase value of 'loaded' by latest reading of fetched resource
			const percentace = Math.round((loaded/contentLength)/120*1000)+'%'
			$('#state.loading').style = `background: linear-gradient(90deg, ${background} ${percentace}, transparent ${percentace});`
			//log(percentace)
			// Displays progress via console log as %
			controller.enqueue(progressEvent.value);
			// Add newly read data to the new readable stream
			read();
			// Runs function again to continue reading and creating new stream
		  })
		}
	  }
	})
  );
}

let CUSTOM_VARIABLES = await fetch('./data/CustomVariables.ini')
	.then(response => {
		return fetchPercentece(response, 'red')
  })

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
	.then(response => {
		return fetchPercentece(response, 'orange')
  })
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
	.then(response => {
		return fetchPercentece(response, 'yellow')
  })
MODELS = await MODELS.text()
LS.set('models', MODELS)
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
	.then(response => {
		return fetchPercentece(response, '#10a122')
  })

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

SP.binToDec = function() {
	let input = this.r('0b','')
  let sum = 0
  for (let i = 0; i < input.length; i++) {
	sum += +input[i] * 2 ** (input.length - 1 - i)
  }
  return sum
}

SP.hexToDec = function(){
	return parseInt(this, 16).toString()
}

const SYNTAX = {
  FOR: /^FOR (.+)=(.+) (todown|to) (.+)STEP(.+)/im,
  WHILE: /^WHILE (.+)/im,
  REPEAT: /^UNTIL (.+)/im,
  IF: /^IF (.+)/im
};

SP.parseHigthLevelIfs = function() {
    const lineas = this.split('\n');
    const etiquetas = [];
    let etiquetaCounter = 1;

    const codigoTransformado = lineas.map((linea) => {
        linea = linea.trim();
        if (/IF/i.test(linea)) {
            return linea.replace(/IF/gi, 'if');
        } else if (/THEN/i.test(linea)) {
            etiquetas.push(`label_${etiquetaCounter}`);
            etiquetaCounter++;
            return 'goto_if_false @' + etiquetas[etiquetas.length - 1];
        } else if (/ELSE/i.test(linea)) {
            const etiqueta = etiquetas.pop();
            const etiquetaElse = `label_${etiquetaCounter}`;
            etiquetaCounter++;
            etiquetas.push(etiquetaElse);
            return `goto @${etiquetaElse}\n:${etiqueta}`;
        } else if (/END/i.test(linea)) {
            const etiqueta = etiquetas.pop();
            return etiqueta ? ':' + etiqueta : 'END';
        }
        return linea;
    }).join('\n');

    return codigoTransformado;
}

SP.parseHigthLevelLoops = function (){
	const lines = this.split('\n');
	let outputText = '';
	let labelCount = 1;
	let labelCountQuit = 1;
	let ignoreBlock = 0
	const labelStack = [];
	const labelLoop = [];
	const labelQuitStack = [];
	const until = [];

	for (let i = 0; i < lines.length; i++) {
		let line = lines[i].trim();

		const label = `begin_loop_${labelCount}`;
		const labelQuit = `end_loop${labelCountQuit}`;

/*
		if (/^break/im.test(line)){
		  if (labelStack.length < 1) {
		    throw Error("no hay break")
		  }
			outputText += `goto @exit_${labelStack[labelStack.length > 0 ? labelStack.length-2: 0]}\n`;
		} else if (/^continue/im.test(line)){
		  outputText += 'goto @'+labelStack[labelStack.length-1]+'\n';
		}*/
		  
		if (/^then/im.test(line)) {
      labelStack.push(label);
      labelCount++;
      labelLoop.push('then');
      outputText += 'goto_if_false @' + labelStack[labelStack.length - 1]+'\n';
    } else if (/^else/im.test(line)) {
      const etiqueta = labelStack.pop();
      const etiquetaElse = `label_${labelCount}`;
      labelCount++;
      labelStack.push(etiquetaElse);
      outputText += `goto @${etiquetaElse}\n:${etiqueta}\n`;
    } else if (/^repeat/im.test(line)){
			outputText += `:${label} // begin-loop\n`;
			labelStack.push(label);
			labelLoop.push(line);
			labelCount++;
		} else if (/^while /im.test(line)) {
		  if (/^while true/im.test(line)){
			outputText += `:${label} // begin-loop\n`;
			labelStack.push(label);
			labelLoop.push(line);
		  } else if (/^while false/im.test(line)){
			ignoreBlock++;
			outputText += `goto @ignore_block_${ignoreBlock} // begin-loop\n`;
			labelStack.push(label);
			labelLoop.push(line);
		  } else {
			const values = line.match(SYNTAX.WHILE)
			labelQuitStack.push(labelQuit)
			outputText += `:${label} // begin-loop\nif\n${values[1]}\ngoto_if_false @${labelQuit}\n`;
			labelStack.push(label);
			labelLoop.push('while custom');
		  }
		  labelQuitStack.push(labelQuit)
		  labelCountQuit++
		  labelCount++;
		} else if (/^for /im.test(line)) {
			if (!SYNTAX.FOR.test(line)) {
			   throw new SyntaxError(`ALERTA!!\nBucle mal definido.\n>>> linea ${i} : ${line}`)
				break;
			}
			const values = line.match(SYNTAX.FOR);

			outputText +=
				`${values[1]} = ${values[2]}
:${label} // BEGIN loop(${label})
if
${values[1]} ${/down/i.test(values[3]) ? '<=' : '>='} ${values[4]}
goto_if_false @${labelQuit}
${values[1]} ${/down/i.test(values[3]) ? '-=' : '+='} ${values[5]}
`;

			labelStack.push(label);
			labelQuitStack.push(labelQuit)
			labelLoop.push('for');
			labelCount++;
			labelCountQuit++
		}
		
		else if (/^end/im.test(line)) {
			const prevLabel = labelStack.pop();
			const prevLoop = labelLoop.pop();
			const prevQuit = labelQuitStack.pop()
			//log({prevLabel, prevLoop, prevQuit});
			
			if (!prevLoop) {
				throw new SyntaxError(`ALERTA!!\nNo se encontro punto de redireccion.\n>>> linea ${i} : END`)
				break;
			}

			if (prevLoop == 'while true') {
				outputText += `goto @${prevLabel}\n:exit_${prevLabel} // end-loop\n`;
			} else if (prevLoop == 'while false') {
				outputText += `:ignore_block_${ignoreBlock}\n:exit_${prevLabel} // end-loop\n`;
			} else if (prevLoop == 'while custom') {
				outputText += `goto @${prevLabel}\n:${prevQuit}\n:exit_${prevLabel} // end-loop\n`;
				labelCountQuit++;
			}else if (prevLoop === 'for') {
				outputText += `goto @${prevLabel}\n:${prevQuit}\n:exit_${prevLabel} // end-loop\n`;
				labelCountQuit++;
			}else if (prevLoop == 'then'){
        outputText += `:${prevLabel}\n`;
			}
		} else if (SYNTAX.REPEAT.test(line)) {
			const prevLabel = labelStack.pop();
			const prevLoop = labelLoop.pop();
			const prevQuit = labelQuitStack.pop();
			
			if (!prevLoop) {
				throw new SyntaxError(`ALERTA!!\nNo se encontro punto de redireccion.\n>>> linea ${i} : UNTIL`)
				break;
			}

			if (prevLoop == 'repeat'){
			  const condicion = line.match(SYNTAX.REPEAT)[1]
			  outputText += `if\n${condicion}\ngoto_if_false @${prevLabel}\n`
			}
		} else {
			outputText += `${line}\n`;
		}
	}
	
	if (labelStack.length > 0) {
	  throw new SyntaxError(`ALERTA!!\nSe encontraron bucles sin cerrar.\n>>> pila [${labelLoop}]`)
	}
	//log(outputText)
	return outputText;
}

SP.addBreaksToLoops = function(){
    const lines = this.split('\n')
    let result = ''

    let loopBehin = null
    let loopEnd = null

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.includes('// begin-loop')) {
        loopBehin = line.slice(1)
        loopEnd = null
      }
      if (line.includes('// end-loop')) {
        loopBehin = null
        loopEnd = null
      } 
      
      if (/^continue$/im.test(line)) {
        if (!loopBehin) {
          result += '>>> ERROR: continue - not found loop init\n'
        }else{
          result += 'goto @'+loopBehin+'\n'
        }
      } else if (/^break$/im.test(line)) {
        if (!loopBehin) {
          result += '>>> ERROR: break -  not found loop init\n'
        }else {
          for (let s = i; s < lines.length; s++){
            const lineSearch = lines[s].trim()
          
            if (lineSearch.includes('// end-loop')) {
              loopEnd = lineSearch.slice(1)
              break;
            }
          }
          if (!loopEnd) {
            result += '>>> ERROR: break -  not found loop init\n'
          }else{
            result += 'goto @' + loopEnd + '\n'
          }
        }
      } else {
        result += line+'\n'
      }
    }
    //log(result)
    return result
}

SP.addNumbersToIfs = function() {
	let lineas = this.split('\n');
	let nLineas = ''
	let tReg = /^if .+/im
	
	lineas.forEach(line =>{
	  if (tReg.test(line)){
	    let vars = line.match(/^if (.+)/)
	    let cond = vars[1].trim()
	    if (!/^(and|or)$/im.test(cond)){
	      nLineas += 'if\n'+cond+'\n'
	    }else{
	      nLineas += line+'\n'
	    }
	  }else{
	    nLineas += line+'\n'
	  }
	})
	//log(nLineas)
  lineas = nLineas.split('\n')
  
	let real = 0
	let contador = 0;
	let iniciar = false
	let multiCondicion = false
	let numeros = [];

	for (const linea of lineas) {
		if (/^if .+/im.test(linea)) {
			iniciar = true
			real = 0
			contador = 0
			if (/(or|and)/i.test(linea)) {
				multiCondicion = true
				if (/or/i.test(linea)) {
					contador += 20;
				} else {
					contador += 1;
				}
			}
		} else if (/^(then|goto_if_false|else_jump)/im.test(linea)) {
		  //real--;
		  
			if (real > 0 && multiCondicion == false)
			 throw new Error('¡Error! El "if" debe ir seguido de "and" o "or".')
			  
			if (real > 8 && multiCondicion == true)
			  throw new Error('¡Este if tiene más de 8 líneas de texto!');
			
			contador += real > 0 ? real-1 :real
			numeros.push(contador);
			contador = 0;
			real = 0;
			iniciar = false
		} else {
		  if(iniciar){
			if (linea.trim() != '') {
				real++;
			}
		  }
		}
	}
	
	let number = 0
	let counter = 0
	for (const linea of lineas) {
		if (linea.startsWith('if')) {
		  if (/^if .+/im.test(linea)){
			const param = linea.match(/^if (.+)/im)
			lineas[counter] = 
			  "if "
			  +numeros[number]
			  +"\n"
			  +(param[1].replace(/^(and|or)/im, ''))
		  }else{
			lineas[counter] = linea +" "+numeros[number]
		  }
		  number++
		}
		counter++
	}
	
	//log(lineas.join('\n'))
	
	return lineas.join('\n');
}


SP.PrePost = function(){
	return this
		.r(/^(int )?(\$.+) = (\d+|#.+|0x.+|0b.+)$/gim, `0004: $2 $3`)									//0004: $CUSTOM_TOURNAMENT_FLAG = 0
		.r(/^(float )?(\$.+) = (\d+\.\d+|\.\d+|\d+f)$/gim, `0005: $2 $3`)							//0005: $166 = 292.33
		.r(/^(int )?(\d+@([^\s]+)?) = (\d+|#.+|0x.+|0b.+)$/gim, `0006: $2 $4`)				//0006: 0@ = -1
		.r(/^(float )?(\d+@([^\s]+)?) = (\d+\.\d+|\.\d+|\d+f)$/gim, `0007: $2 $4`)		//0007: 7@ = 0.0
		.r(/^(int )?(\$.+) \+= (\d+|#.+|0x.+|0b.+)$/gim, `0008: $2 $3`)								//0008: $89 += 1
		.r(/^(float )?(\$.+) \+= (\d+\.\d+|\.\d+|\d+f)$/gim, `0009: $2 $3`)						//0009: $TEMPVAR_FLOAT_1 += 1.741
		.r(/^(int )?(\d+@([^\s]+)?) \+= (\d+|#.+|0x.+|0b.+)$/gim, `000A: $2 $4`)			//000A: 3@ += 3000
		.r(/^(float )?(\d+@([^\s]+)?) \+= (\d+\.\d+|\.\d+|\d+f)$/gim, `000B: $2 $4`)	//000B: 6@ += 0.1
		.r(/^(int )?(\$.+) \-= (\d+|#.+|0x.+|0b.+)$/gim, `000C: $2 $3`)								//000C: $1020 -= 1
		.r(/^(float )?(\$.+) \-= (\d+\.\d+|\.\d+|\d+f)$/gim, `000D: $2 $3`)						//000D: $TEMPVAR_Z_COORD -= 0.5
		.r(/^(int )?(\d+@([^\s]+)?) \-= (\d+|#.+|0x.+|0b.+)$/gim, `000E: $2 $4`)			//000E: 0@ -= 1
		.r(/^(float )?(\d+@([^\s]+)?) \-= (\d+\.\d+|\.\d+|\d+f)$/gim, `000F: $2 $4`)	//000F: 692@ -= 8.0
		.r(/^(int )?(\$.+) \*= (\d+|#.+|0x.+|0b.+)$/gim, `0010: $2 $3`)								//0010: $GS_GANG_CASH *= 100
		.r(/^(float )?(\$.+) \*= (\d+\.\d+|\.\d+|\d+f)$/gim, `0011: $2 $3`)						//0011: $HJ_TEMP_FLOAT *= 100.0
		.r(/^(int )?(\d+@([^\s]+)?) \*= (\d+|#.+|0x.+|0b.+)$/gim, `0012: $2 $4`)			//0012: 22@ *= -1
		.r(/^(float )?(\d+@([^\s]+)?) \*= (\d+\.\d+|\.\d+|\d+f)$/gim, `0013: $2 $4`)	//0013: 17@ *= 9.8
		.r(/^(int )?(\$.+) \/= (\d+|#.+|0x.+|0b.+)$/gim, `0014: $2 $3`)								//0014: $HJ_TWOWHEELS_TIME /= 1000
		.r(/^(float )?(\$.+) \/= (\d+\.\d+|\.\d+|\d+f)$/gim, `0015: $2 $3`)						//0015: $EXPORT_PRICE_HEALTH_MULTIPLIER /= 1000.0
		.r(/^(int )?(\d+@([^\s]+)?) \/= (\d+|#.+|0x.+|0b.+)$/gim, `0016: $2 $4`)			//0016: 4@ /= 2
		.r(/^(float )?(\d+@([^\s]+)?) \/= (\d+\.\d+|\.\d+|\d+f)$/gim, `0017: $2 $4`)	//0017: 14@ /= 1000.0

		.r(/^(int )?(\$.+) > (\d+|#.+|0x.+|0b.+)$/gim, `0018: $2 $4`)									//0018:   $CATALINA_TOTAL_PASSED_MISSIONS > 2
		.r(/^(int )?(\d+@([^\s]+)?) > (\d+|#.+|0x.+|0b.+)$/gim, `0019: $2 $4`)				//0019:   0@ > 0
		.r(/^(int )?(\d+|#.+|0x.+|0b.+) > (\$.+)$/gim, `001A: $2 $4`)									//001A:   10 > $SYNDICATE_TOTAL_PASSED_MISSIONS
		.r(/^(int )?(\d+|#.+|0x.+|0b.+) > (\d+@([^\s]+)?)$/gim, `001B: $2 $4`)				//001B:   3 > 20@
		.r(/^(int )?(\$.+) > (\$.+)$/gim, `001C: $2 $4`)															//001C:   $CURRENT_MONTH_DAY > $GYM_MONTH_DAY_WHEN_LIMIT_REACHED // (int)
		.r(/^(int )?(\d+@([^\s]+)?) > (\d+@([^\s]+)?)$/gim, `001D: $2 $4`)						//001D:   27@ > 33@  // (int)
		.r(/^(int )?(\$.+) > (\d+@([^\s]+)?)$/gim, `001E: $2 $4`)											//001E:   $CURRENT_TIME_IN_MS2 > 3@ // (int)
		.r(/^(int )?(\d+@([^\s]+)?) > (\$.+)$/gim, `001F: $2 $4`)											//001F:   9@ > $GIRL_PROGRESS[0] // (int)
		.r(/^(float )?(\$.+) > (\d+\.\d+|\.\d+|\d+f)$/gim, `0020: $2 $4`)							//0020:   $HJ_TWOWHEELS_DISTANCE_FLOAT > 0.0
		.r(/^(float )?(\d+@([^\s]+)?) > (\d+\.\d+|\.\d+|\d+f)$/gim, `0021: $2 $4`)		//0021:   26@ > 64.0
		.r(/^(float )?(\d+\.\d+|\.\d+|\d+f) > (\$.+)$/gim, `0022: $2 $4`)							//0022:   -180.0 > $1316
		.r(/^(float )?(\d+\.\d+|\.\d+|\d+f) > (\d+@([^\s]+)?)$/gim, `0023: $2 $4`)		//0023:   0.0 > 7@
		.r(/^(float )?(\$.+) > (\$.+)$/gim, `0024: $2 $4`)														//0024:   $HJ_CAR_Z > $HJ_CAR_Z_MAX // (float)
		.r(/^(float )?(\d+@([^\s]+)?) > (\d+@([^\s]+)?)$/gim, `0025: $2 $4`)					//0025:   3@ > 6@  // (float)
		.r(/^(float )?(\$.+) > (\d+@([^\s]+)?)$/gim, `0026: $2 $4`)										//0026:   $TEMPVAR_FLOAT_1 > 513@(227@,10f)  // (float)
		.r(/^(float )?(\d+@([^\s]+)?) > (\$.+)$/gim, `0027: $2 $4`)										//0027:   513@(227@,10f) > $TEMPVAR_FLOAT_2 // (float)

		.r(/^(int )?(\$.+) < (\d+|#.+|0x.+|0b.+)$/gim, `8018: $2 $4`)									//8018:   $CATALINA_TOTAL_PASSED_MISSIONS < 2
		.r(/^(int )?(\d+@([^\s]+)?) < (\d+|#.+|0x.+|0b.+)$/gim, `8019: $2 $4`)				//8019:   0@ < 0
		.r(/^(int )?(\d+|#.+|0x.+|0b.+) < (\$.+)$/gim, `801A: $2 $4`)									//801A:   10 < $SYNDICATE_TOTAL_PASSED_MISSIONS
		.r(/^(int )?(\d+|#.+|0x.+|0b.+) < (\d+@([^\s]+)?)$/gim, `801B: $2 $4`)			