let css = ``

const prefixes = ['-','-sm-','-md-','-lg-','-xl-','-xxl-']
const size = [0,576,768,992,1200,1400]

prefixes.forEach((prefix, resolucion) => {
	if (resolucion != 0) {css += `@media (min-width:${size[resolucion]}px) {\n`}
	
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
	].forEach(attribute => {
		[
			'0',
			'.25rem',
			'.5rem',
			'1rem',
			'1.5rem',
			'3rem'
		].forEach((value, index) => {
			css += `.${attribute[0]}${prefix}${index} { ${attribute[1]} : ${value} !important}\n`
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
		css += `.col${prefix}${++index} { width : ${value} !important}\n`
	})


	if (resolucion != 0) {css += '}\n\n'}
})