'use strict';
// Author: MatiDragon.
// Helpers: Seemann, Miran.

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
String.prototype.i = function(text, _number){
	return this.includes(text, _number)
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

/** Remove elements of a array what is same to ''.
*/
AP.last = function(pos = 0){
	return this[this.length - 1 - pos]
}

// Para insertar cualquier dato, antes se coloca
//   uno de estos codigos para saber como se debe
//   leer, cada parametro siguiente. Sino se define
//   el juego interpretara que es un OPCODE.
const TYPE_CODE = {
	TERMINAL_NULL		:'00',
	INT32				:'01',
	GVAR				:'02',
	LVAR				:'03',
	INT8				:'04', // INT del -128 hasta el 127
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
// Algo asi es como se traduce:
//
//               0001: wait 0
//              /            \
//            0100     04     00
//            \__/     \/     \/
//           opcode   type   value
//
// Todos los numeros se tienen que escribir en
//   big-endian, esto significa que el orden del los
//   hexadecimales van de izquierda a derecha.
//
//           X 00-01   -->   V 01-00
//
// Si el opcode tiene mas de un parametro, se pone
//   de nuevo el type y despues el value.
//
//               0004: 7@ = 15
//              /      |      \
//            0400 03 0700  04 0F
//            \__/  | \__/  |  \/
//           opcode | lvar  |  int
//                type     type



// Para crear la estructura del tipado de un Array
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

/*
         0006: 1@(2@, 123i) = 1
    ____/   ___/  \__  | \     \
    0600 08 0100 0200 7B 00 04 01
    \__/  | \__/ \__/  |  |  \   \
   opcode |  id   id   | lint \   \
     lvar_array      lenght  int8  num


         0007: 1@(2@, 123f) = 1.0
    ____/   ___/  \__  | \     \__________
    0700 08 0100 0200 7B 01 06 00 00 80 3F
    \__/  | \__/ \__/  |  |  \         |
   opcode |  id   id   |lfloat\        |
     lvar_array      lenght  float32  num


         05AA: 1@s(2@, 123s) = 'test'
    ____/   ___/  \__  | \     \______________________
    AA05 0D 0100 0200 7B 02 09 74 65 73 74 00 00 00 00
    \__/  | \__/ \__/  |  |  \            |
   opcode |  id   id   |lstr8 \           |
lvar_array_string8  lenght  string8     string


   op  @            l  $  values
  D206 13 0100 0200 7B 03 0E 04 74 65 73 74
  0600 08 0100 2803 7B 80 04 01
  0700 08 0100 2803 7B 81 06 00 00 80 3F
  AA05 0D 0100 2803 7B 82 09 74 65 73 74 00 00 00 00
  D206 13 0100 2803 7B 83 0E 04 74 65 73 74
       $               $
  0400 07 2C03 0200 7B 00 04 01
  0500 07 2C03 0200 7B 01 06 00 00 80 3F
  A905 0C 2C03 0200 7B 02 09 74 65 73 74 00 00 00 00
  D106 12 2C03 0200 7B 03 0E 04 74 65 73 74
       $               @
  0400 07 2C03 2803 7B 80 04 01
  0500 07 2C03 2803 7B 81 06 00 00 80 3F
  A905 0C 2C03 2803 7B 82 09 74 65 73 74 00 00 00 00
  D106 12 2C03 2803 7B 83 0E 04 74 65 73 74 
*/


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

let classes = LS.get('./data/classes.db')
if (!classes) {
  //let CUSTOM_CLASSES = await fetch('./data/classes.db')
  let CUSTOM_CLASSES = await fetch(`https://library.sannybuilder.com/assets/sa/classes.db`)
 .then(response => {
 	  return fetchPercentece(response, 'gray')
  })
  
  CUSTOM_CLASSES = await CUSTOM_CLASSES.text()
  classes = {}
  let addClass = false
  let currentClass = ''
  CUSTOM_CLASSES
  .r(/;(.+)?$/m, '')
  .split('\n')
  .clear()
  .forEach(line => {
    line = line.trim()
    if (line == '#CLASSESLIST'){
      addClass = true
    } else if (line == '#CLASSES') {
      addClass = false
    } else if (line == '#EOF'){
      addClass = true
    } else {
      if (addClass == true) {
        classes[line] = {
          
        }
      } else {
        if (/^\$.+/m.test(line)) {
          if (line.toLowerCase() != '$begin'
            && line.toLowerCase() != '$end'
          ){
            currentClass = line.match(/^\$(.+)/m)[1]
          }
        }else{
          if (/([^,]+),([^,]+)/.test(line)){
          let temp =
            line.match(/([^,]+),([^,]+)/)
            
          let miember = {}
          miember[temp[1]] = temp[2]
          
           // log(temp)
          classes[currentClass] = { ...classes[currentClass],  ...miember}
        }}
      }
    }
  })
  LS.set('./data/classes.db', JSON.stringify(classes))
}else{
  classes = JSON.parse(classes)
}
//log(classes)

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
	.r(/[\x20\t]+\n/g, '\n')
	.r(/^[\x20\t]+/gm, '')
	.r(/(\x20+)?=(\x20+)?/g, '=')
	.toUpperCase()
	.split('\n')
	.clear()
CONSTANTS.forEach((e,i) => CONSTANTS[i] = e.split('='))
CONSTANTS = Object.fromEntries(CONSTANTS)
//log(CONSTANTS)

let MODELS = LS.get('MODELS') || await fetch('./data/models.ide')
	.then(response => {
		return fetchPercentece(response, 'yellow')
  })
if (typeof MODELS != 'string'){
  MODELS = await MODELS.text()
  LS.set('MODELS', MODELS)
}
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
  let DATA_DB = LS.get("DB_"+game)
  if (!DATA_DB){
	  DATA_DB = await fetch(`https://raw.githubusercontent.com/sannybuilder/library/master/${game}/${game}.json`)
	.then(response => {
		return fetchPercentece(response, '#10a122')
  })

	DATA_DB = await DATA_DB.json()
	LS.set("DB_"+game, JSON.stringify(DATA_DB))
  }else{
    DATA_DB = JSON.parse(DATA_DB)
  }
  
  //log(JSON.stringify(DATA_DB))
  
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


let version = await fetch(`https://raw.githubusercontent.com/sannybuilder/library/master/${game}/version.txt`)
version = await version.text()
$('#version_sbl').innerHTML = 'SBL ' + version


await dbSBL(game)


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

SP.parseHigthLevelLoops = function(){
    // Para abrir y cerrar un bucle, necesitamos saber
    // el nombre de la ultima etiqueta creada para este
    // fin, y una forma de saber cual hay que poner,
    // es con un Stack(pila). Cada etiqueda creada para
    // indicar el comienzo del bucle, se guarda en una
    // Stack. Para que cada cierre de bucle, solo valla
    // al final del stack, tome la etiqueta que necesita.
    
    let stacks = {
      general: [], // para saber que stack hay que revisar
      reverse: [],
      custom: [],
      for : [],
      repeat : [],
      until : [],
      while : [],
      if : []
    }
    
    // Para evitar que las etiquetas se repitan, usamos
    // contadores que solo sean para incrementar.
    let counts = {
      reverse:0,for:0,repeat:0,while:0,if:0,custom:0
    }
    let label = ''
    
    // dividimoa el codigo, para analizarlo por lineas.
    const lines = this.split('\n');
    let outputText = ''
    
    lines.forEach(line => {
      line = line.trim()
      
      if (/^then/im.test(line)) {
        stacks.general.push('then');
        
        label = `if_${++counts.if}`
        line = [
          'goto_if_false @'+label+''
        ].join('\n')
        
        stacks.if.push(label);
      }
      else if (/^else/im.test(line)) {
        if (stacks.general.slice(-1) != 'then'){
          log('cierre de pila inconclusa :'+stacks.general)
        }
        
        label = stacks.if.slice(-1);
        let labelElse = `if_${++counts.if}`
        line = [
          'goto @'+labelElse,
          ':'+label
        ].join('\n')
        
        stacks.if[stacks.if.length - 1] = labelElse
      }
      else if (/^while /im.test(line)){
        if (/^while true$/im.test(line)){
          stacks.general.push('true')
          
          label = `while_true_${++counts.while}`
          line = ':'+label+'_return // begin-loop'
          
          stacks.while.push(label)
        }
        else if (/^while false$/im.test(line)){
          stacks.general.push('false')
          
          label = `while_false_${++counts.reverse}`
          line = `goto @`+label
          
          stacks.reverse.push(label)
        }
        else {
          stacks.general.push('custom')
          
          const values = line.match(SYNTAX.WHILE)
          
          label = `while_custom_${++counts.custom}`
          line = [
            ':'+label+'_return // begin-loop',
            'if',
            values[1],
            'goto_if_false @' + label
          ].join('\n')
          
          stacks.custom.push(label)
        }
      }
      else if(/^for .+/im.test(line)) {
        stacks.general.push('for')
        
        const values = line.match(SYNTAX.FOR)
        const variable = values[1].trim()
        const start = values[2].trim()
        const forUp = /down/i.test(values[3])
        const end = values[4]
        const step = values[6] || 1
        
        label = `loop_for_${++counts.for}`
        
  			line =[
  			  variable+' = '+start,
  			  variable+' '+(forUp?'+=':'-=')+' '+step,
          ':'+label+'_return // begin-loop',
          variable+' '+(forUp?'-=':'+=')+' '+step,
          'if',
          variable+' '+(forUp?'<=':'>=')+' '+end,
          'goto_if_false @'+label
        ].join('\n')
        
        stacks.for.push(label)
      }
      else if (/^repeat$/im.test(line)){
        stacks.until.push('repeat')
          
        label = `repeat_${++counts.repeat}`
        line = `:`+label+'_return // begin-loop'
          
        stacks.repeat.push(label)
      }
      else if(/^until.+$/im.test(line)){
        if (stacks.until.length == 0){
          log(`pila sintactica: vacia`)
        }
        else{
          if (/^until true$/im.test(line)) {
            label = stacks.repeat.pop()
            stacks.until.pop()
            
            line = [
              'goto @'+label+'_return',
              ':'+label +' // end-loop'
            ].join('\n')
          }
          else if (/^until false$/im.test(line)) {
            stacks.repeat.pop()
            stacks.until.pop()
            
            line = ':'+label +' // end-loop'
          }
          else {
            label = stacks.repeat.pop()
            stacks.until.pop()
            
            const condition = line.match(SYNTAX.REPEAT)[1]
            
            line = [
              'if',
              condition,
              'goto_if_false @'+label,
                'goto @'+label+'_return',
              ':'+label +' // end-loop'
            ].join('\n')
          }
        }
      }
      else if(/^end$/im.test(line)) {
        if (stacks.general.length == 0) {
          log(`pila sintactica: vacia`)
        }
        else {
          let closed = stacks.general.pop()
          
          if (closed == 'true') {
            label = stacks.while.pop()
            line = [
              'goto @'+label+'_return',
              ':'+label +' // end-loop'
            ].join('\n')
          }
          else if (closed == 'false') {
            line = ':' + stacks.reverse.pop()
          }
          else if (closed == 'custom') {
            label = stacks.custom.pop()
            line = [
              'goto @'+label+'_return',
              ':' + label +' // end-loop'
            ].join('\n')
          }
          else if(closed == 'for'){
            label = stacks.for.pop()
            line = [
              'goto @'+label+'_return',
              ':' + label +' // end-loop'
            ].join('\n')
          }
          else if (closed == 'then'){
            label = stacks.if.pop()
            line = ':' + label +' // end-condition'
          }
        }
      }
      
      outputText += line + '\n'
    })
    if (stacks.general.length > 0)
      log(`pila sintactica: `+stacks.general);
      
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
	
	// aca solo se arreglan los cuerpos para
	// que se ajusten a un solo fomando por linea.
	lineas.forEach(line =>{
	  if (tReg.test(line)){
	    let vars = line.match(/^if (.+)/mi)
	    let cond = vars[1].trim()
	    if (!/^(and|or)$/im.test(cond)){
	      nLineas += 'if\n'+cond+'\n'
	    }else{
	      nLineas += line+'\n'
	    }
	  }else if (/^(then|else) .+/im.test(line)){
	    let vars = line.match(/^(then|else) (.+)/im)
	    
	    let cond = vars[2].trim()
	    if (cond == ''){
	      nLineas += vars[1]+'\n'
	    }else{
	      nLineas += vars[1]+'\n'+cond+'\n'
	    }
	  }else {
	    nLineas += line + '\n'
	  }
	})
	
	//log(nLineas)
  lineas = nLineas.split('\n')
  
	let real = 0
	let contador = 0;
	let iniciar = false
	let multiCondicion = false
	let numeros = [];

	for (let linea of lineas) {
	  linea = linea.trim()
		if (/^if/im.test(linea)) {
			iniciar = true
			real = 0
			contador = 0
			if (/\s+(or|and)$/i.test(linea)) {
				multiCondicion = true
				if (/or/i.test(linea)) {
					contador += 20;
				} else {
					contador += 1;
				}
			}
		} else if (/^(then|goto_if_false|else_jump|else_goto|004D)/im.test(linea)) {
		  //real--;
		  
			if (real > 1 && multiCondicion == false)
			 throw new Error('¡Error! El "if" debe ir seguido de "and" o "or".')
			  
			if (real > 8 && multiCondicion == true)
			  throw new Error('¡Este if tiene más de 8 líneas de texto!');
			
			contador += real > 0 ? real-1 :real
			numeros.push(contador);
			contador = 0;
			real = 0;
			iniciar = false
		} else {
		  if(linea != '') {
				real++;
		  }
		  //log({real, multiCondicion})
		}
	}
	
	let number = 0
	let counter = 0
	for (let linea of lineas) {
	  linea = linea.trim()
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

SP.preProcesar = function() {
  let lines = this.split('\n')
  let nString = ''
  
  lines.forEach(line =>{
    
    // Remove coment
    //   0@//(1@++,123i)
    //   ↓
    //   0@
    line = line.r(/\/\/(.+)/, '').trim()
      
    // Prevent addition
    //   0@(1@++,123i)
    //   ↓
    //   1@++
    //   0@(1@,123i)
    let c = 1
    const mPreAdd =
      /(\d+@(\w)?|(\&|\$)[\w\d_]+)([\+\-\*\=]+)[^\s,\)\(]+/
    
    while (mPreAdd.test(line) && line.includes('(')){
      let v = line.match(mPreAdd)
        
      nString += v[0].r(/([\+\-\*\=]+)/, ' $1 ') +'\n'
      line = line.r(/([\+\-\*\=]+)([^,\s\)]+)/, '')
        
      if (!/[=+\-]/.test(line)) break;
    }
    
    nString += line.trim() + '\n'
  })
  
  nString = nString
  	// 0@ = 0@ == 1 ? 0 : 1
  	.r(/^(.+)([\-\+\*\\ ]+=) (.+) \? (.+) \: (.+)$/gm, `if $3\nthen $1 $2 $4\nelse $1 $2 $5\nend`)
  	// 0@ == 1 ? 0 : 1
  	.r(/^(.+) \? (.+) \: (.+)$/gm, input=>{
  	  let vars = input.match(/^(.+)\?(.+)\:(.+)$/)
  	                  .map(e=> e.trim())
  	                  
  	  let operators = '==,!=,<=,>=,>,<,<>'
  	  
  	  operators.split(',').forEach(operador => {
  	    if (RegExp(operador).test(vars[1])){
  	      input =
  	        'if '+vars[1]+'\n'+
  	        'then '+vars[2]+'\n'+
  	        'else '+vars[3]+'\n'+
  	        'end'
  	    }
  	  })
  	  //log(input)
  	  return input
  	})
    // 7@ = !7@
    .r(/(then |else )?(.+)= !(.+)$/gim,
`$1
$2 = $3
if $2 == 0
then $2 = 1
else $2 = 0
end`)
    // 7@ ||= $8
    .r(/(then |else )?(.+)\|\|= (.+)$/gim,
`$1
if or
$2 == null
$2 == undefined
$2 == false
then
$2 = $3
end`)
    // 7@ = 7@ || $8
    .r(/(then |else )?(.+)= (.+) \|\| (.+)$/gim,
`$1
if or
$3 == null
$3 == undefined
$3 == false
then
$2 = $4
else
$2 = $3
end`)
    // 7@ = 7@ ?? $8
    .r(/(then |else )?(.+)= (.+) \?\? (.+)$/gim,
`$1
if or
$3 == null
$3 == undefined
then
$2 = $4
else
$2 = $3
end`)
    // [] : variable con limites maximos
    // () : variable con valor en bucle
    // [min..max]:0@
    // [min..]:0@
    // [..max]:0@
    
    // function(...) | CLEO_CALL
    .r(/^([\w\d_]+)\((.+)\)$/gm, input=>{
      let vars = input.match(/([^\.\s\W]+)\((.+)\)$/m)
      //log(vars)
      
      let line = vars[2]
      let add = ''
      let inArray = false
      
      for (let i = 0; i < line.length; i++){
        if (line[i] == '(') inArray = true;
        if (line[i] == ')') inArray = false;
        
        add += inArray ? line[i].r(',', '\x01') : line[i].r(',', ' ')
        //log(line[i])
      }
      
      let length = add.split(',').length
      
      input = 'cleo_call @'+vars[1]+' '+length+' '+add.rA('\x01', ',')+'\n'
      return input
    })
    // subrutine() | GOSUB
    .r(/^([\w\d_]+)\(\)$/gm, 'gosub @$1')
    .r(/^(then|else)\s+(.+)/img, '$1\n$2')
    
    nString = nString
      // VAR++
      .r(/^(\d+@(\w)?|(\w)?(\$|&)[\w\d_]+)(\s+)?(\+\+|--)(.+)?/gm,
      input=>{
        input = input.r(' ').match(/(.+)(\+\+|--)(.+)?$/m)
        
        if (input[2] == '++'){
          if (/(float |@f|f\$)/i.test(input[1]))
            input = input[1]+' += 1.0'
          else
            input = input[1]+' += 1'
        } else {
          if (/(float |@f|f\$)/i.test(input[1]))
            input = input[1]+' -= 1.0'
          else
            input = input[1]+' -= 1'
        }
        return input.trim()
      })
  
    //log(nString)
  
  	return nString
}

SP.postProcesar = function(){
  let nString = this.split('\n').map(line=>{
    //log(CONSTANTS)
    line = line.split(' ').map(param=>{
      if (param.trim() != ''){
        if (param.toUpperCase() in CONSTANTS)
          return CONSTANTS[param.toUpperCase()]
        else
          return param
      }else{
        return param
      }
    }).join(' ')
    
    return line
    
    //log(line)
  }).join('\n')
	
	nString = nString
		.r(/^(int )?(\$.+) = ([\-\d]+|#.+|0x.+|0b.+)$/gim, `0004: $2 $3`)									//0004: $ = 0
		.r(/^(float )?(\$.+) = (\d+\.\d+|\.\d+|\d+f)$/gim, `0005: $2 $3`)							//0005: $ = 0.0
		.r(/^(int )?(\d+@([^\s]+)?) = ([\-\d]+|#.+|0x.+|0b.+)$/gim, `0006: $2 $4`)				//0006: 0@ = 0
		.r(/^(float )?(\d+@([^\s]+)?) = (\d+\.\d+|\.\d+|\d+f)$/gim, `0007: $2 $4`)		//0007: @ = 0.0
		.r(/^(int )?(\$.+) \+= (\d+|#.+|0x.+|0b.+)$/gim, `0008: $2 $3`)								//0008: $ += 0
		.r(/^(float )?(\$.+) \+= (\d+\.\d+|\.\d+|\d+f)$/gim, `0009: $2 $3`)						//0009: $ += 0.0
		.r(/^(int )?(\d+@([^\s]+)?) \+= (\d+|#.+|0x.+|0b.+)$/gim, `000A: $2 $4`)			//000A: @ += 0
		.r(/^(float )?(\d+@([^\s]+)?) \+= (\d+\.\d+|\.\d+|\d+f)$/gim, `000B: $2 $4`)	//000B: @ += 0.0
		.r(/^(int )?(\$.+) \-= (\d+|#.+|0x.+|0b.+)$/gim, `000C: $2 $3`)								//000C: $ -= 0
		.r(/^(float )?(\$.+) \-= (\d+\.\d+|\.\d+|\d+f)$/gim, `000D: $2 $3`)						//000D: $ -= 0.0
		.r(/^(int )?(\d+@([^\s]+)?) \-= ([\-\d]+|#.+|0x.+|0b.+)$/gim, `000E: $2 $4`)			//000E: 0@ -= 0
		.r(/^(float )?(\d+@([^\s]+)?) \-= (\d+\.\d+|\.\d+|\d+f)$/gim, `000F: $2 $4`)	//000F: @ -= 0.0
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
		.r(/^(int )?(\d+|#.+|0x.+|0b.+) < (\d+@([^\s]+)?)$/gim, `801B: $2 $4`)				//801B:   3 < 20@
		.r(/^(int )?(\$.+) < (\$.+)$/gim, `801C: $2 $4`)															//801C:   $CURRENT_MONTH_DAY < $GYM_MONTH_DAY_WHEN_LIMIT_REACHED // (int)
		.r(/^(int )?(\d+@([^\s]+)?) < (\d+@([^\s]+)?)$/gim, `801D: $2 $4`)						//801D:   27@ < 33@  // (int)
		.r(/^(int )?(\$.+) < (\d+@([^\s]+)?)$/gim, `801E: $2 $4`)											//801E:   $CURRENT_TIME_IN_MS2 < 3@ // (int)
		.r(/^(int )?(\d+@([^\s]+)?) < (\$.+)$/gim, `801F: $2 $4`)											//801F:   9@ < $GIRL_PROGRESS[0] // (int)
		.r(/^(float )?(\$.+) < (\d+\.\d+|\.\d+|\d+f)$/gim, `8020: $2 $4`)							//8020:   $HJ_TWOWHEELS_DISTANCE_FLOAT < 0.0
		.r(/^(float )?(\d+@([^\s]+)?) < (\d+\.\d+|\.\d+|\d+f)$/gim, `8021: $2 $4`)		//8021:   26@ < 64.0
		.r(/^(float )?(\d+\.\d+|\.\d+|\d+f) < (\$.+)$/gim, `8022: $2 $4`)							//8022:   -180.0 < $1316
		.r(/^(float )?(\d+\.\d+|\.\d+|\d+f) < (\d+@([^\s]+)?)$/gim, `8023: $2 $4`)		//8023:   0.0 < 7@
		.r(/^(float )?(\$.+) < (\$.+)$/gim, `8024: $2 $4`)														//8024:   $HJ_CAR_Z < $HJ_CAR_Z_MAX // (float)
		.r(/^(float )?(\d+@([^\s]+)?) < (\d+@([^\s]+)?)$/gim, `8025: $2 $4`)					//8025:   3@ < 6@  // (float)
		.r(/^(float )?(\$.+) < (\d+@([^\s]+)?)$/gim, `8026: $2 $4`)										//8026:   $TEMPVAR_FLOAT_1 < 513@(227@,10f)  // (float)
		.r(/^(float )?(\d+@([^\s]+)?) < (\$.+)$/gim, `8027: $2 $4`)										//8027:   513@(227@,10f) < $TEMPVAR_FLOAT_2 // (float)

		.r(/^(int )?(\$.+) >= (\d+|#.+|0x.+|0b.+)$/gim, `0028: $2 $4`)								//0028:   $CATALINA_TOTAL_PASSED_MISSIONS >= 2
		.r(/^(int )?(\d+@([^\s]+)?) >= (\d+|#.+|0x.+|0b.+)$/gim, `0029: $2 $4`)				//0029:   0@ >= 0
		.r(/^(int )?(\d+|#.+|0x.+|0b.+) >= (\$.+)$/gim, `002A: $2 $4`)								//002A:   10 >= $SYNDICATE_TOTAL_PASSED_MISSIONS
		.r(/^(int )?(\d+|#.+|0x.+|0b.+) >= (\d+@([^\s]+)?)$/gim, `002B: $2 $4`)				//002B:   3 >= 20@
		.r(/^(int )?(\$.+) >= (\$.+)$/gim, `002C: $2 $4`)															//002C:   $CURRENT_MONTH_DAY >= $GYM_MONTH_DAY_WHEN_LIMIT_REACHED // (int)
		.r(/^(int )?(\d+@([^\s]+)?) >= (\d+@([^\s]+)?)$/gim, `002D: $2 $4`)						//002D:   27@ >= 33@  // (int)
		.r(/^(int )?(\$.+) >= (\d+@([^\s]+)?)$/gim, `002E: $2 $4`)										//002E:   $CURRENT_TIME_IN_MS2 >= 3@ // (int)
		.r(/^(int )?(\d+@([^\s]+)?) >= (\$.+)$/gim, `002F: $2 $4`)										//002F:   9@ >= $GIRL_PROGRESS[0] // (int)
		.r(/^(float )?(\$.+) >= (\d+\.\d+|\.\d+|\d+f)$/gim, `0030: $2 $4`)						//0030:   $HJ_TWOWHEELS_DISTANCE_FLOAT >= 0.0
		.r(/^(float )?(\d+@([^\s]+)?) >= (\d+\.\d+|\.\d+|\d+f)$/gim, `0031: $2 $4`)		//0031:   26@ >= 64.0
		.r(/^(float )?(\d+\.\d+|\.\d+|\d+f) >= (\$.+)$/gim, `0032: $2 $4`)						//0032:   -180.0 >= $1316
		.r(/^(float )?(\d+\.\d+|\.\d+|\d+f) >= (\d+@([^\s]+)?)$/gim, `0033: $2 $4`)		//0033:   0.0 >= 7@
		.r(/^(float )?(\$.+) >= (\$.+)$/gim, `0034: $2 $4`)														//0034:   $HJ_CAR_Z >= $HJ_CAR_Z_MAX // (float)
		.r(/^(float )?(\d+@([^\s]+)?) >= (\d+@([^\s]+)?)$/gim, `0035: $2 $4`)					//0035:   3@ >= 6@  // (float)
		.r(/^(float )?(\$.+) >= (\d+@([^\s]+)?)$/gim, `0036: $2 $4`)									//0036:   $TEMPVAR_FLOAT_1 >= 513@(227@,10f)  // (float)
		.r(/^(float )?(\d+@([^\s]+)?) >= (\$.+)$/gim, `0037: $2 $4`)									//0037:   513@(227@,10f) >= $TEMPVAR_FLOAT_2 // (float)

		.r(/^(int )?(\$.+) <= (\d+|#.+|0x.+|0b.+)$/gim, `8028: $2 $4`)								//8028:   $CATALINA_TOTAL_PASSED_MISSIONS <= 2
		.r(/^(int )?(\d+@([^\s]+)?) <= (\d+|#.+|0x.+|0b.+)$/gim, `8029: $2 $4`)				//8029:   0@ <= 0
		.r(/^(int )?(\d+|#.+|0x.+|0b.+) <= (\$.+)$/gim, `802A: $2 $4`)								//802A:   10 <= $SYNDICATE_TOTAL_PASSED_MISSIONS
		.r(/^(int )?(\d+|#.+|0x.+|0b.+) <= (\d+@([^\s]+)?)$/gim, `802B: $2 $4`)				//802B:   3 <= 20@
		.r(/^(int )?(\$.+) <= (\$.+)$/gim, `802C: $2 $4`)															//802C:   $CURRENT_MONTH_DAY <= $GYM_MONTH_DAY_WHEN_LIMIT_REACHED // (int)
		.r(/^(int )?(\d+@([^\s]+)?) <= (\d+@([^\s]+)?)$/gim, `802D: $2 $4`)						//802D:   27@ <= 33@  // (int)
		.r(/^(int )?(\$.+) <= (\d+@([^\s]+)?)$/gim, `802E: $2 $4`)										//802E:   $CURRENT_TIME_IN_MS2 <= 3@ // (int)
		.r(/^(int )?(\d+@([^\s]+)?) <= (\$.+)$/gim, `802F: $2 $4`)										//802F:   9@ <= $GIRL_PROGRESS[0] // (int)
		.r(/^(float )?(\$.+) <= (\d+\.\d+|\.\d+|\d+f)$/gim, `8030: $2 $4`)						//8030:   $HJ_TWOWHEELS_DISTANCE_FLOAT <= 0.0
		.r(/^(float )?(\d+@([^\s]+)?) <= (\d+\.\d+|\.\d+|\d+f)$/gim, `8031: $2 $4`)		//8031:   26@ <= 64.0
		.r(/^(float )?(\d+\.\d+|\.\d+|\d+f) <= (\$.+)$/gim, `8032: $2 $4`)						//8032:   -180.0 <= $1316
		.r(/^(float )?(\d+\.\d+|\.\d+|\d+f) <= (\d+@([^\s]+)?)$/gim, `8033: $2 $4`)		//8033:   0.0 <= 7@
		.r(/^(float )?(\$.+) <= (\$.+)$/gim, `8034: $2 $4`)														//8034:   $HJ_CAR_Z <= $HJ_CAR_Z_MAX // (float)
		.r(/^(float )?(\d+@([^\s]+)?) <= (\d+@([^\s]+)?)$/gim, `8035: $2 $4`)					//8035:   3@ <= 6@  // (float)
		.r(/^(float )?(\$.+) <= (\d+@([^\s]+)?)$/gim, `8036: $2 $4`)									//8036:   $TEMPVAR_FLOAT_1 <= 513@(227@,10f)  // (float)
		.r(/^(float )?(\d+@([^\s]+)?) <= (\$.+)$/gim, `8037: $2 $4`)									//8037:   513@(227@,10f) <= $TEMPVAR_FLOAT_2 // (float)

		.r(/^(int )?(\$.+) == (\d+|#.+|0x.+|0b.+)$/gim, `0038: $2 $3`)								//0038:   $VAR8 == 0
		.r(/^(int )?(\d+@([^\s]+)?) == (\d+|#.+|0x.+|0b.+)$/gim, `0039: $2 $4`)				//0039:   26@ == 0
		.r(/^(int )?(\$.+) == (\$.+)$/gim, `003A: $2 $3`)															//003A:   $VAR28 == $VAR12 // (int)
		.r(/^(int )?(\d+@([^\s]+)?) == (\d+@([^\s]+)?)$/gim, `003B: $2 $4`)						//003B:   20@ == 1@ // (int)
		.r(/^(int )?(\$.+) == (\d+@([^\s]+)?)$/gim, `003C: $2 $3`)										//003C:   $VAR24 == 17@ // (int)
		.r(/^(float )?(\$.+) == (\d+\.\d+|\.\d+|\d+f)$/gim, `0042: $2 $3`)						//0042:   $VAR8 == 0.0
		.r(/^(float )?(\d+@([^\s]+)?) == (\d+\.\d+|\.\d+|\d+f)$/gim, `0043: $2 $4`)		//0043:   26@ == 0.0
		.r(/^(float )?(\$.+) == (\$.+)$/gim, `0044: $2 $3`)														//0044:   $VAR28 == $VAR12 // (float)
		.r(/^(float )?(\d+@([^\s]+)?) == (\d+@([^\s]+)?)$/gim, `0045: $2 $4`)					//0045:   20@ == 1@ // (float)
		.r(/^(float )?(\$.+) == (\d+@([^\s]+)?)$/gim, `0046: $2 $3`)									//0046:   $VAR24 == 17@ // (float)
		.r(/^(int )?(\d+@([^\s]+)?) == (\$.+)$/gim, `07D6: $2 $4`)										//07D6:    17@ == $VAR24 // (int)
		.r(/^(float )?(\d+@([^\s]+)?) == (\$.+)$/gim, `07D7: $2 $4`)									//07D7:    17@ == $VAR24 // (float

		.r(/^(int )?(\$.+) != (\d+|#.+|0x.+|0b.+)$/gim, `8038: $2 $3`)								//0038:   $VAR8 != 0
		.r(/^(int )?(\d+@([^\s]+)?) != (\d+|#.+|0x.+|0b.+)$/gim, `8039: $2 $4`)				//0039:   26@ != 0
		.r(/^(int )?(\$.+) != (\$.+)$/gim, `803A: $2 $3`)															//003A:   $VAR28 != $VAR12 // (int)
		.r(/^(int )?(\d+@([^\s]+)?) != (\d+@([^\s]+)?)$/gim, `803B: $2 $4`)						//003B:   20@ != 1@ // (int)
		.r(/^(int )?(\$.+) != (\d+@([^\s]+)?)$/gim, `803C: $2 $3`)										//003C:   $VAR24 != 17@ // (int)
		.r(/^(float )?(\$.+) != (\d+\.\d+|\.\d+|\d+f)$/gim, `8042: $2 $3`)						//0042:   $VAR8 != 0.0
		.r(/^(float )?(\d+@([^\s]+)?) != (\d+\.\d+|\.\d+|\d+f)$/gim, `8043: $2 $4`)		//0043:   26@ != 0.0
		.r(/^(float )?(\$.+) != (\$.+)$/gim, `8044: $2 $3`)														//0044:   $VAR28 != $VAR12 // (float)
		.r(/^(float )?(\d+@([^\s]+)?) != (\d+@([^\s]+)?)$/gim, `8045: $2 $4`)					//0045:   20@ != 1@ // (float)
		.r(/^(float )?(\$.+) != (\d+@([^\s]+)?)$/gim, `8046: $2 $3`)									//0046:   $VAR24 != 17@ // (float)
		.r(/^(int )?(\d+@([^\s]+)?) != (\$.+)$/gim, `87D6: $2 $4`)										//07D6:    17@ != $VAR24 // (int)
		.r(/^(float )?(\d+@([^\s]+)?) != (\$.+)$/gim, `87D7: $2 $4`)									//07D7:    17@ != $VAR24 // (float)


		.r(/^(int )?(\$.+) = (\$.+)$/gim, `0084: $2 $3`)															//0084:    17@ = $VAR24 // (int)
		.r(/^(int )?(\d+@([^\s]+)?) = (\d+@([^\s]+)?)$/gim, `0085: $2 $4`)						//0085:    17@ = $VAR24 // (int)
		.r(/^(float )?(\$.+) = (\$.+)$/gim, `0086: $2 $3`)														//0086:    17@ = $VAR24 // (float)
		.r(/^(float )?(\d+@([^\s]+)?) = (\d+@([^\s]+)?)$/gim, `0087: $2 $4`)					//0087:    17@ = $VAR24 // (float
		.r(/^(float )?(\$.+) = (\d+@([^\s]+)?)$/gim, `0088: $2 $4`)										//0088:    17@ = $VAR24 // (float)
		.r(/^(float )?(\d+@([^\s]+)?) = (\$.+)$/gim, `0089: $2 $4`)										//0089:    17@ = $VAR24 // (float
		.r(/^(int )?(\$.+) = (\d+@([^\s]+)?)$/gim, `008A: $2 $4`)											//008A:    17@ = $VAR24 // (int)
		.r(/^(int )?(\d+@([^\s]+)?) = (\$.+)$/gim, `008B: $2 $4`)											//008B:    17@ = $VAR24 // (int)

		.r(/^(string )?(\d+@([^\s]+)?) = ('([^\n\']+)?')$/gim, `05A9: $2 $3`)
		.r(/^(long )?(\d+@([^\s]+)?) = ("([^\n\"]+)?")$/gim, `06D1: $2 $3`)
		.r(/^(string )?(\d+@([^\s]+)?) == ('([^\n\']+)?')$/gim, `05AD: $2 $3`)
		.r(/^(long )?(\d+@([^\s]+)?) == ("([^\n\"]+)?")$/gim, `05AE: $2 $3`)
		
		//log(nString)
		return nString
}

SP.classesToOpcodes = function(){
  const match = /^([\!\w\d_]+)\.([\w\d_]+)\((.+)\)$/mi
  let ncode = ''
  
  this.split('\n').forEach(line =>{
    line = line.trim()
    let isNegative = false
    let opcode = 0
    
    if (match.test(line)){
      let vars = line.match(match)
      if (vars[1].i('!')){
        vars[1] = vars[1].r('!')
        isNegative = true
      }
      
      opcode = classes[vars[1]][vars[2]]
      
      if (isNegative) {
        opcode = (Number(opcode.hexToDec()) + 0b1000000000000000)
  		  .toString(16)
  		  .padStart(4, '0')
      }
      
      //log(opcode)
      
      line = opcode+': '+vars[3]
    }
    ncode += line + '\n'
  })
  return ncode
}

SP.Translate = function(_SepareWithComes = false, _addJumpLine = false){
	let LineComand = this
		.r(/(\s+)?\/\*([^\/]*)?\*\//gm, '')
		.r(/(\s+)?\{([^\$][^\}]*(\})?)?/gm, '')

	const come = a => {
		if (_SepareWithComes){
			return a + ','
		}
		return a
	}

	let codeDepurated = []
	let totalSizePerLine = []
	let varsDefined = {}
	let globalVar = {}
	
	function translateLvar(dataInput){
  	dataInput = 
  		Number(dataInput.r(/@(\w)?/,''))
  		.toString(16)
  		.padStart(4,'0')
  		.toBigEndian();
  
  	return dataInput
  }
  function translateAvar(dataInput){
    dataInput = 
      (Number(dataInput.r(/(\w)?&/,'')) * 4)
      .toString(16)
			.padStart(4,'0')
			.toBigEndian()
	
		return dataInput
  }
	
	/*
	if (this.match(/[^\w\d]("([^"\n]+)?)(\x20)(([^"\n]+)?")[^\w\d]/)
		|| this.match(/[^\w\d]('([^'\n]+)?)(\x20)(([^'\n]+)?')[^\w\d]/)
		|| this.match(/[^\w\d](`([^`\n]+)?)(\x20)(([^`\n]+)?`)[^\w\d]/)) {
		log('NO ADD SPACES IN STRINGS')
		return
	}
	*/

LineComand = LineComand
  .preProcesar()
	.parseHigthLevelLoops()
	.addBreaksToLoops()
	.addNumbersToIfs()

	LineComand = LineComand
		.r(/"([^\n"]+)?"/gm, fixString => fixString.r(/\x20/g, '\x00'))
		.r(/^not /gm, '!')
		//.r(/^(\x20+)?:[\w\d]+/gm, '')
		// remove commits of code
		.r(/(\s+)?\/\/([^\n]+)?/gm, '')
		// remove spaces innesesaries
		.r(/[\x20\t]+$/gm,'')
		.r(/(\t|\x20)(\t|\x20)+/gm,'$1')
		.r(/^[\x20\t]+/gm,'')
		// remove jump lines innesesaries
		.r(/^\n+/gm, '')
		.r(/\n$/gm, '')
		.postProcesar()
	  .classesToOpcodes()
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
					if (/:/.test(Argument)){
						Argument = Argument.padStart(6,'0')
					}

					if (
						/[A-Fa-f\d]+:$/m.test(Argument)
						&& Argument.length <= 6
					){
						// is opcode
						Argument = Argument.r(':','').r('!', '8').padStart(4,'0')
						Argument = Argument.length > 4 ? Argument.r(/^./m,'') : Argument
						setOp = Argument

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
							throw new SyntaxError(`opcode undefined\n\tin line ${(1+numLine)} the trigger ${Argument}\n\t${setOp == '0000' ? 'XXXX' : setOp}>> ${Line}`);
						}

						if (isNegative){
							setOp = (
								parseInt(setOp, 16) + 0b1000000000000000
							).toString(16)
						}
					}
					lineDepurated.push((_addJumpLine ? '\n' : '') + setOp.toBigEndian())
					
					command = Argument
					
					totalSizePerLine.push(2)
				}
				else { // is Argument
					totalSizePerLine.push(1)

					try {
						typeData = SCM_DB[command] ? SCM_DB[command].params[--numArgument] : SCM_DB[command.r(/^8/m,'0')].params[--numArgument];
					}catch{
						throw new SyntaxError(`unknown parameter\n\tat line ${(1+numLine)} the value ${Argument}\n\ttrigger: ${setOp == '0000' ? 'XXXX' : setOp}\n\t>>> ${Line}\n\t>>>${command}`);
					}

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
						if (/^\d+@/m.test(Argument))
							typeData = 'lvar';
						if (/^([ifsv])?(\$|&)./m.test(Argument))
							typeData = 'gvar';
						if (/^'/m.test(Argument))
							typeData = 'short';
						if (/^["`]/m.test(Argument))
							typeData = 'long';
						//log({typeData, Argument})
					}
					if (typeData == 'var_any'){
						typeData = /^\d@([ifsv])?/mi.test(Argument) ? 'lvar' : 'gvar';
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
							Argument = Argument.r(/("([^\"]+)?"|`(.+)?`)/, '$2$3').r(/\x00/g,'\x20')
							Argument = Argument.substring(0,255)
							//console.log(Argument)
							if (Argument.length == 0) Argument = '\x00'

							totalSizePerLine.push(Argument.length + (SCM_DB[command].opcode[1] == '0' ? 2 : 1))
							Argument = (come(TYPE_CODE.STRING_VARIABLE) + come(Argument.length.toString(16).padStart(2, '0')) + Argument.toUnicode())// + (SCM_DB[command].opcode[1] == '0' ? '00' : '')
							
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
							let isNumberNegative = /-/.test(Argument)

							Argument = Argument
								.r(/^(-)?0b.+/mi, bin => {
									return bin.r(/(-)?0b/,'').binToDec()
								})
								.r(/^(-)?0x.+/mi, hex => {
									return hex.r(/(-)?0b/,'').hexToDec()
								})
								.r(/^#.+/m, model =>{
									model = MODELS[model.r('#','').toUpperCase()]

									if (!model) {
										throw new SyntaxError(`Model undefined\n\tparameter ${Argument}\n\tat line ${(1+numLine)}\n\t\topcode ${setOp == '0000' ? 'autodefined' : setOp} ${command.toUpperCase()}`);
									}

									return model
									//log(Argument)
								})

							if (isNumberNegative && Argument > 0) Argument *= -1 
							if (Argument > 0x7FFFFFFF) Argument = 0x7FFFFFFF;

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
							if (/@.+(@|\$|\&)/.test(Argument)){
/*  STRUCT ARRAY
         0006: 1@(2@, 123i) = 1
    ____/   ___/  \__  | \     \
    0600 08 0100 0200 7B 00 04 01
    \__/  | \__/ \__/  |  |  \   \
   opcode |  id   id   | lint \   \
     lvar_array      lenght  int8  num
*/
						  let LVAR = Argument.match(
						    /(\d+)@(\w)?(\(.+\))?/i
						  )
						  let Slvar = {
						    variable: LVAR[1],
						    type: LVAR[2],
						    extend: LVAR[3]
						  }
						  if (Slvar.extend){
						    let ARRAY = LVAR[3].match(/\((.+),(\d+)(\w)?\)/i)
						    Slvar.extend = {
						      index : ARRAY[1],
						      size : ARRAY[2],
						      subtype : ARRAY[3]
						    }
						  }
						  //log(Slvar)
						  
						  let typeArray = 
						    (Slvar.type ?? Slvar.extend.subtype ?? 'i')
						  
						  let typeSet = typeArray
						  
						  //let var1 = 
						  switch (typeArray){
						    case 's':
						      typeArray = TYPE_CODE.LVAR_ARRAY_STRING8
						    break;
						    case 'v':
						      typeArray = TYPE_CODE.LVAR_ARRAY_STRING16
						    break;
						    default:
						      typeArray = TYPE_CODE.LVAR_ARRAY
						    break;
						  }
						  
						  let index = Slvar.extend.index
						  index = {
						   id: index.includes('@')
						    ? translateLvar(index.match(/(\d+)@/)[1])
						    : index.match(/(\$|\&)([\w\d_]+)/)[2],
						   action : (()=>{
						   }),
						   global: !index.includes('@')
						  }
						  
						  if (index.global){
						    switch (typeSet){
  						    case 's': typeSet=ELEMENT_TYPE.GSTRING8
  						    break;
  						    case 'v': typeSet=ELEMENT_TYPE.GSTRING16
  						    break;
  						    case 'i': typeSet=ELEMENT_TYPE.GINT
  						    break;
  						    case 'f': typeSet=ELEMENT_TYPE.GFLOAT
  						    break;
  						  }
						  }else{
						    switch (typeSet){
  						    case 's': typeSet=ELEMENT_TYPE.LSTRING8
  						    break;
  						    case 'v': typeSet=ELEMENT_TYPE.LSTRING16
  						    break;
  						    case 'i': typeSet=ELEMENT_TYPE.LINT
  						    break;
  						    case 'f': typeSet=ELEMENT_TYPE.LFLOAT
  						    break;
  						  }
						  }
						  
						  
						  totalSizePerLine.push(6)
						  //log(typeSet)
						  Argument = (
						    typeArray + ','+
						    translateLvar(Slvar.variable) + ','+
						    index.id + ','+
						    Number(Slvar.extend.size)
									.toString(16)
									.padStart(2,'0') + ','+
						    typeSet + ','
						  )
						  //log(Argument)
							}
							else{
								totalSizePerLine.push(2)

								Argument = 
									come(TYPE_CODE.LVAR) 
									+ Number(Argument.r(/@(\w)?/,'')).toString(16)
										.padStart(4,'0')
										.toBigEndian();
							}
						break;

						case 'gvar':
							if (/(&|\$)(.+)(&|\$)/.test(Argument)){
								totalSizePerLine.push(6)

								Argument = 
									come(TYPE_CODE.GVAR_ARRAY)
									+ Argument
										.r(/(i|f|s|v)?\$[\w\d_]+/gi, inputVar => {
											if(/\$/.test(inputVar)){
												inputVar = inputVar.r(/(i|f|s|v)?\$/,'')

												if (/\w/.test(inputVar)){
													let coincide = false

													if (CUSTOM_VARIABLES[inputVar.toUpperCase()] != undefined){
														coincide = CUSTOM_VARIABLES[inputVar.toUpperCase()] * 4
													}

													if (!coincide){
														inputVar = parseInt(Number(String(parseInt(inputVar, 35)).substring(0, 4) / 2))
														if (inputVar > 1000) inputVar /= 5
														if (inputVar > 500) inputVar /= 2
														inputVar = parseInt(inputVar)
													}
													else {
														inputVar = coincide
													}
												}
												else{
													inputVar = inputVar * 4
												}
											}

											else {
												//console.log(inputVar)
												inputVar = Number(inputVar.r('&',''))

											}

											inputVar = come(TYPE_CODE.GVAR) + (
												inputVar.toString(16)
												.substring(0, 4)
												.padStart(4,'0')
												.toBigEndian()
											)

											if (isNaN(inputVar)) throw new SyntaxError(`NAN parameter\n\tparameter ${Argument}\n\tat line ${(1+numLine)}\n\t\topcode ${setOp == '0000' ? 'autodefined' : setOp} ${command.toUpperCase()}`);

											return inputVar
										})
										.r(/,,/,',')
										.r(/\(/)
										.r(/[^,]\d+$/m, inputSize => {
											return Number(inputSize.r(',').r(')')).toString(16)
											.padStart(2,'0')
										})
										.r(/(i|f|s|v)\)/, inputType => {
											inputType = inputType.r(')')

											switch (inputType){
												case 'i':
													inputType = ELEMENT_TYPE.GINT
												break;
												case 'f':
													inputType = ELEMENT_TYPE.GFLOAT
												break;
												case 's':
													inputType = ELEMENT_TYPE.GSTRING8
												break;
												case 'v':
													inputType = ELEMENT_TYPE.GSTRING16
												break;
											}

											return ',' + inputType
										})
										.r(/[\w\d_]+,[\w\d_]+$/m, inputSize => {
											inputSize = inputSize.split(',')

											inputSize[0] = Number(inputSize[0]).toString(16).padStart(2,'0')
											

											return inputSize
										})
							}
							else{
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
									let tempNumber = Argument
									Argument = Number(Argument.r('&',''))

									if (isNaN(Argument)) throw new SyntaxError(`NAN parameter\n\tparameter ${tempNumber}\n\tat line ${(1+numLine)}\n\t\topcode ${setOp == '0000' ? 'autodefined' : setOp} ${command.toUpperCase()}`);
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
					  )
					  .r(/\./g,'').toUpperCase().trim()

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
			throw new Error(`label not found "${label}"`)
			return "<@"+label+">"
		}

		return jump.toBigEndian()
	})

	return codeOfFinalDepurated
}

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
	$SBL_State.style = ''
	$('#PREVIEW').style.filter = ''
	c.remove('loading')

	$('#HEX').select()
	getLine()
	$('#OUTHEX').innerText = $('#HEX').value.Translate(true,true)

	$IDE_mode.onchange = async function(){
		$SBL_State.innerText = 'Loading...'
		$('#PREVIEW').style.filter = 'blur(2px)'
		c.add('loading')
		LS.set('Compiler/IDE:mode', $IDE_mode.value)
		
		game = LS.get('Compiler/IDE:mode')
		await dbSBL(game)

		version = await fetch(`https://raw.githubusercontent.com/sannybuilder/library/master/${game}/version.txt`)
		version = await version.text()
		
		$('#version_sbl').innerHTML = 'SBL ' + version
		$SBL_State.innerText = 'Okey'
		$SBL_State.style = ''
		$('#PREVIEW').style.filter = ''
		c.remove('loading')
	}
}
