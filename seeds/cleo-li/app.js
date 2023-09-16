const log = (MESSAGE) =>
	console.log(MESSAGE)

// GLOBAL VARS
const D = document

const SP = String.prototype
const EP = Element.prototype

// ----------------
// FUNCTIONS

/** Smart selector for elements of the DOM
 * @param {DOMString}
 * @param {Element} optional
 * @return {Element}
*/
const $ = (element, _parent = D) => {
	const xElements = _parent.querySelectorAll(element)
	const length = xElements.length

	return element.charAt(0) === '#' && !/\s/.test(element) || length === 1
		? _parent.querySelector(element)
		: length === 0
			? undefined
			: xElements
}


/** Shotcun of String.replace()
*/
SP.r = function(a, b = '', c = ''){
	return this.replace(a, b, c)
}

/** Polifill and shotcun of String.replaceAll()
*/
SP.rA = function(xText, zText){
	let temp = this

	if(temp.indexOf(xText, 0) !== -1){
		temp = temp
		.r(xText, zText)
		.rA(xText, zText)
	}
	
	return temp
}

/** Apply a function to all elements of the DOM
 * @param {NodeList || [...NodeList]} 
 * @param {function}
*/
function apply(element, callback){
	if(element){
		if('' + element == '[object NodeList]'){ 
			element.forEach(function(e){
				callback(e)
			})
		}else{  
			callback(element)
		}
	}
}



// ------------------


let fxt = `0 Download
1 Features
2 Discuss
3 Change Log
4 Report an issue
5 Language
6 Welcome to the official site of the CLEO library (or simply CLEO) - a hugely popular extensible plugin for the <a href='https://www.rockstargames.com/grandtheftauto/'>Grand Theft Auto games series</a> by Rockstar Games, allowing the use of <a href='https://cleo.li/scripts.html'>thousands of unique mods</a> which change or expand the gameplay. There are different versions of CLEO made for GTA III, GTA Vice City and GTA San Andreas.
7 JavaScript runtime for GTA 3D games
button-sa  Download for GTA SA
button-saios Download for GTA SA iOS
button-iii Download for GTA III
button-vc Download for GTA VC`

fxt = fxt.split('\n')
fxt.forEach((text, ele) => {
	fxt[ele] = text.r(/^([\w\d-_@]+) /gim, '$1°°°').split('°°°')

	$(`[tr="${fxt[ele][0]}"]`).innerHTML = fxt[ele][1]
})


const CSSComputarized = function(){
	let tempCSS = ``

	const prefixes = ['-','-sm-','-md-','-lg-','-xl-','-xxl-']
	const size = [0,576,768,992,1200,1400]

	prefixes.forEach((prefix, resolucion) => {
		if (resolucion != 0) {tempCSS += `@media (min-width:${size[resolucion]}px) {\n`}
	
		let vIndex = 0
		while(vIndex < 13){
			tempCSS += '.cols'+prefix+vIndex+'{columns:'+vIndex+' auto}'

			vIndex++
		}
		
		[
			['m', 'margin'],
			['mt', 'margin-top'],
			['mb', 'margin-bottom'],
			['ml', 'margin-left'],
			['mr', 'margin-right'],
			['mx', 'margin-block'],
			['my', 'margin-inline'],
			['p', 'padding'],
			['pt', 'padding-top'],
			['pb', 'padding-bottom'],
			['pl', 'padding-left'],
			['pr', 'padding-right'],
			['px', 'padding-block'],
			['py', 'padding-inline'],
			['g', 'gap'],
			['r', 'border-radius'],
			['fz', 'font-size']
		].forEach(attribute => {
			[
				'0',
				'.25rem',
				'.5rem',
				'1rem',
				'1.5rem',
				'3rem'
			].forEach((value, index) => {
				tempCSS += `.${attribute[0]}${prefix}${index} { ${attribute[1]} : ${value} !important}\n`
			})
		});

		[
			'8.33333333%',
			'16.66666667%',
			'25%',
			'33.33333333%',
			'41.66666667%',
			'50%',
			'58.33333333%',
			'66.66666667%',
			'75%',
			'83.33333333%',
			'91.66666667%',
			'100%'
		].forEach((value, index) => {
			tempCSS += `.col${prefix}${++index} { width : ${value} !important}\n`
			tempCSS += `.offset${prefix}${++index} { margin-left : ${value} !important}\n`
		});

		[
			'flex',
			'none',
			'block',
			'inline-block'
		].forEach((value, index) => {
			tempCSS += `.d${prefix}${value} { display : ${value} !important}\n`
		});


		if (resolucion != 0) {tempCSS += '}\n\n'}
	})
	return tempCSS
}()

let CSS = {
	Add: function(styles){STYLES.innerHTML += styles},
	Remove: function(styles){STYLES.innerHTML = STYLES.innerHTML.r(styles, "")}
}

CSS.Add(CSSComputarized)