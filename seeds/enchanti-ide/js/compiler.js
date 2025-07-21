'use strict';
import { log, sleep, LS, LSget } from './utils/utils.js'
import { fetchPercentece } from './utils/dom.js'
import { STRING } from './utils/string.js'
// Author: MatiDragon.
// Contributors: Seemann, OrionSR, Miran.

/*
  Cada dia entiendo menos el código,
    hay noches que me duermo pensando
    en ¿por que lo hago? sera que tengo
    alzheimer o me volvi masoquista??
    
  En fin. Si alguien vé esto, le deseo
    suerte desde el más allá.
    
                  - MatiDragon (2001-2028)
*/
const
		NP = Number.prototype,
		SP = String.prototype,
		AP = Array.prototype;

RegExp.prototype.s = RegExp.prototype.source

function IsInRange(VAR, MIN, MAX){
	return (VAR >= MIN && VAR <= MAX) ? 1 : 0;
}

SP.r = STRING.r
SP.rA = STRING.rA
SP.toHex = STRING.toHex
SP.toBigEndian = STRING.toBigEndian
SP.parseCharScape = STRING.parseCharScape

SP.i = SP.includes
AP.i = AP.includes

SP.setOpcodeNegative = function() {
  if (+('0x'+this) >= 0x8000){
    return new Error('El opcode ya es negativo')
  }
  // Convierte el input en una cadena HEX entendible
  //   para JS, para convertirlos en Number y
  //   retornar la suma de ambos.
  return (
    +('0x' + (this + "")) + 0x8000
  ).toString(16).padStart(4,'0')
}

SP.setOpcodePositive = function() {
  if (+('0x'+this) <= 0x7FFF) {
    return new Error('El opcode ya es positivo')
  }
  // Convierte el input en una cadena HEX entendible
  //   para JS, para convertirlos en Number y
  //   retornar la resta de ambos.
  return (
    +('0x' + (this + "")) - 0x8000
  ).toString(16).padStart(4,'0')
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

NP.intToHex = function () {
  let decimal = this
  let bitReq = 0
  
  let abs = Math.abs(decimal)
  if (decimal < 0) abs-=1;
  if (IsInRange(abs, 0x00, 0x7F)) bitReq = 1;
  if (IsInRange(abs, 0x80, 0x7FFF)) bitReq = 2;
  if (IsInRange(abs, 0x8000, 0x7FFFFFFF)) bitReq = 4;
  
  const getHex = i => ('00' + i.toString(16)).slice(-2).toUpperCase();

    let view = new DataView(new ArrayBuffer(4));
    view.setUint32(0, decimal);

    let result = Array
        .from({ length: 4 }, (_, i) => getHex(view.getUint8(i)))
        .reverse()
        .join('');

    // Eliminar ceros a la izquierda
    result = result.replace(/^0+/, '');

    // Asegurarse de que la longitud sea par
    if (result.length % 2 !== 0) {
        result = '0' + result;
    }

    // Asegurarse de que la longitud sea múltiplo de 2 bytes
    while (result.length % 4 !== 0) {
        result = '00' + result;
    }
    
    if (bitReq == 1) result = result.slice(0,2)
    if (bitReq == 2) result = result.slice(0,4)
    if (bitReq == 4) result = result.slice(0,8)
    
    return result;
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
AP.first = function(){
  return this[this.length-1]
}

// Para insertar cualquier dato, antes se coloca
//   uno de estos codigos para saber como se debe
//   leer, cada parametro siguiente. Sino se define
//   el juego interpretara que es un OPCODE.
const TYPE_CODE = {
	TERMINAL_NULL		:'00',
	INT32				:'01', // 4 bytes : INT & LABEL
	GVAR				:'02', // 2 bytes
	LVAR				:'03', // 2 bytes
	INT8				:'04', // 1 byte : INT of -128 to 127
	INT16				:'05', // 2 bytes
	FLOAT32			:'06', // 4 bytes
	GVAR_ARRAY  :'07', // 6 bytes
	LVAR_ARRAY	:'08', // 6 bytes
	STRING8				      :'09', // 7 bytes + null
	GVAR_STRING8		    :'0A', // 2 bytes
	LVAR_STRING8	    	:'0B', // 2 bytes
	GVAR_ARRAY_STRING8	:'0C', // 2 bytes
	LVAR_ARRAY_STRING8	:'0D', // 2 bytea
	STRING_VARIABLE	  	:'0E', // 1 byte + str_length
	STRING16			      :'0F', // 15 bytes + null
	GVAR_STRING16		    :'10', // 2 bytes
	LVAR_STRING16		    :'11', // 2 bytea
	GVAR_ARRAY_STRING16	:'12', // 6 bytes
	LVAR_ARRAY_STRING16	:'13'  // 6 bytes
}
// Algo asi es como se traduce:
//
//               0001: wait 0
//              /            \
//          [0100]   [04     00]
//           \__/     \/      \/
//         opcode  type_code  value
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
//          [0400][03 0700][04 0F]
//           \__/   | \__/  |  \/
//          opcode  | lvar  |  int
//                type     type
//
// Hay opcodes a los que se les puede pasar diferentes
//   cantidades de parametros al mismo. A estos al
//   terminar de ingresar los parametros del opcode
//   es necesario que ingresemos un terminal-null (00)


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
  [0600][08 0100 0200 7B 00][04 01]
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
    ____/   ___/  \__  |  |    \______________________
    AA05 0D 0100 0200 7B 02 09 74 65 73 74 00 00 00 00
    \__/  | \__/ \__/  |  |  \            |
   opcode |  id   id   |lstr8 \           |
lvar_array_string8  lenght  string8     string


         06D2: 1@v(2@, 123v) = "test"
    ____/   ___/  \__  |  |    \_____________
    D206 13 0100 0200 7B 03 0E 04 74 65 73 74
    \__/  | \__/ \__/  |  |  \            |
   opcode |  id   id   |lstr16\           |
lvar_array_string16 lenght  string16    string


     op  @            l  $  values
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

let classes = deepMerge(
 deepMerge({}, 
  txtToClass((await LSget(
   'https://library.sannybuilder.com/assets/sa/classes.db',
   'gray',
   './data/classes.db'
  )))
 ),
 txtToClass((await LSget(
  './data/classes.db',
  '#373',
  './data/classesCP.db'
  )))
)

function isObject(obj) {
    return obj && typeof obj === 'object' && !Array.isArray(obj);
}

// Combina objetos a profundidad. solo si un elemento
//   no es un objeto, no le aplica una combinacion,
//   sino un remplazo.
function deepMerge(target, source) {
    const stack = [{ target, source }];

    while (stack.length > 0) {
        const { target, source } = stack.pop();

        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (isObject(source[key])) {
                    if (!target[key] || !isObject(target[key])) {
                        target[key] = {};
                    }
                    stack.push({ target: target[key], source: source[key] });
                } else {
                    target[key] = source[key];
                }
            }
        }
    }

    return target;
}

