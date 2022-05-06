let tempCSS = ``

const prefixes = ['-','-sm-','-md-','-lg-','-xl-','-xxl-']
const size = [0,576,768,992,1200,1400]

prefixes.forEach(function(prefix, resolucion){
	if (resolucion != 0) {tempCSS += '@media(min-width:' + size[resolucion] + 'px){'}
	
	var vIndex = 0
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
		['r', 'border-radius']
	].forEach(function(attribute){
		[
			'0',
			'.25rem',
			'.5rem',
			'1rem',
			'1.5rem',
			'3rem'
		].forEach(function(value, index){
			tempCSS += '.' + attribute[0] + prefix + index + '{' + attribute[1]+ ':' + value + '!important}'
		})
	});

	[
		'auto',
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
	].forEach(function(value, index){
		tempCSS += '.col' + prefix + (index == 0 ? 'auto' : ++index) + '{width:' + value + '!important}'
		tempCSS += '.offset' + prefix + (index == 0 ? 'auto' : ++index) + '{margin-left:' + value + '!important}'
	});

	if (resolucion != 0) {tempCSS += '}\n\n'}
})

console.log(tempCSS)