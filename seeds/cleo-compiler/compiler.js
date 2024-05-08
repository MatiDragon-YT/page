'use strict';
// Author: MatiDragon.
// Contributors: Seemann, OrionSR, Miran.

const DEBUG = true

const 	log = x => DEBUG ? console.log(x) : 0,
		sleep = ms => new Promise(resolve => setTimeout(resolve, ms)),

		NP = Number.prototype,
		SP = String.prototype,
		AP = Array.prototype;

RegExp.prototype.s = RegExp.prototype.source

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
SP.i = SP.includes
AP.i = AP.includes

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

SP.setOpcodeNegative = function() {
  // Convierte el input en una cadena HEX entendible
  //   para JS, para convertirlos en Number y
  //   retornar la suma de ambos.
  return (
    +('0x' + (this + "")) + (+'0x8000')
  ).toString(16)
}

SP.setOpcodePositive = function() {
  // Convierte el input en una cadena HEX entendible
  //   para JS, para convertirlos en Number y
  //   retornar la resta de ambos.
  return (
    +('0x' + (this + "")) - (+'0x8000')
  ).toString(16)
}

function noteToHex(num) {
  // Primero, convertimos el número en notación científica a un número flotante
  const floatNum = parseFloat(num);
  
  // Luego, convertimos ese número a su representación binaria de 32 bits
  const binario32Bits = floatNum.toString(2);
  
  // Finalmente, convertimos el binario a hexadecimal
  let hexadecimal = parseInt(binario32Bits, 2).toString(16);
  
  // Verificamos si la longitud del hexadecimal supera los 8 caracteres
  if (hexadecimal.length > 8) {
    throw new SyntaxError('El número es demasiado alto, supera la longitud máxima de 4 bytes.');
  }
  
  // Aseguramos que la salida sea de 8 caracteres rellenando con ceros si es necesario
  hexadecimal = hexadecimal.padStart(8, '0');
  
  // Devolvemos el string hexadecimal en mayúsculas
  return hexadecimal.toUpperCase().toBigEndian()
}

/*
// Ejemplo de uso:
const numCientifico = "1.23e+5";
const hex32Bits = cientificaAHexadecimal(numCientifico);
console.log(hex32Bits); // Salida esperada para el ejemplo
*/
function isNoteCientific(str){
  const regExp = /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)$/;
  return regExp.test(str+"");
};
/*
"2.3e4")); // true
"123")); // false
"-4.5E-10")); // true
*/

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

/** Return the last element of a array.
 * @pos - Position [optional]
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

SP.enumsGenerator = function() {
    // Eliminamos los saltos de línea y espacios innecesarios
    let str = this.replace(/\n\n/g, '').trim();

    // Dividimos el string en las secciones "enum"
    const enumSections = str.split('enum ');

    // Creamos un objeto para almacenar los resultados
    const resultado = {};

    // Iteramos sobre cada sección "enum"
    for (const section of enumSections) {
        if (section) {
            // Extraemos el nombre del enum y las opciones
            const [enumName, ...options] = section.rA(',', '\n').split(/\s+/);

            // Creamos un objeto para almacenar las opciones
            const enumObj = {};
            let nIndex = 0
            
            // Asignamos valores a las opciones
            options.forEach((option, index) => {
              if(option != 'end' && !(options.length-1==index)){
                if (option.includes('=')) {
                    let [name, value] = option.split('=');
                    if (!/("|')/.test(value)) {
                      value = Number(value)
                    }
                    enumObj[name.toUpperCase()] = value
                    nIndex = value
                } else {
                 if(typeof nIndex == "number"){
                  enumObj[option.toUpperCase()] = ++nIndex
                 }else{
                  enumObj[option.toUpperCase()] = option
                 }
                }
              }
            });

            // Agregamos el enum al resultado
            resultado[enumName.toUpperCase()] = enumObj
        }
    }
    return resultado;
}

async function LSget(url, color, saveAt) {
  saveAt = saveAt ?? url
  
  let text = LS.get(saveAt)
  
  if (text == undefined){
    text = await fetch(url)
    .then(response => {
 	    return fetchPercentece(response, color)
    })
    
    text = await text.text()
    LS.set(saveAt, text)
  }

  return text
}

let CUSTOM_ENUM = (await LSget(
  'https://library.sannybuilder.com/assets/sa/enums.txt',
  'pink',
  './data/enums.txt'
)).enumsGenerator()

let SASCM = (await LSget(
  'https://raw.githubusercontent.com/MatiDragon-YT/data/master/sa_cp/SASCM.INI',
  'cyan',
  './data/SASCM.INI'
))

let CUSTOM_KEYWORDS = (await LSget(
  'https://raw.githubusercontent.com/MatiDragon-YT/data/master/sa_cp/keywords.txt',
  'lime',
  './data/keywords.txt'
))

CUSTOM_KEYWORDS = 
CUSTOM_KEYWORDS.toLowerCase().split('\n').map(keyword =>{
  keyword = keyword.trim()
  if (!keyword.startsWith(';')){
    if (keyword != ''){
      keyword = keyword.split('=')
      return {
        key: keyword[1],
        opcode: keyword[0]
      }
    }
  }
}).clear()

// ----------------------------

let addClass = false
let currentClass = ''
let classes = {}
let CUSTOM_CLASSES = (await LSget(
  'https://library.sannybuilder.com/assets/sa/classes.db',
  'gray',
  './data/classes.db'
)) + (await LSget(
  './data/classes.db',
  '#373',
  './data/classesCP.db'
)) 

/*
CurrentWeapon(0@) = 23 // 01B9: 0@ 23
0@ = CurrentWeapon(1@) // 0470: 0@ 1@
CurrentWeapon(0@) == 34 //02D8: 0@ 34
*/

