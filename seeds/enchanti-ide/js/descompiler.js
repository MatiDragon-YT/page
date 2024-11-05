'use strict';
import { log, sleep, LS } from './utils/utils.js'
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
	INT32				:'01', // 4 bytes : INT y LABEL
	GVAR				:'02', // 2 bytes
	LVAR				:'03', // 2 bytes
	INT8				:'04', // 1 byte : INT del -128 hasta el 127
	INT16				:'05', // 2 bytes
	FLOAT32			:'06', // 4 bytes
	GVAR_ARRAY  :'07', // 6 bytes
	LVAR_ARRAY	:'08', // 6 bytes
	STRING8				      :'09', // 7 bytes + nulo
	GVAR_STRING8		    :'0A', // 2 bytes
	LVAR_STRING8	    	:'0B', // 2 bytes
	GVAR_ARRAY_STRING8	:'0C', // 2 bytes
	LVAR_ARRAY_STRING8	:'0D', // 2 bytea
	STRING_VARIABLE	  	:'0E', // 1 byte + str_length
	STRING16			      :'0F', // 15 bytes + nulo
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
function insertarSalto(str, nuevaLinea, posicion) {
    let lineas = str.split('\n');
    if (posicion < 0 || posicion > lineas.length) {
        throw new Error('Posición fuera de rango');
    }
    lineas.splice(posicion, 0, nuevaLinea);
    return lineas.join('\n');
}

/** Convert any HEX with BIG-ENDIAN to FLOAT
*/
SP.hexToFloat = function() {
  let view = new DataView(new ArrayBuffer(4));

  this.match(/.{1,2}/g).forEach((byte, i) => {
    view.setUint8(i, parseInt(byte, 16));
  });

  return view.getFloat32(0);
}

/** Convert any FLOAT to HEX with BIG-ENDIAN
*/
NP.floatToHex = function(){
	const getHex = i => ('00' + i.toString(16)).slice(-2);

	let view = new DataView(new ArrayBuffer(4));

	view.setFloat32(0, this);

	let result = Array
		.apply(null, { length: 4 })
		.map((_, i) => getHex(view.getUint8(i)))
		.join('');

	return result.toBigEndian()
}

//log(descompilar(`0000,0100,05,E803,D00A,0E,08,61-63-74-69-76-61-64-6F,05,E803,00,B10A,01,9BFFFFFF,04,05,04,5C,06,00801144,06,0000C842,06,00005041,06,00005041,00,B10A,01,9BFFFFFF,04,05,04,5C,06,00801144,06,0000C842,06,00005041,06,00005041,00,0100,01,C0270900,0200,01,A9FFFFFF,D00D,03,0A00,01,0DFFFFFF,D10D,03,0A00,03,0A00,8500,03,0B00,03,0000,1200,03,0B00,04,04,5A00,03,0A00,03,0B00,D80D,03,0A00,03,0A00,04,04,04,00,0A00,03,0A00,04,0C,D90D,03,0A00,03,0100,04,04,04,00,04,01,0A00,03,0A00,04,04,D90D,03,0A00,03,0200,04,04,04,00,04,01,0A00,03,0A00,04,04,D90D,03,0A00,03,0300,04,04,04,00,04,01,0A00,03,0A00,04,04,D90D,03,0A00,03,0400,04,04,04,00,04,01,B20A,04,00,00,5F5A4E313543546F756368496E7465726661636531306D5F70576964676574734500,`))