function txtToClass(txt){
  let classesTemp = {}
  
  txt = txt
  .toUpperCase() // Aquí se utiliza para eliminar comentarios de una sola línea que comienzan con ';'.
  .r(/;(.+)?$/gm, '')
  .r(/^\s*$/gm, '')
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
      addClass = false;
    }
    else {
      // Si estamos en la sección de lista de clases, se crea un nuevo objeto para cada clase.
      if (addClass == true) {
        classesTemp[line] = {}
      } else {
        // Si la línea comienza con '$', indica el comienzo o fin de una definición de clase.
        if (/^\$.+/m.test(line)) {
          if (line != '$BEGIN'
            && line != '$END'
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
            if (!(propertyName in classesTemp[currentClass]))
            classesTemp[currentClass][propertyName] = {};
          
            // Itera sobre cada conjunto de operaciones y códigos para la propiedad.
            data.forEach(prop => {
              let [opCode, mathCode, pos, type, helpCode] = prop;
              // Realiza acciones basadas en el código matemático.
              switch (mathCode) {
                case '==':
                  classesTemp[currentClass][propertyName].IS = opCode;
                  break;
                case '=':
                  if (pos === '1') {
                    classesTemp[currentClass][propertyName].SET = opCode;
                  } else if (pos === '2') {
                    classesTemp[currentClass][propertyName].GET = opCode;
                  }
                  break;
                case '+=':
                  classesTemp[currentClass][propertyName].ADD = opCode;
                  break;
                case '>=':
                  classesTemp[currentClass][propertyName].UPPER = opCode;
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
            classesTemp[currentClass] = { ...classesTemp[currentClass],  ...miember}
          }
        }
      }
    }
  })
  return classesTemp
}

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
  			  input: command.input ?? [],
  			  output: command.output ?? [],
  			  attrs: command.attrs ?? '',
  			  variable: false
  			}
  			
  			SCM_DB2[command.id.toLowerCase()]
  			.input
  			.forEach(e => {
  			  if (e.type == 'arguments')
  			  {
  			  SCM_DB2[command.id.toLowerCase()]
  			  .variable = true
  			  }
  		  })
		  }
		})
	})
	
	CUSTOM_KEYWORDS.forEach(keyword => {
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
  
  
  
	DATA_DB.extensions.forEach(extension =>{
		
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


SP.toUnicode = function() {
  return this.split("").map(s => {
	return `${s.charCodeAt(0).toString(16).padStart(2, '0')}`;
  }).join("-");
}

SP.hexToDec = function(){
	return +('0x'+this)
}

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
    
    const SYNTAX = {
      FOR: /^FOR (.+)=(.+) (todown|to) (.+)STEP(.+)/im,
      WHILE: /^WHILE (.+)/im,
      REPEAT: /^UNTIL (.+)/im,
      IF: /^IF (.+)/im
    };
    
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
    if (stacks.general.length > 0){
      
      throw new Error(`pila sintactica: `+stacks.general)
    }
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
	
	return lineas.join('\n');
}

SP.removeComments = function() {
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

SP.formatScript = function() {
  let code = this
  
  code = code.split('\n').map(line => {
    return line.trim()
  }).clear()
  
  if (/^while/i.test(code[0])
  || /^repeat/i.test(code[0])
  || /^for/i.test(code[0]))
    code.unshift('nop');
  
  code = code.join('\n')
  
  code = code
    .r(/^(if and|if or|if )?/mgi, "$1\n")
    .r(/^hex /mgi, "hex\n")
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

let CLEO_FUNCTIONS

SP.preProcesar = function() {
  CLEO_FUNCTIONS = {
    MATH : {
      INT_INT : false,
      FLOAT_FLOAT : false,
      INVERT_BOOL : false,
      TO_BOOL : false,
    }
  }
  let nString = ''
  
  this.formatScript().split('\n').forEach(linea =>{
    linea = linea.trim()
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
      else if(patron3.test(linea)
        && !/(^-?\d+$|["'`\.])/m.test(linea)
      ){
        let temporales = encontrarTemporales(linea)
        
        if (temporales){
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
    }
    
    if (/^\d+ == \d+$/im.test(linea)){
      CLEO_FUNCTIONS.MATH.INT_INT = true
    }
    if (/^\d+\.\d+ == \d+\.\d+$/mi.test(linea)){
      CLEO_FUNCTIONS.MATH.FLOAT_FLOAT = true
    }
    nString += linea.trim() + '\n'
  })
  
  nString = nString
    .r(/\btoHex\(([^)(]+)\)(\.offset\((\d+)\))?/gi, (...input) => {
      let str = input[1] || ''
      let offset = +input[3] ?? 0
      
      if (str.length > 4){
        throw new RangeError('Max 4 Characters')
      }
      if (str.length + offset > 4){
        throw new RangeError('string + offset, must NOT add up to more than 4 characters.')
      }
      
      return +('0x'+str.toHex(offset))
    })
    
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
    .r(/^(.+) => (.+);/gim, 'if $1\nthen $1 end')
  	  
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
  	// 0@ == 1 ? 0
  	.r(/^(.+) \? (.+)$/gm, input =>{
  	  let vars = input.match(/^(.+)\?(.+)$/)
  	                  .map(e=> e.trim())
  	  
  	  vars[1] = vars[1].determineOperations()
  	  
  	  let operators = '==,!=,<=,>=,>,<,<>'
  	  
  	  operators.split(',').forEach(operador => {
  	    if (RegExp(operador).test(vars[1])){
  	      input =
  	        'if\n'+vars[1]+'\n'+
  	        'then\n'+vars[2].determineOperations()+'\n'+
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
  	    
  	  
  	  return r
  	})
  	.r(/^@(\w+)$/gm, 'goto @$1')
  	
  	
    .r(/^\w+ = \d+ [\*\/\+\-] \d+( [\*\/\+\-] \d+)+$/gim,  input =>{
      let i = input.split(' ')
      let code = i[0]+' '+i[1]+' '+i[2]
      let n = 0
      
      i.forEach((e, c) => {
        if (c > 2){
          n = !n
        }
        if (n){
          code+='\n'+i[0]+' '+i[c]+'= '+i[c+1]
        }
      })
      return code
    })
  	// bitExp
  	// a = b & c
  	.r(/^(.+) = (.+) (>>|<<|%|&|\^|\|\*|\/|\+|\-)\x20?(.+)$/m, (input, ...match) => {
  	  let [var1, var2, operador, var3] = match
  	  
  	  if ((var1.startsWith('f@') || var1.endsWith('@f'))
  	  || (var2.i('.') || var3.i('.'))){
  	    let res = `${var1} ${operador}= ${var2}\n`
  	      + `${var1} ${operador}= ${var3}`
  	      return res
  	  }
  	  
  	  let op = {
  	   "&": "0B10",
  	   "|": "0B11",
  	   "^":"0B12",
  	   "~":"0B13",
  	   "%":"0B14",
  	   ">>":"0B15",
  	   "<<":"0B16",
  	   "+":"0A8E",
  	   "-":"0A8F",
  	   "*":"0A90",
  	   "/":"0A91",
  	  }[operador];
  	  
  	  let res = op+": "+var2+' '+var3+' '+var1
  	  
  	  return res
  	})
  	//0B1A: ~ 0@
  	.r(/^~(.+)/m, '0B1A: $1')
    // 7@ = !!7@
    .r(/(.+) = !!(.+)$/gim,
`if
$2 == 0
then
$1 = 1
else
$1 = 0
end
`)
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
    .r(/^(\w+)\((.+)\)$/gmi, input=>{
      let vars = input.match(/([^\.\s\W]+)\((.+)\)$/m)
      
      let line = vars[2]
      let add = ''
      let inArray = false
      
      for (let i = 0; i < line.length; i++){
        if (line[i] == '(') inArray = true;
        if (line[i] == ')') inArray = false;
        
        add += inArray ? line[i].r(',', '\x01') : line[i].r(',', ' ')
      }
      
      const length = add.split(' ').clear().length
      
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
    if (Input.isArray(variable)) {
      let vars = variable.match(/(.+)\((.+),(.+)\)/)
      registrarTipo(vars[1],tipo)
      tipo = vars[2].i('@') ? 'LVAR_INT' : 'GVAR_INT'
      registrarTipo(vars[2],tipo)
      return
    }
    
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
  } else if (/".+"/.test()) {
    return 'LONG'
  } else if (/'.+'/.test(variable)) {
    return 'SHORT'
  }

  // Verificar si el tipo de la variable ya está registrado
  if (registroTipos[variable]) {
    return registroTipos[variable];
  }


  if (/^\d+@/m.test(variable)){
    const matchLocal = 
    variable.match(/^(\d+@)([a-z])?(\(([^,]+),(\d+)(\w)?\))?/i)
    
    if (matchLocal) {
      const tipo = matchLocal[6] ?? matchLocal[2];
      switch (tipo) {
        case 'i': return 'LVAR_INT';
        case 'f': return 'LVAR_FLOAT';
        case 's': return 'LVAR_SHORTSTRING';
        case 'v': return 'LVAR_LONGSTRING';
        default: return 'LVAR_INT'; // Tipo no especificado para variable local
      }
    }
  }

  if (/^\w?\$\w+/m.test(variable)){
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
}

function detectarOpcode(operacion, _lineaInvocada = 0) {
  const opcodes = {
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
      'INT-INT': 'XXX0',
      'FLOAT-FLOAT': 'XXX1',
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
    const partes = operacion.dividirCadena()
    
    if (partes) {
      return partes
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
  
  if (!(operador in opcodes)){
    throw new SyntaxError(
      'Operador undefined\n>>> '
      +operador+ '\n'
      +_lineaInvocada+':'
      +((variable1.length + operador.length + 1)+'')
      +' | >> '+operacion)
  }
  
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
    throw new Error('Invalid operation\n>>> '+operacion);
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
    
    let parametros = linea.dividirCadena()
    
    
    if (parametros.length == 3
      && Input.isValueConstant(parametros[0])
      && Input.isOperation(parametros[1])
      && Input.isValueConstant(parametros[2])
    ) {
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
      let isN = param.i('-') ? '-' : ''
      
      if (Input.isAdmaVar(param)){
        return param.r('&','$')
      }
      if (Input.isNote(param)){
        return (+param)+""
      }
      
      param = param
      .r(/^-?\.?\d+(\.\d+)?(ms|[smh]|fps)$/mi, second => {
        second = second.toLowerCase().r('-')
        
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
        
        return isN+second
      })
      .r(/^-?\.?\d([\._\df]+)?(\.[_\df]+)?$/mi, num=>{
        return num
        .r(/_/g,'')
        .r(/(\.|f)$/mi,'.0')
        .r(/^\./m, '0.')
      })
      .r(/^-?0b\d+$/im, bin => {
        if (/^-?0b[01]+$/im.test(bin)){
          return isN+(+bin.r('-'))
        }
       	throw new SyntaxError("Secuencia BIN: Solo usar caracteres del rango 0-1")
      })
      .r(/^-?0o\d+$/im, oct => {
        if (/^-?0o[0-7]+$/im.test(oct)){
          return isN+(+oct.r('-'))
        }
       	throw new SyntaxError("Secuencia OCT: Solo usar caracteres del rango 0-7")
      })
      .r(/^(-?0x\w+)$/im, hex => {
        if (/^-?0x[0-9a-f]+$/im.test(hex)){
          return isN+(+hex.r('-'))
        }
        throw new SyntaxError("Secuencia HEX: Solo usar caracteres del rango 0-9 y del A-F.")
      })
      .r(/^c#\w+$/mi, color =>{
        color = color.slice(2)
        
        if (color.length == 1){
          color = ''+color+color+color
        }
        if (color.length == 2 || color.length >= 5){
          throw new Error("Interprete color:\n\tLas longitudes validas son; 1, 3, 4, 6 y 8.")
        }
        if (color.length <= 4){
          color = color
          .split('').map(x => x+x).join('')
        }
        
      	color = color.match(/.{1,2}/g).map(
      	  e => +('0x'+e)
      	).join(' ')

        return color
      })
      .r(/^#\w+$/mi, model =>{
      	model = model.r('#','').toUpperCase()
      	
      	if (model in MODELS) {
      	  model = MODELS[model]
      	} else {
      		throw new Error(`Model undefined: #${model}`);
        }
        return model
      })
      return param
    }).join(' ')
  }).join('\n')
  
  
  return nString
}

SP.constantsToValue = function(){
  const nString = this.split('\n').map(line=>{
    line = line.dividirCadena().map(param=>{
      let paramOriginal = param
      param = param.trim()
      
      let pref = ""
      if (param != ''){
        if (/^[\!\-\+]\w+$/m.test(param)){
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
          
          return pref + ret
        }else {
          return paramOriginal
        }
        //else if (/^[+\-=^&$*]/)
          
        return param
      }
      return param
    }).join(' ')
    
    return line
    
  }).join('\n')

  
	
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
            /(.+)=(.+)\((.*)\)/
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
        let op = mat.setOpcodeNegative()
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
    let ok = true
    let change = false
    // SCM_DB
    params.forEach((param, pos) => {
      if (ok == true 
      && (pos == 0 || pos == (params.length-1))
      && /^\!?[a-z]\w+/mi.test(param)){
          ok = false
          if (pos == (params.length-1)){
            change = true
          }
          
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
      if (change)
        nLine = param +' '+ nLine
      else
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

        if (caracter === '"' || caracter === "'" || caracter === "`"){
          if (caracterAnterior != '\\') {
             dentroComillas = !dentroComillas;
          }
          
          subcadenaActual += caracter;
        } else if (
          ( caracter === ' '
          || caracter === '\n'
          || caracter === '\t'
          ) && !dentroComillas) {
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

SP.autoAddCleoFunction = function(){
  let code = this
  if (CLEO_FUNCTIONS.MATH.INT_INT){
    code += `\n:MATH_INT_INT
    if 0@i == 1@i
    then ret 1 true
    else ret 1 false
    end
    ret 0\n`
  }
  if (CLEO_FUNCTIONS.MATH.FLOAT_FLOAT){
    code += `\n:MATH_FLOAT_FLOAT
    if 0@f == 1@f
    then ret 1 true
    else ret 1 false
    end
    ret 0\n`
  }
  return code.formatScript()
}
SP.fixOpcodes = function(){
  let tm = this.split('\n').map(line => {
    if (/^X\w+: /mi.test(line)){
     line = line.r(/^(X\w+):(.+)/, (...i ) => {
      if (i[1] == 'XXX0')i[1]= '0AB1: @MATH_INT_INT 2';
      if (i[1] == 'XXX1')i[1]= '0AB1: @MATH_FLOAT_FLOAT 2';
     
      return i[1] + i[2]
     })
     return line
    }
    else {
      let negado = false
      line = line.trim().dividirCadena()
      
      
      if (line.length >= 1){
        if (line[0].length < 5 && line[0].endsWith(':')){
          line[0] = line[0].r(/:$/m)
          if (line[0].startsWith('!')){
            line[0] = line[0].r(/^\!/m)
            .setOpcodeNegative()
          }
          line[0] = (line[0]+'').padStart(4, '0') + ':'
        }
        
      }
      
      line = line.join(' ')
      return line
    }
  }).join('\n')
  
  return tm
}

SP.determineOperations = function(){
  let h = this.split('\n')
  let n = ''
    
  h.forEach(s => {
    let o = s
    s = s.trim()
    
    let negado = /^\!/m.test(s) ? 0 : 1
    s = s.r(/^\!/m)
    
    if (Input.isVariable(s)) {
      s = s +' == '+ negado
    }else{
      s = o
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
  isHex: x => Input.isHexInt(x) ?? Input.isHexFloat(x),
  isBin: x => /^0b[01]+$/im.test(x),
  isOct: x => /^0o[0-7]+$/im.test(x),
  isModel: x => /^#\w+$/m.test(x),
  isNumber: x => {
    return (Input.isTime(x)
    || Input.isNote(x)
    || Input.isFloat(x)
    || Input.isInt(x)
    || Input.isBin(x)
    || Input.isOct(x)
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
    return /^\d+@[a-z]?$/im.test(x)
  },
  isGlobalVar: x => {
    return /^[a-z]?\$\w+$/im.test(x)
  },
  isAdmaVar: x => {
    return /^[a-z]?&\d+$/im.test(x)
  },
  isLocalVarArray: x => /^\d+@[a-z]?(\(.+,\d+[a-z]?\))$/im.test(x),
  isGlobalVarArray: x => /^[a-z]?\$\w+(\(.+,\d+[a-z]?\))$/im.test(x),
  isAdmaVarArray: x => /^[a-z]?&\d+(\(.+,\d+[a-z]?\))$/im.test(x),
  isNegate: x => /^\!.+/m.test(x),
  isNegative: x => /^\-.+/m.test(x),
  isPositive: x => /^\+.+/m.test(x),
  isOperation: x => /^([\!=^~<>%+*/-]+|=#|[+-]=@|=&)$/.test(x),
  isVariable : x => {
    return (Input.isLocalVar(x)
    || Input.isGlobalVar(x)
    || Input.isAdmaVar(x)
    || Input.isLocalVarArray(x)
    || Input.isGlobalVarArray(x)
    || Input.isAdmaVarArray(x))
  },
  isArray : x => {
    return (Input.isLocalVarArray(x)
    || Input.isGlobalVarArray(x)
    || Input.isAdmaVarArray(x))
  },
  isLabel : x => /^[:@]\w+$/m.test(x),
  isValueConstant : x => {
    return (Input.isValueSimple(x)
    || Input.isNumber(x)
    || Input.isString(x)
    || Input.isVariable(x))
  },
  isValid: x => {
    return (Input.isCommand(x)
    || Input.isNumber(x)
    || Input.isString(x)
    || Input.isVariable(x)
    || Input.isValueSimple(x)
    || Input.isLabel(x))
  },
  getTypeData: x => {
    if (Input.isLabel(x)) return 'label';
    if (Input.isCommand(x)) return 'command';
    if (Input.isNumber(x)) return 'number';
    if (Input.isString(x)) return 'string';
    if (Input.isVariable(x)) return 'variable';
    if (Input.isValueSimple(x)) return 'constant';
    if (Input.isOperation(x)) return 'operation';
    else return undefined
  },
  getTypeCompile: x => {
    if (Input.isLabel(x)) return 'label';
    if (Input.isInt(x)) return 'int';
    if (Input.isFloat(x)) return 'float';
    if (Input.isShort(x)) return 'short';
    if (Input.isLong(x)) return 'long';
    if (Input.isFormat(x)) return 'long';
    if (Input.isLocalVar(x)) return 'lvar';
    if (Input.isGlobalVar(x)) return 'gvar';
    if (Input.isAdmaVar(x)) return 'avar';
    if (Input.isLocalVarArray(x)) return 'lvararray';
    if (Input.isGlobalVarArray(x)) return 'gvararray';
    if (Input.isAdmaVarArray(x)) return 'avararray';
    else return undefined
  }
}

SP.removeTrash = function(){
  let nCode = ''
  let code = this.split('\n')
  code.forEach((line, ln) => {
    
    let nLine = ''
    let params = line.dividirCadena()
    
    
    params.forEach((param, pr) =>{
      if (params.length > 1){
      if (/^[=\-\+\/~^*!?%&|]+$/mi.test(param)) {
			  param = ''
		  }
		  else if (/^[a-z]\w+$/mi.test(param)) {
			  if (!Input.isConstant(param)){
			    param = ''
			  }
			}
      }
			nLine += param + ' '
      
    })
    
    nCode += nLine.r(/\x20+/g, ' ').trim() + '\n'
  })
  
  return nCode
}

SP.parseHexEnd = function(){
  let inHex = false
  let inStart = false
  
  let resultv2 = this.split('\n').map((line, lineNumber)=>{
    line = line.trim()
    if (/hex/i.test(line)){
      if (inHex) {
        throw new HexError('Re-declared hexadecimal sequence\n\t>>> '+lineNumber)
      }
      else {
        inHex = true
        line = ''
      }
    }
    if (/end/i.test(line)){
      if (inHex){
        inHex = false
        inStart=false
        line = ''
      }
      
    }
    if (inHex){
      inStart = true
      line = line.dividirCadena().map(e => {
        let multiplicado = 1
        let addNull
        if (/\(.+\)/.test(e)){
          multiplicado = e.match(/\((.+)\)/)[1]
          
          function evaluaAritmetica(expresion) {
            return new Function('return ' + expresion)();
          }
          
          multiplicado = Math.round(evaluaAritmetica(multiplicado))
          
          e = e.r(/\(.+\)/, '')
        }
        else if (/^['"`].+['"`]$/m.test(e)){
          addNull = e.i("'") ? true : false;
          
          e = e.r(/^['"`](.+)['"`]$/m, '$1')
          .parseCharScape()
          .toUnicode()
          .r(/-/g)
        }
        
        if (e.length % 2 != 0) {
          e = '0' + e
        }
        
        if (multiplicado > 1){
          e = e.repeat(+multiplicado)
        }
        
        if (addNull) e += '00';
        
        return e
      }).join('')
    }
    if (inStart && line != ''){
      line = '['+line+']'
      inStart = false
    }
    return line
  }).clear().join('\n')
  
  return resultv2
}

SP.adaptarCodigo = function(){
  let result = this
    .removeComments()
    .transformTypeData()
    .parseHexEnd()
    .preProcesar()
    .formatScript()
    .autoAddCleoFunction()
    .parseHigthLevelLoops()
    .addBreaksToLoops()
    .addNumbersToIfs()
    .removeComments()
    .r(/^not /gm, '!')
    .classesToOpcodes()
    .constantsToValue()
    .transformTypeData()
    .determineOperations()
    .operationsToOpcodes()
    .keywordsToOpcodes()
    .fixOpcodes()
    .removeTrash()

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
	
	// Para registrar los bites que se escribieron y
	//   para guardar las etiquetas para los controles
	//   de saltos.
	let registeredBites = []
	// Si se escribe 0xFF00 entonces va el 2
	//   registeredBites.push(2)
	// Si es una etiqueta, solo se le quitan los 2 puntos
	//   y se manda push() a lo que sea.
	
	
	function translateLvar(dataInput){
  	dataInput = 
  		Number(dataInput.r(/@[a-z]?/,''))
  		.toString(16)
  		.padStart(4,'0')
  		.toBigEndian();
  
  	return dataInput
  }
  
  function translateAvar(dataInput) {
    let tempNumber = dataInput
    dataInput = Number(dataInput.r(/[a-z]?\&/i, ''))

    if (isNaN(dataInput)) throw new SyntaxError(`NAN parameter\n\tparameter ${tempNumber}\n\tat line ${numLine}\n\t\topcode ${setOp == '0000' ? 'autodefined' : setOp} ${command.toUpperCase()}`);
  }

  dataInput = dataInput.toString(16)
    .substring(0, 4)
    .padStart(4, '0')
    .toBigEndian()

  return dataInput
  }
  
  function translateGvar(dataInput) {
  dataInput = dataInput.r(/[a-z]?\$/i, '')

  if (/[a-z]/i.test(dataInput)) {
    let coincide = false

    if (CUSTOM_VARIABLES[dataInput.toUpperCase()] != undefined) {
      coincide = CUSTOM_VARIABLES[dataInput.toUpperCase()] * 4
    }

    if (!coincide) {
      dataInput = parseInt(Number(String(parseInt(dataInput, 35)).substring(0, 4) / 2))
      if (dataInput > 1000) dataInput /= 5
      if (dataInput > 500) dataInput /= 2
      dataInput = parseInt(dataInput)
    }
    else {
      dataInput = coincide
    }
  }
  else {
    dataInput = dataInput * 4
  }

  dataInput = dataInput.toString(16)
    .substring(0, 4)
    .padStart(4, '0')
    .toBigEndian()

  return dataInput
}

  LineComand = LineComand
  .adaptarCodigo()
	.split('\n')
	.clear()
  
	LineComand.forEach((Line, numLine) => {
	  Line = Line.trim()
	  
	  let lineDepurated = []
	  let setOp = ''
	  let isNegative = false
	  let command = ''
	  let typeData = ''
	  let currentOpcode = ''
	  
	  let charsCounter = 0
		if (Line.match(/^:/)) {
		  // si es una etiqueta
			registeredBites.push(Line.r(':','').toUpperCase())
		}
		else if(Line.match(/^\[.*\]$/)){
		  // si es un hexadecimal
		  Line = Line.r(/^\[(.*)\]$/, '$1')
		  
		  if (/([g-z]|\W)/i.test(Line)){
        throw new SyntaxError(`Just input hexadecimal\n\tPosible line: ${1+numLine}`)
      }
		  if (Line.length != 0){
		    registeredBites.push(Line.length / 2)
		    codeDepurated.push(come(Line))
		  }
		}
		else {
			LineComand[numLine] = Line.dividirCadena()
			.map(data => {
			  data = data.trim()
			  if (/^[=!\-+*\/%\^#@<>&$\\]+$/mi.test(data)) {
			       data = ''
			  }
			  return data
			})
			LineComand[numLine].forEach((Argument, numArgument) => {
			  
				if (numArgument >= 1) {
					if (/^[=!\-+*\/%\^#@<>&$]+$/mi.test(Argument)) {
						LineComand[numLine][numArgument] = ''
					}
				}
			})
			LineComand[numLine] = LineComand[numLine].clear()
			
			LineComand[numLine].forEach((Argument, numArgument) => {
			  charsCounter += Argument.length
			  
				if (numArgument == 0) { // command
					Argument = Argument.toLowerCase()
					if (/:/.test(Argument)){
						Argument = Argument.padStart(6,'0')
					}
					
					if ( // is opcode
						/[a-f\d]+:$/im.test(Argument)
						&& Argument.length <= 6
					){
						// is opcode
						Argument = Argument.r(':','').r('!', '8').padStart(4,'0')
						Argument = Argument.length > 4 ? Argument.r(/^./m,'') : Argument
						setOp = Argument

						if(/^[8-9A-F]/mi.test(Argument)){
							isNegative = true
							setOp = setOp.setOpcodePositive()
						}


						Object.entries(SCM_DB).every(([key, value]) => {
						  if (value.opcode == setOp) {
							Argument = key
							return false
						  }
						  return true
						})
						
            currentOpcode = setOp
						if (isNegative){
						  
							setOp = setOp.setOpcodeNegative()
						}

					}else{ // is keyword
						// is keyword
						if(Argument[0] == '!'){ // is negative
							Argument = Argument.r('!','')
							isNegative = true
						}

						if (SCM_DB2[Argument]){
							setOp = SCM_DB2[Argument]
						}else{
							
							if (Line.endsWith('=')){
							  throw new SyntaxError(`missing parameter\n\tin line ${(1+numLine)} the trigger ${Argument}\n\t${setOp == '0000' ? 'XXXX' : setOp} >> ${Line}`)
							}
							else if (Line === 'hex'){
							  throw new SyntaxError(`missing closure\n\t>>> hex[...]end\n${charsCounter} | ${1+numLine}`)
						  }
						  else {
							  throw new SyntaxError(`opcode undefined\n>>> ${Argument}\n${numLine+1}:${charsCounter} | ${setOp == '0000' ? 'XXXX' : setOp} >> ${Line}`)
							};
						}
            
            currentOpcode = setOp
						if (isNegative){
							setOp = setOp.setOpcodeNegative()
						}
					}
					lineDepurated.push((_addJumpLine ? '\n' : '') + setOp.toBigEndian())
					
					command = Argument
					
					registeredBites.push(2)
					currentOpcode = currentOpcode.toUpperCase()
					
					// Este ultimo bloque es para saber
					//   si faltan parametros o hay de más 
					let tempOp = currentOpcode.toLowerCase()
					
					
					if (SCM_DB2[currentOpcode.toLowerCase()] == undefined){
					  
					  SCM_DB2[currentOpcode.toLowerCase()] = {
					    num_params: Line.dividirCadena().length-1
					  }
					}
					
					if (!
					  SCM_DB2[currentOpcode.toLowerCase()].variable
					){
					if (LineComand[numLine].length-1 < SCM_DB2[tempOp].num_params) {
					  // si faltan parametros, se muestra un error
					  throw new Error(`missing parameters\n>>> ${Argument}\n${numLine+1}:${charsCounter} | ${setOp == '0000' ? 'XXXX' : setOp} >> ${Line}`)
					}
					if (
					  LineComand[numLine].length-1
					  > SCM_DB2[tempOp].num_params
					) {
					  // si hay parametros de mas, se borran
  			    LineComand[numLine].splice( 
  					  SCM_DB2[tempOp].num_params+1,
  					  LineComand[numLine].length
  	  		  )
					}
					}
				}
				else { // is Argument
					registeredBites.push(1)

          if (Input.isValid(Argument)){
            typeData = Input.getTypeCompile(Argument)
          }
          else {
            throw new SyntaxError(`directive undefined\n>>> ${Argument}\n${numLine+1}:${charsCounter-1} | ${Line}`)
          }
          
					switch (typeData) {
						case 'short':
							registeredBites.push(8)
							
							Argument = Argument
							.r(/^'(.*)'$/m, '$1')
							.parseCharScape()
							
							if (Argument.length == 0) Argument = '\x00'
							Argument = Argument.substring(0,7)

							Argument = (come(TYPE_CODE.STRING8) + Argument.toUnicode() + '-00').padEnd(26,'-00')
						break;

						case 'long':
						  if (/^".*"$/m.test(Argument)){
						    Argument = Argument
  							.r(/^"(.*)"$/m, '$1')
						  }
						  else {
						    Argument = Argument
  							.r(/^`(.*)`$/m, '$1')
						  }
							
							switch (currentOpcode){
								case '05B6' :
									Argument = Argument.substring(0,128)
								break;
								case '0674':
								case '09E2':
									Argument = Argument.substring(0,8)
								break;
							  case '038F':
							  case '09A9':
									Argument = Argument.substring(0,14)
							  break;
								case '06D1':
								case '087B':
								case '075D':
								case '075E':
								  Argument = Argument.substring(0,15)
								break;
								//case '0662':
								default:
    							Argument = Argument.substring(0,255)
    						break;
							}
							
							Argument = Argument.parseCharScape()
							
              if (Argument.length == 0) Argument = '\x00'
              
              registeredBites.push(1)
              registeredBites.push(Argument.length)
              
    					Argument = (come(TYPE_CODE.STRING_VARIABLE)
    					  + come(Argument.length.toString(16).padStart(2, '0'))
    					  + Argument.toUnicode())
						break;

						case 'int':
							if (Math.abs(Argument) > 0x7FFFFFFF)
							  throw new Error('Numero fuera de rango')

							let byte1   = 0x7F       // 127
							let byte1R  = 0xFF
							let byte2   = 0x7FFF     // 32767
							let byte2R  = 0xFFFF
							let byte4   = 0x7FFFFFFF // 2147483647
							let byte4R  = 0xFFFFFFFF

							let dataType;
              
							if (0 <= Argument) {
								if (Argument <= byte4)
								  dataType = come(TYPE_CODE.INT32);
								if (Argument <= byte2)
								  dataType = come(TYPE_CODE.INT16);
								if (Argument <= byte1)
								  dataType = come(TYPE_CODE.INT8);
							}
							else {
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
										registeredBites.push(1)
										break;

									case come(TYPE_CODE.INT16) :
										temp = 4
										registeredBites.push(2)
										break;

									case come(TYPE_CODE.INT32) :
										temp = 8
										registeredBites.push(4)
										break;

									default: break;
								}
								return temp
							})(), '0')

							Argument = dataType + Argument.toBigEndian()
						break;

						case 'float':
							registeredBites.push(4)
							
              if(Input.isNote(Argument)){
                Argument = (+Argument)
              }
              else {
							  Argument = Argument.r('f','')
              }
              
              Argument = come(TYPE_CODE.FLOAT32) + Number(Argument).toHex()
              
						break;

						case 'lvar':
					  	registeredBites.push(2)

							Argument = 
								come(TYPE_CODE.LVAR) 
								+ Number(Argument.r(/@(\w)?/,'')).toString(16)
									.padStart(4,'0')
									.toBigEndian();
							
						break;
						
						case 'lvararray':
						  
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
						  
						  registeredBites.push(6)
						  
						  Argument = (
						    '['+typeArray + ','+
						    translateLvar(Slvar.variable) + ','+
						    index.id + ','+
						    Number(Slvar.extend.size)
									.toString(16)
									.padStart(2,'0') + ','+
						    typeSet + '],'
						  )
						break;

						case 'gvar':
							if (/(&|\$)(.+)(&|\$)/.test(Argument)){
								registeredBites.push(6)
								
								Argument = 
									come(TYPE_CODE.GVAR_ARRAY)
									+ Argument
										.r(/[a-z]?(\$|\&)\w+/gi, inputVar => {
											if(/\$/.test(inputVar)){
												inputVar = inputVar.r(/[a-z]?(\$|\&)/,'')

												if (/[a-z]/i.test(inputVar)){
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
										.r(/\w+,\w+$/m, inputSize => {
											inputSize = inputSize.split(',')

											inputSize[0] = Number(inputSize[0]).toString(16).padStart(2,'0')
											

											return inputSize
										})
							}
							else{ // no es areay
								registeredBites.push(2)
								
								if(/\$/.test(Argument)){
									Argument = Argument.r(/[a-z]?\$/i,'')

									if (/[a-z]/i.test(Argument)){
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
							registeredBites.push(4)
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
			
			// Si un opcode es de parametros numero de opcode
			//   indefinido, se agrega un terminal-nulo
			//   para indicar el final de los parametros que
			//   se le pasan al opcode.
			if (SCM_DB2[currentOpcode.toLowerCase()].variable){
			  registeredBites.push(1)
			  lineDepurated.push(come(TYPE_CODE.TERMINAL_NULL))
			}

			codeDepurated.push(lineDepurated)
		}
	})

	let codeOfFinal = (_SepareWithComes
						  ? codeDepurated.toString().r(/,,+/g,',')
						  : codeDepurated.toString()
						    .r(/,|\-|\[|\]/g,'')
					  )
					  .r(/\./g,'').toUpperCase().trim()

	let codeOfFinalDepurated = codeOfFinal.r(/<@([^<>]+)>/g, input => {
		let found = false
		let jump = 0
		let label = input.substring(2, input.length-1)

		registeredBites.forEach(element => {
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
		alert ("E-02: Añada instrucciones al archivo.");
		return
	}

	let code_hex = this.Translate();

	if (code_hex.length % 2 != 0) {
		alert ("E-03: la longitud de la cadena hexadecimal es impar.");
		return;
	}
	if (/[^0-9A-F]/i.test(code_hex)){
	  alert ("E-04: se hayo un caracter no hexadecimal.")
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
	$SBL_State.innerText = 'ᛟ'
  $SBL_State.style.background = ''
  $SBL_State.style['font-size'] = '1.5rem'
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
		$SBL_State.innerText = 'ᛟ'
		$('#PREVIEW').style.filter = ''
		c.remove('loading')
	}
}
