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
	LINT      : '00',
	LFLOAT    : '01',
	LSTRING8  : '02',
	LSTRING16 : '03',
	GINT      : '80',
	GFLOAT    : '81',
	GSTRING8  : '82',
	GSTRING16 : '83'
}

const LS = {
	t : localStorage,
	get : (x) => LS.t.getItem(x),
	set : (x,y) => LS.t.setItem(x, y)
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

SP.PrePost = function(){
	return this
		.r(/^(int )?(\$.+) = (\d+|#.+|0x.+|0b.+)$/gim, `0004: $2 $3`)									//0004: $CUSTOM_TOURNAMENT_FLAG = 0
		.r(/^(float )?(\$.+) = (\d+\.\d+|\.\d+|\d+f)$/gim, `0005: $2 $3`)							//0005: $166 = 292.33
		.r(/^(int )?(\d+@([^\s]+)?) = (\d+|#.+|0x.+|0b.+)$/gim, `0006: $2 $4`)					//0006: 0@ = -1
		.r(/^(float )?(\d+@([^\s]+)?) = (\d+\.\d+|\.\d+|\d+f)$/gim, `0007: $2 $4`)		//0007: 7@ = 0.0
		.r(/^(int )?(\$.+) \+= (\d+|#.+|0x.+|0b.+)$/gim, `0008: $2 $3`)								//0008: $89 += 1
		.r(/^(float )?(\$.+) \+= (\d+\.\d+|\.\d+|\d+f)$/gim, `0009: $2 $3`)						//0009: $TEMPVAR_FLOAT_1 += 1.741
		.r(/^(int )?(\d+@([^\s]+)?) \+= (\d+|#.+|0x.+|0b.+)$/gim, `000A: $2 $4`)				//000A: 3@ += 3000
		.r(/^(float )?(\d+@([^\s]+)?) \+= (\d+\.\d+|\.\d+|\d+f)$/gim, `000B: $2 $4`)	//000B: 6@ += 0.1
		.r(/^(int )?(\$.+) \-= (\d+|#.+|0x.+|0b.+)$/gim, `000C: $2 $3`)								//000C: $1020 -= 1
		.r(/^(float )?(\$.+) \-= (\d+\.\d+|\.\d+|\d+f)$/gim, `000D: $2 $3`)						//000D: $TEMPVAR_Z_COORD -= 0.5
		.r(/^(int )?(\d+@([^\s]+)?) \-= (\d+|#.+|0x.+|0b.+)$/gim, `000E: $2 $4`)				//000E: 0@ -= 1
		.r(/^(float )?(\d+@([^\s]+)?) \-= (\d+\.\d+|\.\d+|\d+f)$/gim, `000F: $2 $4`)	//000F: 692@ -= 8.0
		.r(/^(int )?(\$.+) \*= (\d+|#.+|0x.+|0b.+)$/gim, `0010: $2 $3`)								//0010: $GS_GANG_CASH *= 100
		.r(/^(float )?(\$.+) \*= (\d+\.\d+|\.\d+|\d+f)$/gim, `0011: $2 $3`)						//0011: $HJ_TEMP_FLOAT *= 100.0
		.r(/^(int )?(\d+@([^\s]+)?) \*= (\d+|#.+|0x.+|0b.+)$/gim, `0012: $2 $4`)				//0012: 22@ *= -1
		.r(/^(float )?(\d+@([^\s]+)?) \*= (\d+\.\d+|\.\d+|\d+f)$/gim, `0013: $2 $4`)	//0013: 17@ *= 9.8
		.r(/^(int )?(\$.+) \/= (\d+|#.+|0x.+|0b.+)$/gim, `0014: $2 $3`)								//0014: $HJ_TWOWHEELS_TIME /= 1000
		.r(/^(float )?(\$.+) \/= (\d+\.\d+|\.\d+|\d+f)$/gim, `0015: $2 $3`)						//0015: $EXPORT_PRICE_HEALTH_MULTIPLIER /= 1000.0
		.r(/^(int )?(\d+@([^\s]+)?) \/= (\d+|#.+|0x.+|0b.+)$/gim, `0016: $2 $4`)				//0016: 4@ /= 2
		.r(/^(float )?(\d+@([^\s]+)?) \/= (\d+\.\d+|\.\d+|\d+f)$/gim, `0017: $2 $4`)	//0017: 14@ /= 1000.0

		.r(/^(int )?(\$.+) > (\d+|#.+|0x.+|0b.+)$/gim, `0018: $2 $4`)											//0018:   $CATALINA_TOTAL_PASSED_MISSIONS > 2
		.r(/^(int )?(\d+@([^\s]+)?) > (\d+|#.+|0x.+|0b.+)$/gim, `0019: $2 $4`)					//0019:   0@ > 0
		.r(/^(int )?(\d+|#.+|0x.+|0b.+) > (\$.+)$/gim, `001A: $2 $4`)									//001A:   10 > $SYNDICATE_TOTAL_PASSED_MISSIONS
		.r(/^(int )?(\d+|#.+|0x.+|0b.+) > (\d+@([^\s]+)?)$/gim, `001B: $2 $4`)					//001B:   3 > 20@
		.r(/^(int )?(\$.+) > (\$.+)$/gim, `001C: $2 $4`)															//001C:   $CURRENT_MONTH_DAY > $GYM_MONTH_DAY_WHEN_LIMIT_REACHED // (int)
		.r(/^(int )?(\d+@([^\s]+)?) > (\d+@([^\s]+)?)$/gim, `001D: $2 $4`)						//001D:   27@ > 33@  // (int)
		.r(/^(int )?(\$.+) > (\d+@([^\s]+)?)$/gim, `001E: $2 $4`)											//001E:   $CURRENT_TIME_IN_MS2 > 3@ // (int)
		.r(/^(int )?(\d+@([^\s]+)?) > (\$.+)$/gim, `001F: $2 $4`)											//001F:   9@ > $GIRL_PROGRESS[0] // (int)
		.r(/^(float )?(\$.+) > (\d+\.\d+|\.\d+|\d+f)$/gim, `0020: $2 $4`)								//0020:   $HJ_TWOWHEELS_DISTANCE_FLOAT > 0.0
		.r(/^(float )?(\d+@([^\s]+)?) > (\d+\.\d+|\.\d+|\d+f)$/gim, `0021: $2 $4`)				//0021:   26@ > 64.0
		.r(/^(float )?(\d+\.\d+|\.\d+|\d+f) > (\$.+)$/gim, `0022: $2 $4`)								//0022:   -180.0 > $1316
		.r(/^(float )?(\d+\.\d+|\.\d+|\d+f) > (\d+@([^\s]+)?)$/gim, `0023: $2 $4`)				//0023:   0.0 > 7@
		.r(/^(float )?(\$.+) > (\$.+)$/gim, `0024: $2 $4`)														//0024:   $HJ_CAR_Z > $HJ_CAR_Z_MAX // (float)
		.r(/^(float )?(\d+@([^\s]+)?) > (\d+@([^\s]+)?)$/gim, `0025: $2 $4`)					//0025:   3@ > 6@  // (float)
		.r(/^(float )?(\$.+) > (\d+@([^\s]+)?)$/gim, `0026: $2 $4`)										//0026:   $TEMPVAR_FLOAT_1 > 513@(227@,10f)  // (float)
		.r(/^(float )?(\d+@([^\s]+)?) > (\$.+)$/gim, `0027: $2 $4`)										//0027:   513@(227@,10f) > $TEMPVAR_FLOAT_2 // (float)

		.r(/^(int )?(\$.+) < (\d+|#.+|0x.+|0b.+)$/gim, `8018: $2 $4`)									//8018:   $CATALINA_TOTAL_PASSED_MISSIONS < 2
		.r(/^(int )?(\d+@([^\s]+)?) < (\d+|#.+|0x.+|0b.+)$/gim, `8019: $2 $4`)					//8019:   0@ < 0
		.r(/^(int )?(\d+|#.+|0x.+|0b.+) < (\$.+)$/gim, `801A: $2 $4`)									//801A:   10 < $SYNDICATE_TOTAL_PASSED_MISSIONS
		.r(/^(int )?(\d+|#.+|0x.+|0b.+) < (\d+@([^\s]+)?)$/gim, `801B: $2 $4`)					//801B:   3 < 20@
		.r(/^(int )?(\$.+) < (\$.+)$/gim, `801C: $2 $4`)															//801C:   $CURRENT_MONTH_DAY < $GYM_MONTH_DAY_WHEN_LIMIT_REACHED // (int)
		.r(/^(int )?(\d+@([^\s]+)?) < (\d+@([^\s]+)?)$/gim, `801D: $2 $4`)						//801D:   27@ < 33@  // (int)
		.r(/^(int )?(\$.+) < (\d+@([^\s]+)?)$/gim, `801E: $2 $4`)											//801E:   $CURRENT_TIME_IN_MS2 < 3@ // (int)
		.r(/^(int )?(\d+@([^\s]+)?) < (\$.+)$/gim, `801F: $2 $4`)											//801F:   9@ < $GIRL_PROGRESS[0] // (int)
		.r(/^(float )?(\$.+) < (\d+\.\d+|\.\d+|\d+f)$/gim, `8020: $2 $4`)								//8020:   $HJ_TWOWHEELS_DISTANCE_FLOAT < 0.0
		.r(/^(float )?(\d+@([^\s]+)?) < (\d+\.\d+|\.\d+|\d+f)$/gim, `8021: $2 $4`)				//8021:   26@ < 64.0
		.r(/^(float )?(\d+\.\d+|\.\d+|\d+f) < (\$.+)$/gim, `8022: $2 $4`)								//8022:   -180.0 < $1316
		.r(/^(float )?(\d+\.\d+|\.\d+|\d+f) < (\d+@([^\s]+)?)$/gim, `8023: $2 $4`)				//8023:   0.0 < 7@
		.r(/^(float )?(\$.+) < (\$.+)$/gim, `8024: $2 $4`)														//8024:   $HJ_CAR_Z < $HJ_CAR_Z_MAX // (float)
		.r(/^(float )?(\d+@([^\s]+)?) < (\d+@([^\s]+)?)$/gim, `8025: $2 $4`)					//8025:   3@ < 6@  // (float)
		.r(/^(float )?(\$.+) < (\d+@([^\s]+)?)$/gim, `8026: $2 $4`)										//8026:   $TEMPVAR_FLOAT_1 < 513@(227@,10f)  // (float)
		.r(/^(float )?(\d+@([^\s]+)?) < (\$.+)$/gim, `8027: $2 $4`)										//8027:   513@(227@,10f) < $TEMPVAR_FLOAT_2 // (float)

		.r(/^(int )?(\$.+) >= (\d+|#.+|0x.+|0b.+)$/gim, `0028: $2 $4`)									//0028:   $CATALINA_TOTAL_PASSED_MISSIONS >= 2
		.r(/^(int )?(\d+@([^\s]+)?) >= (\d+|#.+|0x.+|0b.+)$/gim, `0029: $2 $4`)				//0029:   0@ >= 0
		.r(/^(int )?(\d+|#.+|0x.+|0b.+) >= (\$.+)$/gim, `002A: $2 $4`)									//002A:   10 >= $SYNDICATE_TOTAL_PASSED_MISSIONS
		.r(/^(int )?(\d+|#.+|0x.+|0b.+) >= (\d+@([^\s]+)?)$/gim, `002B: $2 $4`)				//002B:   3 >= 20@
		.r(/^(int )?(\$.+) >= (\$.+)$/gim, `002C: $2 $4`)															//002C:   $CURRENT_MONTH_DAY >= $GYM_MONTH_DAY_WHEN_LIMIT_REACHED // (int)
		.r(/^(int )?(\d+@([^\s]+)?) >= (\d+@([^\s]+)?)$/gim, `002D: $2 $4`)						//002D:   27@ >= 33@  // (int)
		.r(/^(int )?(\$.+) >= (\d+@([^\s]+)?)$/gim, `002E: $2 $4`)										//002E:   $CURRENT_TIME_IN_MS2 >= 3@ // (int)
		.r(/^(int )?(\d+@([^\s]+)?) >= (\$.+)$/gim, `002F: $2 $4`)										//002F:   9@ >= $GIRL_PROGRESS[0] // (int)
		.r(/^(float )?(\$.+) >= (\d+\.\d+|\.\d+|\d+f)$/gim, `0030: $2 $4`)								//0030:   $HJ_TWOWHEELS_DISTANCE_FLOAT >= 0.0
		.r(/^(float )?(\d+@([^\s]+)?) >= (\d+\.\d+|\.\d+|\d+f)$/gim, `0031: $2 $4`)			//0031:   26@ >= 64.0
		.r(/^(float )?(\d+\.\d+|\.\d+|\d+f) >= (\$.+)$/gim, `0032: $2 $4`)								//0032:   -180.0 >= $1316
		.r(/^(float )?(\d+\.\d+|\.\d+|\d+f) >= (\d+@([^\s]+)?)$/gim, `0033: $2 $4`)			//0033:   0.0 >= 7@
		.r(/^(float )?(\$.+) >= (\$.+)$/gim, `0034: $2 $4`)														//0034:   $HJ_CAR_Z >= $HJ_CAR_Z_MAX // (float)
		.r(/^(float )?(\d+@([^\s]+)?) >= (\d+@([^\s]+)?)$/gim, `0035: $2 $4`)					//0035:   3@ >= 6@  // (float)
		.r(/^(float )?(\$.+) >= (\d+@([^\s]+)?)$/gim, `0036: $2 $4`)									//0036:   $TEMPVAR_FLOAT_1 >= 513@(227@,10f)  // (float)
		.r(/^(float )?(\d+@([^\s]+)?) >= (\$.+)$/gim, `0037: $2 $4`)									//0037:   513@(227@,10f) >= $TEMPVAR_FLOAT_2 // (float)

		.r(/^(int )?(\$.+) <= (\d+|#.+|0x.+|0b.+)$/gim, `8028: $2 $4`)									//8028:   $CATALINA_TOTAL_PASSED_MISSIONS <= 2
		.r(/^(int )?(\d+@([^\s]+)?) <= (\d+|#.+|0x.+|0b.+)$/gim, `8029: $2 $4`)				//8029:   0@ <= 0
		.r(/^(int )?(\d+|#.+|0x.+|0b.+) <= (\$.+)$/gim, `802A: $2 $4`)									//802A:   10 <= $SYNDICATE_TOTAL_PASSED_MISSIONS
		.r(/^(int )?(\d+|#.+|0x.+|0b.+) <= (\d+@([^\s]+)?)$/gim, `802B: $2 $4`)				//802B:   3 <= 20@
		.r(/^(int )?(\$.+) <= (\$.+)$/gim, `802C: $2 $4`)															//802C:   $CURRENT_MONTH_DAY <= $GYM_MONTH_DAY_WHEN_LIMIT_REACHED // (int)
		.r(/^(int )?(\d+@([^\s]+)?) <= (\d+@([^\s]+)?)$/gim, `802D: $2 $4`)						//802D:   27@ <= 33@  // (int)
		.r(/^(int )?(\$.+) <= (\d+@([^\s]+)?)$/gim, `802E: $2 $4`)										//802E:   $CURRENT_TIME_IN_MS2 <= 3@ // (int)
		.r(/^(int )?(\d+@([^\s]+)?) <= (\$.+)$/gim, `802F: $2 $4`)										//802F:   9@ <= $GIRL_PROGRESS[0] // (int)
		.r(/^(float )?(\$.+) <= (\d+\.\d+|\.\d+|\d+f)$/gim, `8030: $2 $4`)								//8030:   $HJ_TWOWHEELS_DISTANCE_FLOAT <= 0.0
		.r(/^(float )?(\d+@([^\s]+)?) <= (\d+\.\d+|\.\d+|\d+f)$/gim, `8031: $2 $4`)			//8031:   26@ <= 64.0
		.r(/^(float )?(\d+\.\d+|\.\d+|\d+f) <= (\$.+)$/gim, `8032: $2 $4`)								//8032:   -180.0 <= $1316
		.r(/^(float )?(\d+\.\d+|\.\d+|\d+f) <= (\d+@([^\s]+)?)$/gim, `8033: $2 $4`)			//8033:   0.0 <= 7@
		.r(/^(float )?(\$.+) <= (\$.+)$/gim, `8034: $2 $4`)														//8034:   $HJ_CAR_Z <= $HJ_CAR_Z_MAX // (float)
		.r(/^(float )?(\d+@([^\s]+)?) <= (\d+@([^\s]+)?)$/gim, `8035: $2 $4`)					//8035:   3@ <= 6@  // (float)
		.r(/^(float )?(\$.+) <= (\d+@([^\s]+)?)$/gim, `8036: $2 $4`)									//8036:   $TEMPVAR_FLOAT_1 <= 513@(227@,10f)  // (float)
		.r(/^(float )?(\d+@([^\s]+)?) <= (\$.+)$/gim, `8037: $2 $4`)									//8037:   513@(227@,10f) <= $TEMPVAR_FLOAT_2 // (float)

		.r(/^(string )?(\d+@([^\s]+)?) = ('([^\n\']+)?')$/gim, `05A9: $2 $3`)
		.r(/^(long )?(\d+@([^\s]+)?) = ("([^\n\"]+)?")$/gim, `06D1: $2 $3`)
		.r(/^(string )?(\d+@([^\s]+)?) == ('([^\n\']+)?')$/gim, `05A9: $2 $3`)
		.r(/^(long )?(\d+@([^\s]+)?) == ("([^\n\"]+)?")$/gim, `06D1: $2 $3`)
}

SP.ValidateSyntax = function(){
	function validate(text){
		let keywords = ["if", "then", "end", "while", "repeat", "until", "for"]
		let arr = text.split(/\s/)
		text = arr.filter(word => keywords.includes(word)).join('')
		console.log(text)

		text = text
			.replace(/if/gi,'(')
			.replace(/then/gi,'){')
			.replace(/end/gi,'}')
			.replace(/while/gi,'(){')
			.replace(/repeat/gi,'{')
			.replace(/until/gi,'}()')
		console.log(text)

		function isOpen(character){
			return ['(','{','['].includes(character)
		}
		function closes(characterA, characterB){
			let pairs = { '<':'>', '{':'}', '[':']', '(':')'}
			return pairs[characterA] === characterB
		}

		let stack = []

		for(let character of text.split('')){
			if (isOpen(character)){
				stack.push(character)
			}
			else{
				let topChar = stack.pop()
				if(!closes(topChar, character)){
					return false
				}
			}
		}
		return stack.length === 0
	}
}

SP.Translate = function(_SepareWithComes = false){
	let LineComand = this
		.r(/(\s+)?\/\*([^\/]*)?\*\//gm, '')
		.r(/(\s+)?\{([^\$][^\}]*)?\}/gm, '')

	const come = a => {
		if (_SepareWithComes){
			return a + ','
		}
		return a
	}

	let codeDepurated = []
	let totalSizePerLine = []
	
	/*
	if (this.match(/[^\w\d]("([^"\n]+)?)(\x20)(([^"\n]+)?")[^\w\d]/)
		|| this.match(/[^\w\d]('([^'\n]+)?)(\x20)(([^'\n]+)?')[^\w\d]/)
		|| this.match(/[^\w\d](`([^`\n]+)?)(\x20)(([^`\n]+)?`)[^\w\d]/)) {
		log('NO ADD SPACES IN STRINGS')
		return
	}
	*/

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
		.PrePost()
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

					try {
						typeData = SCM_DB[command].params[--numArgument]
					}catch{
						throw new SyntaxError(`unknown parameter\n\tat line ${(1+numLine)} the value ${Argument}\n\t${setOp == '0000' ? 'XXXX' : setOp}: ${Line}`);
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
							Argument = Argument.r(/("([^\"]+)?"|`(.+)?`)/, '$2$3').r(/\x00/g,'\x20')
							Argument = Argument.substring(0,255)
							console.log(Argument)
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

							function translateDate(dataInput){
								dataInput = 
									Number(dataInput.r(/@(i|f|s|v)?/,'')).toString(16)
									.padStart(4,'0')
									.toBigEndian();

								return dataInput
							}


							if (/@(.+)@/.test(Argument)){
								totalSizePerLine.push(6)

								Argument = 
									come(TYPE_CODE.LVAR_ARRAY)
									+ Argument
										.r(/\d+@(i|f|s|v)?/g, inputVar => {
											return Number(inputVar.r(/@(i|f|s|v)?/,'')).toString(16)
											.padStart(4,'0')
											.toBigEndian() + ',';
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
													inputType = ELEMENT_TYPE.LINT
												break;
												case 'f':
													inputType = ELEMENT_TYPE.LFLOAT
												break;
												case 's':
													inputType = ELEMENT_TYPE.LSTRING8
												break;
												case 'v':
													inputType = ELEMENT_TYPE.LSTRING16
												break;
											}

											return ',' + inputType
										})
										.r(/\d+,\d+$/m, inputSize => {
											inputSize = inputSize.split(',')

											inputSize[0] = Number(inputSize[0]).toString(16).padStart(2,'0')
											

											return inputSize
										})
							}
							else{
								totalSizePerLine.push(2)

								Argument = 
									come(TYPE_CODE.LVAR) 
									+ Number(Argument.r(/@(i|f|s|v)?/,'')).toString(16)
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
										.r(/(i|f|s|v)?\$[\w\d_]+/g, inputVar => {
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
												console.log(inputVar)
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
			throw new Error(`label not found "${label}"`)
			return "<@"+label+">"
		}

		return jump.toBigEndian()
	})

	return codeOfFinalDepurated
}
// 0001<@MAIN>0001<@MAIN>0001<@MAIN>
/*log(`
nop // operations aritmetics suports: =, +=, -=, *=, /=, >, <, >=, <=
0@ += 0      // int
1@ -= 0x1C   // int
2@ = #jester // int
3@ *= 2f     // float
4@ /= 5.0    // float
5@ > .75     // float
6@ = 'string'
7@ = 'longstring'
:main
    wait 0@
goto @main
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
	$SBL_State.style = ''
	$('#PREVIEW').style.filter = ''
	c.remove('loading')

	$('#HEX').select()
	getLine()
	$('#OUTHEX').value = $('#HEX').value.Translate(true)

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
