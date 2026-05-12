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

/*
0000: nop
:nonamed_2
0002: goto @nonamed_2
0001: wait 1000
0AD0: printf 1000 "activado" 1000 
0AB1: cleo_call  5 92 582.0 100.0 13.0 13.0
*/
function createLabelManager(prefix = 'nonamed'){
  let counter = 0
  const map = new Map()

  return {
    alloc(offset){
      if (!map.has(offset)){
        map.set(offset, `${prefix}_${counter++}`)
      }
      return map.get(offset)
    },
    get(offset){
      return map.get(offset)
    },
    has(offset){
      return map.has(offset)
    },
    entries(){
      return map.entries()
    }
  }
}

// Esto es un ejemplo de cómo se ve el código descompilado. La función descompilar toma una cadena de hex y la convierte en instrucciones legibles.
log(descompilar(`0000,0200,01,02000000,0100,05,0000,D00A,0E,08,61-63-74-69-76-61-64-6F,05,E803,00,B10A,01,09000000,04,05,04,5C,06,00801144,06,0000C842,06,00005041,06,00005041,00`))
function descompilar(scm){

  const byteArray = scm.r(/(,|\s|\-)/g).match(/.{2}/g)

  const opcodes = {
    '0000':{name:'nop',param:0},
    '0001':{name:'wait',param:1},
    '0002':{name:'goto',param:1,def:['label']},
    '0050':{name:'gosub',param:1,def:['label']},
    '0AB1':{name:'cleo_call',param:-1,def:['label','int']},
    '0AD0':{name:'printf',param:-1},
    '0DD0':{name:'get_label_addr',param:2,def:['var','label']},
    '0DD1':{name:'get_func_addr_by_cstr_name',param:2},
  }

  /** ---------------------------
   * PASADA 1 — PARSEO A IR
   * --------------------------*/
  const instructions = []
  const labels = createLabelManager()
  let index = 0
  let byteOffset = 0

  while (index < byteArray.length){

    const insOffset = byteOffset
    let opcodeHex = byteArray[index+1] + byteArray[index]
    let negative = false

    if (+('0x'+byteArray[index+1]) >= 0x80){
      negative = true
      opcodeHex = (+('0x'+opcodeHex) - 0x8000)
        .toString(16).padStart(4,'0')
    }

    if (!(opcodeHex in opcodes)){
      throw new Error(`Opcode undefined at byte ${byteOffset}`)
    }

    const meta = opcodes[opcodeHex]

    const ins = {
      offset: insOffset,
      opcode: opcodeHex,
      name: meta.name,
      negative,
      params: [],
      size: 2
    }

    index += 2
    byteOffset += 2

    let paramCount = 0

    while (meta.param !== 0){

      const type = byteArray[index]

      // TERMINAL NULL
      if (type === TYPE_CODE.TERMINAL_NULL){
        index++
        byteOffset++
        break
      }

      // INT32 (LABEL o INT)
      if (type === TYPE_CODE.INT32){
        const raw = +('0x'+byteArray[index+4]+byteArray[index+3]+byteArray[index+2]+byteArray[index+1])
        const value = leb128(raw)
        const abs = Math.abs(value)

        const isLabel = meta.def && meta.def[paramCount] === 'label'

        if (isLabel){
          labels.alloc(abs)
          ins.params.push({
            type:'label',
            target: abs,
            size:5
          })
        } else {
          ins.params.push({
            type:'value',
            value,
            size:5
          })
        }

        index += 5
        byteOffset += 5
      }

      // INT8
      else if (type === TYPE_CODE.INT8){
        ins.params.push({
          type:'value',
          value: leb128(+('0x'+byteArray[index+1])),
          size:2
        })
        index += 2
        byteOffset += 2
      }

      // INT16
      else if (type === TYPE_CODE.INT16){
        ins.params.push({
          type:'value',
          value: leb128(+('0x'+byteArray[index+2]+byteArray[index+1])),
          size:3
        })
        index += 3
        byteOffset += 3
      }

      // FLOAT32
      else if (type === TYPE_CODE.FLOAT32){
        let hex = byteArray[index+4]+byteArray[index+3]+byteArray[index+2]+byteArray[index+1]
        let v = (hex.hexToFloat()+"").slice(0,8)
        if (!v.i('.')) v += '.0'
        ins.params.push({ type:'value', value:v, size:5 })
        index += 5
        byteOffset += 5
      }

      // LVAR
      else if (type === TYPE_CODE.LVAR){
        ins.params.push({
          type:'value',
          value: +("0x"+byteArray[index+2]+byteArray[index+1]) + '@',
          size:3
        })
        index += 3
        byteOffset += 3
      }

      // GVAR
      else if (type === TYPE_CODE.GVAR){
        ins.params.push({
          type:'value',
          value: '$' + ~~(+("0x"+byteArray[index+2]+byteArray[index+1])/4),
          size:3
        })
        index += 3
        byteOffset += 3
      }

      // STRING8
      else if (type === TYPE_CODE.STRING8){
        let str = ""
        let hex = byteArray.slice(index+1, index+8).join('')
        for (let i=0;i<hex.length;i+=2){
          const c = hex.substr(i,2)
          if (c==='00') break
          str += String.fromCharCode(parseInt(c,16))
        }
        ins.params.push({ type:'value', value:`'${str}'`, size:8 })
        index += 8
        byteOffset += 8
      }

      // STRING_VARIABLE
      else if (type === TYPE_CODE.STRING_VARIABLE){
        const len = +('0x'+byteArray[index+1])
        const ascii = byteArray.slice(index+2, index+2+len).join('')
        let str = ""
        for (let i=0;i<len;i++){
          str += String.fromCharCode(+('0x'+ascii.substr(i*2,2)))
        }
        ins.params.push({ type:'value', value:`"${str}"`, size:2+len })
        index += 2+len
        byteOffset += 2+len
      }

      else {
        throw new Error(`Unknown param ${type} at ${byteOffset}`)
      }

      paramCount++
      if (meta.param !== -1 && paramCount >= meta.param) break
    }

    instructions.push(ins)
  }

  /** ---------------------------
   * PASADA 2 — NORMALIZAR LABELS
   * (offsets intermedios)
   * --------------------------*/
  for (const ins of instructions){
    let cursor = ins.offset + 2
    for (const p of ins.params){
      if (labels.has(cursor)){
        labels.alloc(cursor)
      }
      cursor += p.size
    }
  }

  /** ---------------------------
   * PASADA 3 — RENDER FINAL
   * --------------------------*/
  const output = []

  for (const ins of instructions){

    if (labels.has(ins.offset)){
      output.push(`:${labels.get(ins.offset)}`)
    }

    let line = (ins.negative?'!':'') + ins.name
    let cursor = ins.offset + 2

    for (const p of ins.params){

      if (labels.has(cursor)){
        line += ` :${labels.get(cursor)}`
      }

      if (p.type === 'label'){
        line += ` @${labels.get(p.target)}`
      } else {
        line += ` ${p.value}`
      }

      cursor += p.size
    }

    output.push(line)
  }

  // etiquetas colgantes al final
  for (const [offset,name] of labels.entries()){
    if (!instructions.some(i => i.offset === offset)){
      output.push(`:${name}`)
    }
  }

  return output.join('\n')
}


function leb128(n){
  if (n > 0x7F && n <= 0xFF) n -= 0x100
  if (n > 0x7FFF && n <= 0xFFFF) n -= 0x10000
  if (n > 0x7FFFFFFF) n -= 0x100000000
  return n
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