CUSTOM_CLASSES
  .toUpperCase()
  // Aquí se utiliza para eliminar comentarios de una sola línea que comienzan con ';'.
  .r(/[\x20\t]*;(.+)?$/gm, '')
  .split('\n')
  .clear()   // .clear elimina líneas vacias
  .forEach(line => {
    line = line.trim()
    // Aquí se manejan las directivas que indican el comienzo y fin de la lista de clases y las definiciones de clases.
    
    if (line == '#CLASSESLIST'){
      addClass = true;
    }
    else if (line == '#CLASSES') {
      addClass = false;
    }
    else if (line == '#EOF'){
      addClass = true;
    }
    else {
      // Si estamos en la sección de lista de clases, se crea un nuevo objeto para cada clase.
      if (addClass == true) {
        classes[line] = {}
      } else {
        // Si la línea comienza con '$', indica el comienzo o fin de una definición de clase.
        if (/^\$.+/m.test(line)) {
          if (line.toLowerCase() != '$begin'
            && line.toLowerCase() != '$end'
          ){
            // Extrae el nombre de la clase actual.
            currentClass = line.match(/^\$(.+)/m)[1]
          }
        } else {
          // Si la línea comienza con '^', se trata de una propiedad con operaciones y códigos asociados.
          if (line.startsWith('^')) {
            // Extrae el nombre de la propiedad.
            let propertyName = line.match(/\^(.*?),\[/)[1];
            // Extrae los datos asociados con la propiedad y los divide en un array.
            let data = line.match(/\[(.*?)\]/g).map(e => e.replace(/[\[\]]/g, '').split(','));
          
            // Inicializa un objeto para la propiedad dentro de la clase actual.
            classes[currentClass][propertyName] = {};
          
            // Itera sobre cada conjunto de operaciones y códigos para la propiedad.
            data.forEach(prop => {
              let [opCode, mathCode, pos, type, helpCode] = prop;
              // Realiza acciones basadas en el código matemático.
              switch (mathCode) {
                case '==':
                  classes[currentClass][propertyName].IS = opCode;
                  break;
                case '=':
                  if (pos === '1') {
                    classes[currentClass][propertyName].SET = opCode;
                  } else if (pos === '2') {
                    classes[currentClass][propertyName].GET = opCode;
                  }
                  break;
                case '+=':
                  classes[currentClass][propertyName].ADD = opCode;
                  break;
                case '>=':
                  classes[currentClass][propertyName].UPPER = opCode;
                  break;
                  // Se pueden agregar más casos según sea necesario.
              }
            });
          }
          // Si la línea contiene comas, se trata de una propiedad simple con un valor asociado.
          else if (/([^,]+),([^,]+)/.test(line)){
            // Extrae la clave y el valor de la propiedad.
            let temp =
              line.match(/([^,]+),([^,]+)/)
              
            // Crea un objeto temporal para la propiedad.
            let miember = {}
            miember[temp[1]] = temp[2]
            
            // Combina la propiedad con la clase actual.
            classes[currentClass] = { ...classes[currentClass],  ...miember}
          }
        }
      }
    }
  })
//log(classes)

let CUSTOM_VARIABLES = (await LSget(
  './data/CustomVariables.ini',
  'red'
))
CUSTOM_VARIABLES = CUSTOM_VARIABLES
	.r(/;.+/g,'')
	.r(/\r/g,'\n')
	.split('\n')
	.clear()
CUSTOM_VARIABLES.forEach((l,i)=>{
	CUSTOM_VARIABLES[i] = l.r(/(.+)=(.+)/,'$2=$1').toUpperCase().split('=')
})
CUSTOM_VARIABLES = Object.fromEntries(CUSTOM_VARIABLES)
//log(VARIABLE_ID_AVALIABLE)

let CONSTANTS = (await LSget(
  './data/constants.txt',
  'orange'
))
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

let MODELS = (await LSget(
  './data/models.ide',
  'yellow'
))

MODELS = MODELS
	.r(/\r/g,'')
	.r(/(\d+) (.+)/g, '$2 $1')
	.toUpperCase()
	.split('\n')
	.clear()
MODELS.forEach((e,i) => MODELS[i] = e.split(' '))
MODELS = Object.fromEntries(MODELS)

let SCM_DB = {}
let SCM_DB2 = {}
let DATA_DB = ''
let DATA_DB2 = ''

async function dbSBL2(game){
  DATA_DB2 = (await LSget(
    `https://raw.githubusercontent.com/sannybuilder/library/master/${game}/${game}.json`,
    '#10a122',
    './data/'+game+'.json'
  ))

  DATA_DB2 = JSON.parse(DATA_DB2)
  
	DATA_DB2.extensions.forEach(extension => {
		extension.commands.forEach((command) => {
		  let omitir = false
		  if (command?.attrs?.is_unsupported){
		    omitir = true
		  }
		  
		  if (!omitir){
  		  SCM_DB2[command.name.toLowerCase()] = 
  			  command.id.toLowerCase();
  			  
  			SCM_DB2[command.id.toLowerCase()] = {
  			  id: command.id.toLowerCase(),
  			  name: command.name,
  			  class: command.class ?? '',
  			  member: command.member ?? '',
  			  short_desc: command.short_desc ?? '',
  			  num_params: command.num_params ?? 0, 
  			  input: command.input ?? {},
  			  attrs: command.attrs ?? ''
  			}
		  }
		})
	})
	
	CUSTOM_KEYWORDS.forEach(keyword => {
	  //log(keyword)
	  SCM_DB2[keyword.key] = SCM_DB2[keyword.opcode] 
	})
	
	LS.set('shared_db', JSON.stringify(SCM_DB2))
	return true
}


async function dbSBL(game){
  DATA_DB = (await LSget(
    `https://raw.githubusercontent.com/sannybuilder/library/master/${game}/${game}.json`,
    '#10a122',
    './data/'+game+'.json'
  ))

  DATA_DB = JSON.parse(DATA_DB)
  
  //log(JSON.stringify(DATA_DB))
  
	DATA_DB.extensions.forEach(extension =>{
		//log(extension.name)
		extension.commands.forEach((command, c) =>{
		  let omitir = false
			
		  if (command.attrs) {
				if ("is_unsupported" in command.attrs) {
					omitir = true
				}
		  }
		  
		  if (!omitir){
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
		})
	})
	return true
}

const $IDE_mode = $('#mode')
if (LS.get('Compiler/IDE:mode') == null) LS.set('Compiler/IDE:mode', 'sa')
$IDE_mode.value = LS.get('Compiler/IDE:mode')
let game = LS.get('Compiler/IDE:mode')


let version = (await LSget(
  `https://raw.githubusercontent.com/sannybuilder/library/master/${game}/version.txt`,
  'purple',
  'version_sbl'
))
$('#version_sbl').innerHTML = 'SBL ' + version


await dbSBL(game)
await dbSBL2(game)

//log(SCM_DB2)

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
      
      if (/^then$/im.test(line)) {
        stacks.general.push('then');
        
        label = `if_${++counts.if}`
        line = [
          'goto_if_false @'+label+''
        ].join('\n')
        
        stacks.if.push(label);
      }
      else if (/^else$/im.test(line)) {
        if (stacks.general.slice(-1) != 'then'){
          throw new Error('cierre de pila inconclusa :'+stacks.general)
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
          throw new Error(`pila sintactica: vacia`)
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
          throw new Error(`pila sintactica: vacia`)
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
      throw new Error(`pila sintactica: `+stacks.general);
      
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
          throw new Error('>>> ERROR: continue - not found loop init')
        }else{
          result += 'goto @'+loopBehin+'\n'
        }
      } else if (/^break$/im.test(line)) {
        if (!loopBehin) {
          throw new Error('>>> ERROR: break -  not found loop init')
        }else {
          for (let s = i; s < lines.length; s++){
            const lineSearch = lines[s].trim()
          
            if (lineSearch.includes('// end-loop')) {
              loopEnd = lineSearch.slice(1)
              break;
            }
          }
          if (!loopEnd) {
            throw new Error('>>> ERROR: break -  not found loop init')
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
		} else if (/^(then|goto_if_false|else_jump|else_goto|jf|004D)/im.test(linea)) {
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

SP.eliminarComentarios = function() {
  let result = this
    .r(/\/\/.*$/gm, '')
		.r(/(\s+)?\/\*([^\/]*)?\*\//gm, '')
		.r(/(\s+)?\{([^\$][^\}]*(\})?)?/gm, '')
	
	return result
    .split('\n')
    .map(e => {return e.trim()})
    .clear()
    .join('\n')
}

SP.formatearScript = function() {
  let code = this
  
  code = code.split('\n').map(line => {
    return line.trim()
  }).join('\n')
  
  code = code
    .r(/^if /mgi, "if\n")
    .r(/^then /mgi, "then\n")
    .r(/^else /gmi, "else\n")
    .r(/ end$/mgi, "\nend\n")
    .r(/^repeat /mgi, "repeat\n")
  
  return code
}

function encontrarAdiciones(texto) {
  const patron1 = /(\d+@[if]?|[if]?(\$|&)\w+|\w+)/;
  const patron2 = /(\+\+|--)/;
  const resultados = [];
  let textoModificado = texto;

  // Función para buscar y procesar los patrones
  function buscarYProcesar() {
    const regex = new RegExp(`${patron1.source + patron2.source}|${patron2.source + patron1.source}`, 'gi');
    
    let match = regex.exec(textoModificado);
    while (match) {
      
      const indicePatron1 = match.index;
      const indicePatron2 = match[2] ? indicePatron1 + match[1].length : match.index;

      // Determinar la posición relativa y agregar al resultado
      if (match[3]) {
        resultados.push([match[0], 'derecha', match[3]]);
      } else {
        resultados.push([match[0], 'izquierda', match[4]]);
      }
      
      // Buscar el siguiente match
      match = regex.exec(textoModificado);
    }
  }

  // Iniciar la búsqueda y procesamiento
  buscarYProcesar();

  return resultados;
}

function encontrarTemporales(texto){
    const patronTemp = /(\d+@[if]?|[if]?[\$&]\w+|[a-z_]\w*)([\-+*\/])([\w#$&@.]+)/
    return texto.match(new RegExp(patronTemp.source, 'ig'))
}

SP.preProcesar = function() {
  let nString = ''
  
  this.formatearScript().split('\n').forEach(linea =>{
    let lineaAnterior = ""
    let lineaSiguiente = ""
    
    const patron1 = /(\d+@[if]?|[if]?(\$|&)\w+|[a-z_]\w*)/;
    const patron2 = /([+-]{2})/;
    const patron3 = /([\+\-\*\/])([\w#$&@.]+)/;
    
    const patronEn = new RegExp(`^(${patron1.source + patron2.source}|${patron2.source + patron1.source})$`, 'mi')
    
    const patronTemp = /(\d+@[if]?|[if]?[\$&]\w+|[a-z_]\w*)([\-+*\/])([\w#$&@.]+)/i
  
    if (!/^\w+:/.test(linea) && !patronEn.test(linea)){
      if (patron2.test(linea)){
        let operadores = encontrarAdiciones(linea)
       
        operadores.forEach(fix => {
          if (fix[1] == "derecha"){
            lineaSiguiente += fix[0] + '\n'
          } else {
            lineaAnterior += fix[0].r(fix[2])+fix[2] + '\n'
          }
          linea = linea.r(fix[2])
        })
        
        linea = lineaAnterior + linea +'\n'+ lineaSiguiente +'\n'
      }
      else if(patron3.test(linea)){
        let temporales = encontrarTemporales(linea)
        
        if (!temporales){
          throw new Error("Temporary values do not support the VALUE-ANY syntax, only VARIABLE-ANY.")
        }
        temporales.forEach(temporal =>{
          
          let sec = linea.match(patronTemp)
          let ant = '+'
          if (sec[2] == '+') ant = '-';
          if (sec[2] == '-') ant = '+';
          if (sec[2] == '/') ant = '*';
          if (sec[2] == '*') ant = '/';
          
          lineaAnterior += sec[1] + ' ' + sec[2] + '= ' + sec[3] + '\n'
          linea = linea.r(sec[0], sec[1])
          lineaSiguiente += sec[1] + ' ' + ant + '= ' + sec[3] + '\n'
          
          
        })
        linea = lineaAnterior + linea + '\n' + lineaSiguiente + '\n'
      }
    }
    
    nString += linea.trim() + '\n'
  })
  
  nString = nString
    .r(/^forEach (.+) => (.+)$/gim, input => {
      input = input.r(/^forEach\s*/im,'')
      
      let n = input.match(/(([^\(]+)\((.+),(\d+[isfv]?)\)) => (.+)/i)
      return `for ${n[3]} = 0 to ${n[4]} step 1\n`+
        n[5]+' = '+n[1]
    })
    .r(/^END(IF|WHILE|FOR)$/gim, 'END')
    .r(/^(\+\+|--)(.*)$/gm, '$2$1')
    .r(/(.+) = (\d+@b|b[\$&]\w+)/gim, '$2 == 0 ? $1 = 0 : $1 = 1')
    // char VAR1 =& VAR2
    .r(/^(char|actor) (.+) =& (.+)/gim, 'GET_PED_POINTER $3 $2')
    .r(/^object (.+) =& (.+)/gim, 'GET_OBJECT_POINTER $2 $1')
    .r(/^car (.+) =& (.+)/gim, 'GET_VEHICLE_POINTER $2 $1')
    .r(/^pickup (.+) =& (.+)/gim, 'GET_PICKUP_POINTER $2 $1')
    .r(/^task (.+) =& (.+)/gim, 'GET_CHAR_TASK_POINTER_BY_ID $2 $1')
    .r(/^fx (.+) =& (.+)/gim, 'GET_FX_SYSTEM_POINTER $2 $1')
    .r(/^model (.+) =& (.+)/gim, 'GET_MODEL_NAME_POINTER $2 $1')
    .r(/^(.+) =& @(.+)/gim, 'GET_LABEL_POINTER $2 @$1')
    .r(/^(.+) =& (.+)/gim, 'GET_VAR_POINTER $2 $1')
  	// 0@ = 1@ == 1 ? 0 : 1
  	.r(/^(.+) ([\-\+\*\/%]?=) (.+) \? (.+) \: (.+)$/gm,
  	  `if\n$3\nthen\n$1 $2 $4\nelse\n$1 $2 $5\nend\n`)
  	  
  	// 0@ == 1 ? 0 : 1
  	.r(/^(.+) \? (.+) \: (.+)$/gm, input =>{
  	  let vars = input.match(/^(.+)\?(.+)\:(.+)$/)
  	                  .map(e=> e.trim())
  	  
  	  vars[1] = vars[1].determineOperations()
  	  
  	  let operators = '==,!=,<=,>=,>,<,<>'
  	  
  	  operators.split(',').forEach(operador => {
  	    if (RegExp(operador).test(vars[1])){
  	      input =
  	        'if\n'+vars[1]+'\n'+
  	        'then\n'+vars[2].determineOperations()+'\n'+
  	        'else\n'+vars[3].determineOperations()+'\n'+
  	        'end\n'
  	    }
  	  })
  	  
  	  return input
  	})
  	.r(/^([^\s]+) \? ([^\s]+)$/gm, (i, ...m) => {
  	  
  	  let r = 
  	    'if\n'+
  	    m[0].determineOperations()+
  	    '\nthen\n'+
  	    m[1].determineOperations()+
  	    '\nend\n'
  	    
  	  //log(r)
  	  return r
  	})
  	.r(/^@(\w+)$/gm, 'goto @$1')
  	// bitExp
  	// a = b & c
  	.r(/^(.+) = (.+) (>>|<<|%|&|\^|\|)\x20?(.+)$/m, (input, ...match) => {
  	  let [var1, var2, operador, var3] = match
  	  
  	  let op = ""
  	  if (operador == "&") op = "0B10";
  	  if (operador == "|") op = "0B11";
  	  if (operador == "^") op = "0B12";
  	  if (operador == "~") op = "0B13";
  	  if (operador == "%") op = "0B14";
  	  if (operador == ">>") op = "0B15";
  	  if (operador == "<<") op = "0B16";
  	  
  	  let res = op+": "+var2+' '+var3+' '+var1
  	  
  	  return res
  	})
  	//0B1A: ~ 0@
  	.r(/^~(.+)/m, '0B1A: $1')
  	// x = x / x
  	.r(/^(.+) = (.+) \+ (.+)$/m, '0A8E: $2 $3 $1')
  	.r(/^(.+) = (.+) \- (.+)$/m, '0A8F: $2 $3 $1')
  	.r(/^(.+) = (.+) \* (.+)$/m, '0A90: $2 $3 $1')
  	.r(/^(.+) = (.+) \/ (.+)$/m, '0A91: $2 $3 $1')
    // 7@ = !7@
    .r(/(.+) = !(.+)$/gim,
`if
$2 == 1
then
$1 = 0
else
$1 = 1
end
`)
    // 7@ ||= $8
    .r(/(.+) \|\|= (.+)$/gim,
`if or
$1 == null
$1 == undefined
$1 == false
$1 == 0.0
$1 == NaN
then
$1 = $2
end
`)
    // 7@ = 7@ || $8
    .r(/(.+) = (.+) \|\| (.+)$/gim,
`if and
$2 != null
$2 != undefined
$2 != false
$2 != 0.0
$2 != NaN
then
$1 = $2
else
$1 = $3
end
`)
    // 7@ = 7@ ?? $8
    .r(/(.+) = (.+) \?\? (.+)$/gim,
`if and
$2 != null
$2 != undefined
then
$1 = $2
else
$1 = $3
end
`)
    // [] : variable con limites maximos
    // () : variable con valor en bucle
    // [min..max]:0@
    // [min..]:0@
    // [..max]:0@
    
    // function(...) | CLEO_CALL
    .r(/^(\w+)\((.+)\)$/gm, input=>{
      let vars = input.match(/([^\.\s\W]+)\((.+)\)$/m)
      
      let line = vars[2]
      let add = ''
      let inArray = false
      
      for (let i = 0; i < line.length; i++){
        if (line[i] == '(') inArray = true;
        if (line[i] == ')') inArray = false;
        
        add += inArray ? line[i].r(',', '\x01') : line[i].r(',', ' ')
      }
      
      let length = add.split(',').length
      
      input = 'cleo_call @'+vars[1]+' '+length+' '+add.rA('\x01', ',')+'\n'
      return input
    })
    // subrutine() | GOSUB
    .r(/^(\w+)\(\)$/gm, '\ngosub @$1\n')
  
  	return nString
}

const registroTipos = {};

function registrarTipo(variable, tipo) {
  if (/[@$&]/.test(variable)) {
    // Solo registrar si es una variable global o local
    variable = variable
      .r(/@[a-z]/i, '@')
      .r(/[a-z]$/i, '$')
      .r(/[a-z]&/i, '&')
      
    registroTipos[variable] = tipo;
  }
}

function obtenerTipo(variable) {
  if (!isNaN(variable)) {
    return variable.includes('.') ? 'FLOAT' : 'INT';
  } else if (variable.startsWith('"')) {
    return 'LONG'
  } else if (variable.startsWith("'")) {
    return 'SHORT'
  }

  // Verificar si el tipo de la variable ya está registrado
  if (registroTipos[variable]) {
    return registroTipos[variable];
  }

  const matchLocal = variable.match(/^(\d+@)([a-z])?/i);
  if (matchLocal) {
    const tipo = matchLocal[2];
    switch (tipo) {
      case 'i': return 'LVAR_INT';
      case 'f': return 'LVAR_FLOAT';
      case 's': return 'LVAR_SHORTSTRING';
      case 'v': return 'LVAR_LONGSTRING';
      default: return 'LVAR_INT'; // Tipo no especificado para variable local
    }
  }

  const matchGlobal = variable.match(/^([a-z])?([&$]\w+)/i);
  if (matchGlobal) {
    const tipo = matchGlobal[1];
    switch (tipo) {
      case 'i': return 'GVAR_INT';
      case 'f': return 'GVAR_FLOAT';
      case 's': return 'GVAR_SHORTSTRING';
      case 'v': return 'GVAR_LONGSTRING';
      default: return 'GVAR_INT'; // Tipo no especificado para variable local
    }
  }
}

function detectarOpcode(operacion) {
  const opcodes = {
    '=': {
      'GVAR_INT-INT': '4',
      'GVAR_FLOAT-FLOAT': '5',
      'LVAR_INT-INT': '6',
      'LVAR_FLOAT-FLOAT': '7',
      'GVAR_INT-GVAR_INT': '84',
      'LVAR_INT-LVAR_INT': '85',
      'GVAR_FLOAT-GVAR_FLOAT': '86',
      'LVAR_FLOAT-LVAR_FLOAT': '87',
      'GVAR_INT-LVAR_INT': '88',
      'LVAR_INT-GVAR_INT': '89',
      'GVAR_FLOAT-LVAR_FLOAT': '8A',
      'LVAR_FLOAT-GVAR_FLOAT': '8B',
    },
    '=#': {
      'GVAR_INT-GVAR_FLOAT': '8C',
      'GVAR_FLOAT-GVAR_INT': '8D',
      'LVAR_INT-GVAR_FLOAT': '8E',
      'LVAR_FLOAT-GVAR_INT': '8F',
      'GVAR_INT-LVAR_FLOAT': '90',
      'GVAR_FLOAT-LVAR_INT': '91',
      'LVAR_INT-LVAR_FLOAT': '92',
      'LVAR_FLOAT-LVAR_INT': '93',
    },
    '+=@': {
      'GVAR_FLOAT-FLOAT': '78',
      'LVAR_FLOAT-FLOAT': '79',
      'GVAR_FLOAT-GVAR_FLOAT': '7A',
      'LVAR_FLOAT-LVAR_FLOAT': '7B',
      'LVAR_FLOAT-GVAR_FLOAT': '7C',
      'GVAR_FLOAT-LVAR_FLOAT': '7D',
    },
    '-=@': {
      'GVAR_FLOAT-FLOAT': '7E',
      'LVAR_FLOAT-FLOAT': '7F',
      'GVAR_FLOAT-GVAR_FLOAT': '80',
      'LVAR_FLOAT-LVAR_FLOAT': '81',
      'LVAR_FLOAT-GVAR_FLOAT': '82',
      'GVAR_FLOAT-LVAR_FLOAT': '83',
    },
    '+=': {
      'GVAR_INT-INT': '8',
      'GVAR_FLOAT-FLOAT': '9',
      'LVAR_INT-INT': 'A',
      'LVAR_FLOAT-FLOAT': 'B',
      
      'GVAR_INT-GVAR_INT': '58',
      'GVAR_FLOAT-GVAR_FLOAT': '59',
      'LVAR_INT-LVAR_INT': '5A',
      'LVAR_FLOAT-LVAR_FLOAT': '5B',
      'LVAR_INT-GVAR_INT': '5C',
      'LVAR_FLOAT-GVAR_FLOAT': '5D',
      'GVAR_INT-LVAR_INT': '5E',
      'GVAR_FLOAT-LVAR_FLOAT': '5F',
    },
    '-=': {
      'GVAR_INT-INT': 'C',
      'GVAR_FLOAT-FLOAT': 'D',
      'LVAR_INT-INT': 'E',
      'LVAR_FLOAT-FLOAT': 'F',
      
      'GVAR_INT-GVAR_INT': '60',
      'GVAR_FLOAT-GVAR_FLOAT': '61',
      'LVAR_INT-LVAR_INT': '62',
      'LVAR_FLOAT-LVAR_FLOAT': '63',
      'LVAR_INT-GVAR_INT': '64',
      'LVAR_FLOAT-GVAR_FLOAT': '65',
      'GVAR_INT-LVAR_INT': '66',
      'GVAR_FLOAT-LVAR_FLOAT': '67',
    },
    '*=': {
      'GVAR_INT-INT': '10',
      'GVAR_FLOAT-FLOAT': '11',
      'LVAR_INT-INT': '12',
      'LVAR_FLOAT-FLOAT': '13',
      
      'GVAR_INT-GVAR_INT': '68',
      'GVAR_FLOAT-GVAR_FLOAT': '69',
      'LVAR_INT-LVAR_INT': '6A',
      'LVAR_FLOAT-LVAR_FLOAT': '6B',
      'LVAR_INT-GVAR_INT': '6C',
      'LVAR_FLOAT-GVAR_FLOAT': '6D',
      'GVAR_INT-LVAR_INT': '6E',
      'GVAR_FLOAT-LVAR_FLOAT': '6F',
    },
    '/=': {
      'GVAR_INT-INT': '14',
      'GVAR_FLOAT-FLOAT': '15',
      'LVAR_INT-INT': '16',
      'LVAR_FLOAT-FLOAT': '17',
      
      'GVAR_INT-GVAR_INT': '70',
      'GVAR_FLOAT-GVAR_FLOAT': '71',
      'LVAR_INT-LVAR_INT': '72',
      'LVAR_FLOAT-LVAR_FLOAT': '73',
      'LVAR_INT-GVAR_INT': '74',
      'LVAR_FLOAT-GVAR_FLOAT': '75',
      'GVAR_INT-LVAR_INT': '76',
      'GVAR_FLOAT-LVAR_FLOAT': '77',
    },
    '>': {
      'GVAR_INT-INT': '18',
      'LVAR_INT-INT': '19',
      'INT-GVAR_INT': '1A',
      'INT-LVAR_INT': '1B',
      'GVAR_INT-GVAR_INT': '1C',
      'LVAR_INT-LVAR_INT': '1D',
      'GVAR_INT-LVAR_INT': '1E',
      'LVAR_INT-GVAR_INT': '1F',
      'GVAR_FLOAT-FLOAT': '20',
      'LVAR_FLOAT': '21',
      'FLOAT-GVAR_FLOAT': '22',
      'FLOAT-LVAR_FLOAT': '23',
      'GVAR_FLOAT-GVAR_FLOAT': '24',
      'LVAR_FLOAT-LVAR_FLOAT': '25',
      'GVAR_FLOAT-LVAR_FLOAT': '26',
      'LVAR_FLOAT-GVAR_FLOAT': '27',
    },
    '>=': {
      'GVAR_INT-INT': '28',
      'LVAR_INT-INT': '29',
      'INT-GVAR_INT': '2A',
      'INT-LVAR_INT': '2B',
      'GVAR_INT-GVAR_INT': '2C',
      'LVAR_INT-LVAR_INT': '2D',
      'GVAR_INT-LVAR_INT': '2E',
      'LVAR_INT-GVAR_INT': '2F',
      'GVAR_FLOAT-FLOAT': '30',
      'LVAR_FLOAT': '31',
      'FLOAT-GVAR_FLOAT': '32',
      'FLOAT-LVAR_FLOAT': '33',
      'GVAR_FLOAT-GVAR_FLOAT': '34',
      'LVAR_FLOAT-LVAR_FLOAT': '35',
      'GVAR_FLOAT-LVAR_FLOAT': '36',
      'LVAR_FLOAT-GVAR_FLOAT': '37',
    },
    '==': {
      'GVAR_INT-INT': '38',
      'LVAR_INT-INT': '39',
      'GVAR_INT-GVAR_INT': '3A',
      'LVAR_INT-LVAR_INT': '3B',
      'GVAR_INT-LVAR_INT': '3C',
      
      'GVAR_FLOAT-FLOAT': '42',
      'LVAR_FLOAT-FLOAT': '43',
      'GVAR_FLOAT-GVAR_FLOAT': '44',
      'LVAR_FLOAT-LVAR_FLOAT': '45',
      'GVAR_FLOAT-LVAR_FLOAT': '46',

      'GVAR_SHORTSTRING-SHORT': '5A9',
      'LVAR_SHORTSTRING-SHORT': '5AA',
      'GVAR_SHORTSTRING-LVAR_SHORTSTRING': '5AD',
      'LVAR_SHORTSTRING-LVAR_SHORTSTRING': '5AE',
      
      'LVAR_INT-GVAR_INT': '7D6',
      'LVAR_INT-GVAR_FLOAT': '7D7',
    },
    '&=':'B17',
    '|=':'B18',
    '^=':'B19',
    '%=':'B1B',
    '>>=':'B1C',
    '<<=':'B1D',
    // Agrega otros operadores y sus combinaciones de opcodes
  };

  const simple = /^([a-z]?[$&]\w+|\d+@[a-z]?|-?\d+(\.\d+)?)\s*(=(#|&)|[+\-]=@|[\/\*\+\-\=\!><]*=|>|<)\s*([a-z]?[$&]\w+|\d+@[a-z]?|-?\d+(\.\d+)?)$/im
  
  function dividirOperacion(operacion) {
    const partes = operacion.match(simple)
    
    if (partes) {
      return [partes[1], partes[3], partes[5]]
    } else {
      return new Error('La operación no es válida')
    }
  }


  let [
    variable1, operador, variable2
  ] = dividirOperacion(operacion)
  
  let esNegado = /\<=|<|<>|\!=/.test(operador)
  if (esNegado){
    operador = operador
    .replace('<=', '>')
    .replace('<', '>=')
    .replace(/\<>|\!=/, '==')
  }
  
  //console.log({operador, esNegado, variable1, variable2})
  
  // Para saber el tipo de datos y prevenir que el tipo de dato cambie cuando se aplica a la misma variable.
  let tipoVariable1 = obtenerTipo(variable1);
  let tipoVariable2 = variable1 == variable2
    ? tipoVariable1
    : obtenerTipo(variable2)
  
  // Para establecer el tipo de variable, segun el tipo de dato primitivo INT o FLOAT.
  if ( /INT/.test(tipoVariable1)
    && /FLOAT/.test(tipoVariable2)
  ){
    tipoVariable2 == "FLOAT"
    ? tipoVariable1 = tipoVariable1.replace("INT","FLOAT")
    : tipoVariable2 = tipoVariable2.replace("FLOAT","INT")
  }
  else if (/FLOAT/.test(tipoVariable1)
    && /INT/.test(tipoVariable2)
  ){
    tipoVariable2 == "INT"
    ? tipoVariable1 = tipoVariable1.replace("FLOAT","INT")
    : tipoVariable2 = tipoVariable2.replace("INT","FLOAT")
  }
  
  if (operador == '=#'){
    // Para convertir un tipo a otro, es necesacio que sean diferentes, y no queremos que se recambie el tipo de dato si usamos la misma variable. ¿Oh si?
    if (tipoVariable1 == tipoVariable2){
      if (/GVAR/.test(tipoVariable2)){
        tipoVariable2 = tipoVariable2 == "GVAR_FLOAT"
          ? "GVAR_INT"
          : "GVAR_FLOAT"
      } else {
        tipoVariable2 = tipoVariable2 == "LVAR_FLOAT"
          ? "LVAR_INT"
          : "LVAR_FLOAT"
      }
    }
  }
  
  if (operador.i('=@/')){
    tipoVariable1 = tipoVariable1.replace('INT', 'FLOAT')
    tipoVariable2 = tipoVariable2.replace('INT', 'FLOAT')
  }
  
  const combinacionTipos = `${tipoVariable1}-${tipoVariable2}`
  let opcode = opcodes[operador][combinacionTipos];

  if (!opcode) {
    throw new Error('Operación no válida');
  }

  // Registrar solo las variables, no los números literales
  registrarTipo(variable1, tipoVariable1);
  registrarTipo(variable2, tipoVariable2);
  
  if (variable1 != variable2){
    if (tipoVariable1 == tipoVariable2)
      registrarTipo(variable2, tipoVariable2);
    else
      registrarTipo(variable2, tipoVariable1);
  }
  
  if (esNegado){
    opcode = (parseInt(opcode, 16) | 1 << 15)
      .toString(16)
      .toUpperCase()
  }
  opcode = opcode.padStart(4,'0')
  
  //console.log({opcode, variable1, tipoVariable1, operador, variable2, tipoVariable2})
  
  return opcode;
}

SP.operationsToOpcodes = function () {
  const simple = /^([a-z]?[&$]\w+|\d+@[a-z]?|-?\d+(\.\d+)?)\s*(=(#|&)|[+\-]=@|[\/\*\+\-\=\!><]*=|>|<)\s*([a-z]?[$&]\w+|\d+@[a-z]?|-?\d+(\.\d+)?)$/im
  
  const addition = /^(\d+@\w?|\w?[$&]\w+|\w+)\s*(\+\+|--)$/

  const resultado = this.split('\n').map(linea => {
    linea = linea.trim()
    if (simple.test(linea)) {
      // Procesar la línea con la operación
      const opcodeDetectado = detectarOpcode(linea)
      return `${opcodeDetectado}: ${linea}`
    }
    else if (addition.test(linea)) {
      const operation = linea.i('++') ? '+=' : '-='
      linea = linea.r(/\-\-|\+\+/)
      
      if (linea.toUpperCase() in CONSTANTS){
        linea = CONSTANTS[linea.toUpperCase()]
      }
      
      const tipo = obtenerTipo(linea).i('FLOAT') ?
        '1.0' :
        '1'
     
      linea = `${linea} ${operation} ${tipo}`
      const opcodeDetectado = detectarOpcode(linea)
      
      return `${opcodeDetectado}: ${linea}`
    }
    else {
      // Mantener la línea original si no es una operación
      return linea
    }
  }).join('\n')
  
  return resultado
}

SP.transformTypeData = function(){
  const nString = this.split('\n').map(line=>{
    return line.dividirCadena().map(param =>{
      let isNumberNegative =
        param.startsWith('-') ? '-' : ''
      param = param.r(/^-/)
      
      if (isNoteCientific(param)){
        return (+param)+""
      }
      
      param = param
      .r(/^\.?\d+(\.\d+)?(ms|[smh]|fps)$/mi, second => {
        second = second.toLowerCase()
        
        if (second.i('fps'))
          second = (~~(1000 / (+second.r('fps', ''))))+""
        if (second.i('ms'))
          second = second.r('ms')
        if (second.i('s'))
          second = (~~(+second.r('s', '') * 1_000))+""
        if (second.i('m'))
          second = (~~(+second.r('m', '') * 60_000))+""
        if (second.i('h'))
          second = (~~(+second.r('h', '') * 3_600_000))+""
        
        return isNumberNegative + second
      })
      .r(/^\.?\d([\._\df]+)?(\.[_\df]+)?$/mi, num=>{
        return isNumberNegative + num
        .r(/_/g,'')
        .r(/(\.|f)$/mi,'.0')
        .r(/^\./m, '0.')
      })
      .r(/^0b\d+$/im, bin => {
        if (/[ac-z]/i.test(bin)){
          return new SyntaxError("Secuencia BIN: Solo usar ceros y unos (0 y 1)")
        }
       	return isNumberNegative+bin.r(/-?0b/i,'').binToDec()
      })
      .r(/^0x\w+$/im, hex => {
        if (/[g-wyz]/i.test(hex)){
          return new SyntaxError("Secuencia HEX: Solo usar caracteres del rango 0-9 y del A-F.")
        }
        return isNumberNegative+hex.r(/-?0x/i,'').hexToDec()
      })
      .r(/^#\w+$/mi, model =>{
      	model = model.r('#','').toUpperCase()
      	
      	if (model in MODELS) {
      	  model = MODELS[model]
      	} else {
      		return new SyntaxError(`Model undefined: #${model}`);
        }
        return isNumberNegative + model
      })
      return param
    }).join(' ')
  }).join('\n')
  //log(nString)
  
  return nString
}

SP.constantsToValue = function(){
  const nString = this.split('\n').map(line=>{
    line = line.dividirCadena().map(param=>{
      param = param.trim()
      let pref = ""
      if (param != ''){
        if (/^[\!\-\+][a-z]\w*$/m.test(param)){
          pref = param.match(/^\W/m)
          param = param.r(/^\W/m)
        }
        
        if (param.toUpperCase() in CONSTANTS){
          return pref + CONSTANTS[param.toUpperCase()]
        }
        else if (
          /^[a-z]\w+\.\w+$/im.test(param)
        ) {
          let [head, extend] = param.split('.').map(a => {
            return a.toUpperCase()
          })
          let ret = ''
          
          if (
            head in CUSTOM_ENUM 
            && extend in CUSTOM_ENUM[head]
          ){
            ret = CUSTOM_ENUM[head][extend]
          }else{
            ret = param
          }
          
          return ret
        }
        //else if (/^[+\-=^&$*]/)
          
        return param
      }
      return param
    }).join(' ')
    //log(line)
    return line
    //log(line)
  }).join('\n')

  //log(nString)
	
  return nString
}

/*
CurrentWeapon(0@) = 23 // 01B9: 0@ 23
0@ = CurrentWeapon(1@) // 0470: 0@ 1@
CurrentWeapon(0@) == 34 //02D8: 0@ 34
CurrentWeapon(0@) > 34 //02D7: 0@ 34
*/

SP.classesToOpcodes = function(){
  //console.clear()
  const MATCH = {
    CLASSE_MEMBER: /(\w+)\.(\w+)\((.+)?\)/m,
    OPERATION: /(==|\+=|=|>)/,
    VARIABLE: "(\d+@(\w|(\([\(\)]+\)))?|\w?($|&)\w+(\([\(\)]+\)))?)",
    
    SIMPLE: /^(\w+)\.(\w+)\(([^\n]*)\)$/mi,
    CONTINUE: /^\.(\w+)\((.+)?\)$/mi,
    METHOD: /^(\w+)?\.(\w+)$/mi,
    
    SET: /\.[^(]+\(.+=/,
    GET: /=.+\.[^(]+\(/,
    IS: /\.[^=]+==/,
    UPPER: /\.[^>]+>/,
  }
  
  let ncode = ''
  let lastClass = ''
  
  this.split('\n').forEach(line =>{
    line = line.trim()
    
    let isClass = false
    if (/([a-z]\w+)?\.([a-z]\w+)/i.test(line)){
      line.match(/([a-z]\w+)?\.([a-z]\w+)/ig).forEach(c=>{
        c = c.match(/([a-z]\w+)?\.([a-z]\w+)/i)
        
        if (!isClass){
          if(c[1] == undefined){
            if (lastClass){
              c[1] = lastClass
            } else {
              throw new Error("CLASS UNDEFINED:\n>> "+line)
            }
          }else {
            lastClass = c[1]
          }
          isClass = Input.isClass(c[1]+'.'+c[2])
        }
      })
    }
    
    if (isClass){
    let isNegative = line.startsWith('!');
    if (isNegative) line = line.r('!');
    
    let opcode = null;
    
    let data = {}
    let h
    
    if (MATCH.METHOD.test(line)){
      let matching = [];
      
      [line, ...matching] = line.match(MATCH.METHOD)
      
      matching = matching.map(e=>{
        return e ? e.toUpperCase() : ""
      })
      
      if (matching[0] == ""){
        matching[0] = lastClass
      } else {
        lastClass = matching[0]
      }
      
      if (!(matching[0] in classes)) {
        throw new Error("CLASS UNDEFINED:\n>> " + matching[0])
      }
      if (!(matching[1] in classes[matching[0]])) {
        throw `MEMBER UNDEFINED:\n>> ${matching[0]}.${matching[1]}`
      }
      let opcode = classes[matching[0]][matching[1]]
      
      if (typeof opcode == "object") {
        if (Object.keys(opcode).length >= 2) {
          throw `METHOD NOT AVAILABLE:\nMethods must be written with their class.\n>> ${matching[1]}`
        }
        else {
          opcode = Object.values(opcode)[0]
        }
      }
      line = opcode+':'
    }
    
    if (MATCH.CONTINUE.test(line)){
      line = lastClass+line
    }
    
    if (MATCH.CLASSE_MEMBER.test(line)){
      [h,data.clase, data.miembro, data.resto] = line.match(MATCH.CLASSE_MEMBER)
      data.clase = data.clase.toUpperCase()
      data.miembro = data.miembro.toUpperCase()
      
      
      data.operador = "FUNC"
      let iset;
        if(MATCH.IS.test(line)) {
          iset = line.match(
            /\((.+)\)(.+)?[=!]=(.+)/
          )
          if (line.i('!=')){
            isNegative = true
          }
          
          data.paramFront = iset[1]
          data.paramRear = iset[3]
          data.operador = "IS"
        }
        else if(MATCH.UPPER.test(line)) {
          iset = line.match(
            /\((.+)\)(.+)?[><](.+)/
          )
          if (line.i('<')){
            isNegative = true
          }
          
          data.paramFront = iset[1]
          data.paramRear = iset[3]
          data.operador = "UPPER"
        }
        else if (MATCH.GET.test(line)) {
          iset = line.match(
            /(.+)=(.+)\((.+)\)/
          )
          
          data.paramFront = iset[3]
          data.paramRear = iset[1]
          data.operador = "GET"
        }
        else if(MATCH.SET.test(line)) {
          iset = line.match(
            /\((.+)\)(.+)?=(.+)/
          )
          
          data.paramFront = iset[1]
          data.paramRear = iset[3]
          data.operador = "SET"
        }
      
      
      if (!(data.clase in classes)) {
        throw new Error("CLASS UNDEFINED:\n>> " + matching[0])
      }
      lastClass = data.clase
      if (!(data.miembro in classes[data.clase])) {
        throw `MEMBER UNDEFINED:\n>> ${matching[0]}.${matching[1]}`
      }
      
      let queEs = classes[data.clase][data.miembro]
      
      if (data.operador == "FUNC"){
        if (typeof queEs == "object") {
          if (Object.keys(queEs).length >= 2) {
            throw `METHOD NOT AVAILABLE:\nMethods must be written with their class.\n>> ${data.miembro}`
          }
          else {
            queEs = Object.values(queEs)[0]
          }
        }
        line = queEs + ': ' + data.resto
      }
      else {
        if (typeof queEs == "object") {
          line = Object.values(queEs)[0]
        } else {
          line = queEs
        }
        line += ': ' + data.paramFront + " " + data.paramRear
      }
    }
    
    let depureLine = ''
    let inString = false
    for (let i = 0; i < line.length; i++){
      if (
        line[i] == '"'
        || line[i] == "'"
        || line[i] == '`'
        || line[i] == '('
        || line[i] == ')'
      ){
        inString = !inString
      }
      
      if (line[i] == ','){
        if (inString == true){
          depureLine += line[i]
        } else {
          depureLine += ' '
        }
      }else{
        depureLine += line[i]
      }
    }
    line = depureLine
    
    
    if (isNegative){
      line = line
      .r(/^([\w\d]+):/im, (input, mat)=>{
        let op = (Number(mat.hexToDec()) + 0b1000000000000000)
        .toString(16)
        .padStart(4, '0')
        return op+': '

      })
    }
    }
    
    ncode += line + '\n'
  })
  
  return ncode
}


SP.keywordsToOpcodes = function(){
  let nString = ''
  
  this.split('\n').forEach(line => {
    let isNegative = false
    let nLine = ''
    
    let params = line.dividirCadena()
    // SCM_DB
    params.forEach((param, pos) => {
      if (pos == 0){
        if (/^\!?[a-z]\w+/mi.test(param)){
          let isNegative = param[0] == '!'
          let keyword = /^\!?(\w+)/m.exec(param)[1].toLowerCase()
            
          if (keyword in SCM_DB2){
            
            param = SCM_DB2[keyword].opcode ?? SCM_DB2[keyword].id ?? SCM_DB2[keyword]
            
            if (typeof SCM_DB2[keyword] == 'string'){
              
            }
            
            
            if (isNegative){
              param = param.setOpcodeNegative()
            }
            
            param = param +': '
          }
          
        }
      }
      nLine += param +' '
    })
		
    nString += nLine.trim() + '\n'
  })
  
  return nString
}

SP.dividirCadena = function() {
    const resultado = [];
    let dentroComillas = false;
    let subcadenaActual = '';
    let comilla = 0

    for (let i = 0; i < this.length; i++) {
        const caracter = this[i];
        const caracterAnterior = this[i-1];

        if (caracter === '"' || caracter === "'"){
          if (caracterAnterior != '\\') {
             dentroComillas = !dentroComillas;
          }
          
          subcadenaActual += caracter;
        } else if (caracter === ' ' && !dentroComillas) {
            // Si encontramos un espacio fuera de las comillas, guardamos la subcadena actual
            if (subcadenaActual.trim() !== '') {
                resultado.push(subcadenaActual);
            }
            subcadenaActual = '';
        } else {
            subcadenaActual += caracter;
        }
    }

    // Al final, si hay una subcadena no vacía, la agregamos al resultado
    if (subcadenaActual.trim() !== '') {
        resultado.push(subcadenaActual);
    }
    return resultado;
}

SP.fixOpcodes = function(){
  let tm = this.split('\n').map(line => {
    let negado = false
    line = line.trim().dividirCadena()
    
    //log(line)
    if (line.length >= 1){
    if (line[0].length < 5 && line[0].endsWith(':')){
      line[0] = line[0].r(/:$/m)
      if (line[0].startsWith('!')){
        line[0] = line[0].r(/^\!/m).hexToDec()
        line[0] += 0b1000000000000000
        line[0] = line[0].toString(16)
      }
      line[0] = (line[0]+'').padStart(4, '0') + ':'
    }
      
    }
    
    line = line.join(' ')
    return line
  }).join('\n')
  
  return tm
}

SP.determineOperations = function(){
  let h = this.split('\n')
  let n = ''
  
  h.forEach(s => {
    s = s.trim()
    if (/^\!?(\d+@[a-z]?|[a-z]?\$\w+|[a-z]?&\d+)$/mig.test(s)) {
      if (s.i('!')){
        s = s.r('!') +' == 0'
      }else{
        s = s + ' == 1'
      }
    }
    n += s + '\n'
  })
  
  return n
}

let Input = {
  isLong: x => /^".*"$/m.test(x),
  isShort: x => /^'.*'$/m.test(x),
  isFormat: x => /^`.*`$/m.test(x),
  isString : x => {
    return (Input.isLong(x)
    || Input.isShort(x)
    || Input.isFormat(x))
  },
  isInt : x => /^[+-]?\d[\d_]*$/m.test(x),
  isFloat : x => /^[+-]?(\.\d[\d_]*|\d[\d_]*[f\.][\d_]*)$/mi.test(x),
  isNote: x => /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)$/m.test(x),
  isTime: x => /^[+-]?(\d+\.\d+|\.?\d+)(fps|[smh])$/.test(x),
  isHexInt: x => /^0x[\da-f]+$/im.test(x),
  isHexFloat: x => /^0x[\da-f]+(\.[\da-f]*)?p[+-]?\d+$/im.test(x),
  isHex: x => isHexInt(x) ?? isHexFloat(x),
  isModel: x => /^#\w+$/m.test(x),
  isNumber: x => {
    return (Input.isTime(x)
    || Input.isNote(x)
    || Input.isFloat(x)
    || Input.isInt(x)
    || Input.isHex(x))
  },
  isOpcode: x => /^[a-f\d]+:$/mi.test(x),
  isKeyword: x => {
    if (/^[a-z]\w*$/mi.test(x)){
      let keys = `while,end,if,then,else,repeat,until,for,int,float,string,short,long`.split(',')
      
      if (keys.i(x)){
        return true
      }
      
      return SCM_DB2[x]
    }
    return false
  },
  isClass: x => {
    x = x.toUpperCase()
    let m =
      x.match(/^([a-z]\w*)\.([a-z]\w*)\(([^\n]*)\)$/mi)
      || x.match(/^([a-z]\w*)\.([a-z]\w*)$/mi)
    if (m){
      return (m[1] in classes && m[2] in classes[m[1]])
    }
    return false
  },
  isCommand: x => {
    return (Input.isOpcode(x)
    || Input.isKeyword(x)
    || Input.isClass(x))
  },
  isConstant: x => {
    if (/^\w+$/mi.test(x)){
      x = x.toUpperCase()
      
      return x in CONSTANTS
    }
    return false
  },
  isEnum: x => {
    x = x.toUpperCase()
    let m = x.match(/^([a-z]\w*)\.(\w*)$/mi)
    
    if (m){
      return (m[1] in CUSTOM_ENUM && m[2] in CUSTOM_ENUM[m[1]])
    }
    return false
  },
  isValueSimple: x => {
    return (Input.isConstant(x)
    || Input.isEnum(x))
  },
  isLocalVar: x => {
    return /^\d+@[a-z]?/im.test(x)
  },
  isGlobalVar: x => {
    return /^[a-z]?\$\w+/im.test(x)
  },
  isAdmaVar: x => {
    return /^[a-z]?&\w+/im.test(x)
  },
  isLocalVarArray: x => /^\d+@[a-z]?(\(.+,\d+[a-z]?\))?/im.test(x),
  isGlobalVarArray: x => /^[a-z]?\$\w+(\(.+,\d+[a-z]?\))?/im.test(x),
  isAdmaVarArray: x => /^[a-z]?&\w+(\(.+,\d+[a-z]?\))?/im.test(x),
  isNegate: x => /^\!.+/m.test(x),
  isNegative: x => /^\-.+/m.test(x),
  isPositive: x => /^\+.+/m.test(x),
  isVariable : x => {
    return (Input.isLocalVar(x)
    || Input.isGlobalVar(x)
    || Input.isAdmaVar(x)
    || Input.isLocalVarArray(x)
    || Input.isGlobalVarArray(x)
    || Input.isAdmaVarArray(x))
  },
  isLabel : x => /^[:@]\w+$/m.test(x),
  isValid: x => {
    return (Input.isCommand(x)
    || Input.isNumber(x)
    || Input.isString(x)
    || Input.isVariable(x)
    || Input.isValueSimple(x)
    || Input.isLabel(x))
  },
  whatIs: x => {
    if (Input.isValid(x)){
      if (Input.isLabel(x)) return 'label';
      if (Input.isCommand(x)) return 'command';
      if (Input.isNumber(x)) return 'number';
      if (Input.isString(x)) return 'string';
      if (Input.isVariable(x)) return 'variable';
      if (Input.isValueSimple(x)) return 'constant';
    }else{
      return undefined
    }
  }
}

//log(Input.whatIs('_Player'))

SP.adaptarCodigo = function(){
  let result = this
    .eliminarComentarios()
    .preProcesar()
    .formatearScript()
    .parseHigthLevelLoops()
    .addBreaksToLoops()
    .addNumbersToIfs()
    .eliminarComentarios()
    .r(/^not /gm, '!')
    .classesToOpcodes()
    .constantsToValue()
    .transformTypeData()
    .determineOperations()
    .operationsToOpcodes()
    .keywordsToOpcodes()
    .fixOpcodes()
   return result
}

SP.Translate = function(_SepareWithComes = false, _addJumpLine = false){
	let LineComand = this

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
  function translateGvar(dataInput){
    dataInput = 
      (Number(dataInput.r(/(\w)?&/,'')) * 4)
      .toString(16)
			.padStart(4,'0')
			.toBigEndian()
	
		return dataInput
  }

  LineComand = LineComand
  .adaptarCodigo()
	
  LineComand = LineComand
		.split('\n')
		
	let codeOfEnter = this.split('\n').clear();

	LineComand.forEach((Line, numLine) => {
	  Line = Line.trim()
		if (Line.match(/^:/)) {
		  // si es una etiqueta
			totalSizePerLine.push(Line.r(':','').toUpperCase())
		}
		else {
			LineComand[numLine] = Line.dividirCadena()
			.map(data => {
			  data = data.trim()
			  if (/^[=!\-+*\/%\^#@<>&$]+$/mi.test(data)) {
			       data = ''
			  }
			  if (/^[a-z]\w+\.\w+$/mi.test(data)) {
			       throw new ReferenceError(`is not defined\n>>> ${data}\nat ${Line}`)
			  }
			  return data
			})
			
			let lineDepurated = []
			let setOp = ''
			let isNegative = false
			let command = ''
			let typeData = ''
			
			LineComand[numLine].forEach((Argument, numArgument) => {
			  
				if (numArgument >= 1) {
					if (/^[=!\-+*\/%\^#@<>&$]+$/mi.test(Argument)) {
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
						/[a-f\d]+:$/im.test(Argument)
						&& Argument.length <= 6
					){
						// is opcode
						Argument = Argument.r(':','').r('!', '8').padStart(4,'0')
						Argument = Argument.length > 4 ? Argument.r(/^./m,'') : Argument
						setOp = Argument

						if(/^[8-9A-F]/mi.test(Argument)){
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

						if (SCM_DB2[Argument]){
							setOp = SCM_DB2[Argument]
						}else{
							//log(`KEYWORD UNDEFINED: ${Argument}\nCHANGED TO 0000: nop`)
							if (Line.endsWith('=')){
							  throw new SyntaxError(`missing parameter\n\tin line ${(1+numLine)} the trigger ${Argument}\n\t${setOp == '0000' ? 'XXXX' : setOp}>> ${Line}`)
							}else{
							  throw new SyntaxError(`opcode undefined\n\tin line ${(1+numLine)} the trigger ${Argument}\n\t${setOp == '0000' ? 'XXXX' : setOp}>> ${Line}`)
							};
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
					  if (SCM_DB[command] == undefined
					    && command.length == 4
					  ){
					    typeData = 'any'
  					} else {
  					  typeData = SCM_DB[command]
  						  ? SCM_DB[command].params[--numArgument]
  						  : SCM_DB[command.r(/^8/m,'0')].params[--numArgument];
					  }
						
					}catch{
						throw new SyntaxError(`unknown parameter\n\tat line ${(1+numLine)} the value ${Argument}\n\ttrigger: ${setOp == '0000' ? 'XXXX' : setOp}\n\t>>> ${Line}\n\t>>> ${command}`);
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
						if (/^[\d#\-+\.]/m.test(Argument))
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
          
          SP.parseCharScape = function(){
            let nString = this
					  .rA('\\n','\n')
						.rA('\\t','\t')
					  .rA('\\\\','\\')
		  		  .rA("\\'","'")
						.rA("\\`","`")
					  .rA('\\"','"')
            .r(/\\x([A-Fa-f\d]+)/gi,(match, content)=> {
              //log(content)
             	return String.fromCharCode(content.hexToDec())
             })
            
            for (let i = 0; i < nString.length; i++) {
              const valorASCII = nString.charCodeAt(i);
              if ( valorASCII > 255) {
                throw Error("Scripts do not support characters outside the ACSII range 0-255 in Strings")
              }
            }
            
            return nString
          }
          
          if (
            !Argument.i('@')
            && !Argument.i('$')
            && !Argument.i('"')
            && !Argument.i('`')
            && !Argument.i('&')
            && !Argument.i('#')
            && !Argument.i('.')
            && !/\d/.test(Argument)
          ){
            typeData = 'trash'
          }
          
					switch (typeData) {
						case 'short':
							Argument = Argument
							.r(/^'(.+)'$/m, '$1')
							.parseCharScape()
							
							Argument = Argument.substring(0,7)
							totalSizePerLine.push(9)

							Argument = (come(TYPE_CODE.STRING8) + Argument.toUnicode() + '-00').padEnd(26,'-00')
						break;

						case 'long':
							Argument = Argument
							.r(/("([^\"]+)?"|`(.+)?`)/, '$2$3')
							.r(/\x00/g,'\x20')
							.parseCharScape()
							
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
							let isNumberNegative = /^-/m.test(Argument)
							
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
							
              if(isNoteCientific(Argument)){
                Argument = (+Argument)
              }
              else {
							  Argument = Argument.r('f','')
              }
              
              Argument = come(TYPE_CODE.FLOAT32) + Number(Argument).toHex()
              
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
							else{ // no es areay
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
							Argument = Argument.toUpperCase()

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
							jump = (0xFFFFFFFF - jump + 1).toString(16).padStart(4, 0).toUpperCase()
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
		$('#PREVIEW').style.filter = ''
		c.remove('loading')
	}
}