function descompilar(scm){
  let codigo = ''
  
  let src = scm.r(/(,|\s|\-)/g).match(/.{2}/g)
  
  let op = {
    '0000':{name:'nop',param:0},
    '0001':{name:'wait',param:1},
    '0002':{name:'goto',param:1,def:['label']},
    '0050':{name:'gosub',param:1,def:['label']},
    '0AB1':{name:'cleo_call',param:-1,def:['str','int']},
    '0AD0':{name:'printf',param:-1},
    '0DD0':{name:'get_label_addr',param:2,def:['var','label']},
    '0DD1':{name:'get_func_addr_by_cstr_name',param:2},
    '0DD0':{name:'get_label_addr',param:2,def:['label']},
  }
  
  let waiting = 'opcode'
  
  let i = 0
  let cmd = ''
  let type = ''
  let arg = ''
  let inputs = 0
  
  let bitsCounter = []
  
  let name = 'nonamed'
  
  let iteraciones = 0
  while (i < src.length){
    if (waiting == 'opcode'){
      bitsCounter.push(i)
      
      codigo += '\n'
      cmd = src[i+1] + src[i]
      
      if (+('0x'+src[i+1]) >= 0x80){
        codigo += '!'
        cmd = (+('0x'+cmd) - 0x8000)
          .toString(16).padStart(4,'0')
      }
      
      if(cmd in op){
        codigo += op[cmd].name
        
        if (op[cmd].param != 0){
          waiting = 'param'
        }
        i+=2
      } else {
        throw new Error('Opcode undefined;'+
          '\n\toffset invoked: '+ bitsCounter.last() +
          '\n\tcmd byte: '+ cmd +
          '\n\nLast code:\n\t[...]\n'+ 
            codigo
            .split('\n')
            .reverse()
            .slice(0,3)
            .map(e => '\t'+e)
            .reverse()
            .join('\n')
            + '>>> ' + cmd + '\n\t[...]'
        )
      }
    }
    if (waiting == 'param'){
      codigo += ' '
      
      type = src[i]
      
      if (type == TYPE_CODE.TERMINAL_NULL){
        arg = ''
        waiting = 'opcode'
        i+=1
      }
      else if (type == TYPE_CODE.INT32){
        if ("def" in op[cmd]){
          if (op[cmd].def[inputs] == 'label'){
            let jump = leb128(+('0x'+src[i+4]+src[i+3]+src[i+2]+src[i+1]))
            
            i+=5
            
            jump = Math.abs(+(jump))
            
            arg = '@' + name + '_' + jump
            
            let target = 0
            
            for (let b = 0; b <= bitsCounter.length; b++){
              if (jump <= bitsCounter[b]){
                if (jump == bitsCounter[b]){
                  target = b+1
                  break
                }
              }
              if (bitsCounter[b] > jump){
                throw new Error(
                  'Jump undefined;'+
                  '\n\tinvoked bit: '+ bitsCounter.last() +
                  '\n\toffset bit: '+ jump
                )
              }
            }
            
            codigo = insertarSalto(
              codigo, arg.r('@',':'), target
            )
          }
        }
        else {
          arg = leb128(+('0x'+src[i+4]+src[i+3]+src[i+2]+src[i+1]))
          i+=5
        }
      }
      else if (type == TYPE_CODE.INT8){
          arg = leb128(+('0x'+src[i+1]))
          i+=2
      }
      else if (type == TYPE_CODE.INT16){
          arg = leb128(+('0x'+src[i+2]+src[i+1]))
          i+=3
      }
      else if (type == TYPE_CODE.FLOAT32){
        arg = src[i+4]+src[i+3]+src[i+2]+src[i+1]
        arg = (arg.hexToFloat()+"").slice(0,8)
        
        if (!arg.i('.')) arg += '.0';
        
        i+=5
      }
      else if (type == TYPE_CODE.LVAR){
        arg = +("0x"+src[i+2]+src[i+1]) + '@'
        
        i+=3
      }
      else if (type == TYPE_CODE.GVAR){
        arg = '$' + ~~(+("0x"+src[i+2]+src[i+1])/4)
        
        i+=3
      }
      else if (type == TYPE_CODE.STRING8){
        let str = ""
        let hex = src.slice(i+1, i+8).join('')
        
        for (let u = 0; u < hex.length; u += 2) {
          const char = hex.substr(u, 2)
          
          if (char == '00') break;
          
          str += String.fromCharCode(parseInt(char, 16))
        }
        
        arg = "'" + str + "'"
        i += 8
      }
      else if (type == TYPE_CODE.STRING16){
        let str = ""
        let hex = src.slice(i+1, i+16).join('')
        
        for (let u = 0; u < hex.length; u += 2) {
          const char = hex.substr(u, 2)
          
          if (char == '00') break;
          
          str += String.fromCharCode(parseInt(char, 16))
        }
        
        arg = '"' + str + '"'
        i += str.length +1
      }
      else if (type == TYPE_CODE.STRING_VARIABLE) {
        const length = +('0x'+src[i+1])
        const ascii = src.slice(i+2, i+2+length).join('')
        
        let str = ""
        for (let u = 0; u < length; u++) {
          const char = ascii.substr(u*2, 2)
        
          str += String.fromCharCode(+('0x'+char))
        }
        
        arg += '"'+str+'"'
        
        i += 2 + length
      }
      
      else {
        throw new Error('Parameter undefined;'+
          '\n\toffset invoked: '+ bitsCounter.last() +
          '\n\tcmd byte: '+ type +
          '\n\nLast code:\n\t[...]\n'+ 
            codigo
            .split('\n')
            .reverse()
            .slice(0,5)
            .map(e => '\t'+e)
            .reverse()
            .join('\n')
            + '[' + type + ' :: ??]\n\t[...]'
        )
      }
      
      
      codigo += arg
      inputs++
      if (inputs == op[cmd].param){
        waiting = 'opcode'
      }
    }
    
    iteraciones++
    if (iteraciones>1000)break;
  }
  return codigo.trim()
}

function leb128(byteArray) {
    if (byteArray > 0x7F && byteArray <= 0xff){
      byteArray -= 0xFF+1
    }
    if (byteArray > 0x7FFF && byteArray <= 0xffff){
      byteArray -= 0xFFFF+1
    }
    if (byteArray > 0x7FFFFFFF && byteArray <= 0xffffffff){
      byteArray -= 0xFFFFFFFF+1
    }
    
    return byteArray
}

function diffStringsWithLines(oldStr, newStr) {
    const oldLines = oldStr.split('\n');
    const newLines = newStr.split('\n');
    const diff = [];
    
    let i = 0, j = 0;
    
    while (i < oldLines.length || j < newLines.length) {
        if (oldLines[i] !== newLines[j]) {
            if (oldLines[i] && !newLines[j]) {
                diff.push({ type: 'removed', value: oldLines[i], line: i });
                i++;
            } else if (!oldLines[i] && newLines[j]) {
                diff.push({ type: 'added', value: newLines[j], line: j });
                j++;
            } else {
                diff.push({ type: 'changed', oldValue: oldLines[i], newValue: newLines[j], line: i });
                i++;
                j++;
            }
        } else {
            i++;
            j++;
        }
    }
    
    return diff;
}