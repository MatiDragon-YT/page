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
  				0,
  				0.25,
  				0.5,
  				1,
  				1.5,
  				3,
  				'initial', 'auto'
  			].forEach(function(value, index){
  				tempCSS += '.' + attribute[0] + prefix + index + '{' + attribute[1]+ ':' + value + 'rem!important}';
  			});
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
  
  		for(let i = 0; i < 100; i++){
  			tempCSS += '.w' + prefix + i + '{width:' + i + '%!important}'
  			tempCSS += '.w' + prefix + i + 'rem{width:' + i + 'rem!important}'
  			tempCSS += '.h' + prefix + i + '{height:' + i + 'vh!important}'
  			tempCSS += '.opa' + prefix + i + '{opacity:' + i + '%!important}'
  		};
  
  		[
  			'flex',
  			'none',
  			'block',
  			'inline',
  			'inline-block',
  			'grid'
  		].forEach((value, index) => {
  			tempCSS += `.d${prefix}${value} { display : ${value} !important}\n`
  		});
  		
  		[
  			'flex',
  		  'none',
  		 	'block',
  		  'inline-block',
  		  'grid'
  		].forEach((value, index) => {
  		  tempCSS += `.d${prefix}${value} { display : ${value} !important}\n`
  		});
  		
  		[
  			'left',
  		  'center',
  		 	'right'
  		].forEach((value, index) => {
        tempCSS += `.text${prefix}${value} { text-align : ${value} !important}\n`
      });
 
 [
   ['wrap','flex-wrap: wrap'],
   ['column','flex-direction: column'],
   ['row','flex-direction: row'],
   ['reverse','flex-direction: row-reverse'],
   ['end','justify-content: flex-end'],
   ['between','justify-content: space-between'],
   ['center','justify-content: center'],
   ['button','align-items: flex-end']
 ].forEach((value, index) => {
  		  tempCSS +=
  		  `.flex{&.${prefix.replace('-','')}${value[0]}{${value[1]}!important}}`
  		});
	
  
  		[
  			'relative',
  			'absolute',
  			'initial',
  			'fixed',
  			'reverse',
  			'reverse-inline'
  		].forEach((value, index) => {
  			tempCSS += `.p${prefix}${value} { position : ${value} !important}\n`
  		});
  
  		[
  			'right',
  			'left',
  			'top',
  			'buttom',
  		].forEach((value, index) => {
  			tempCSS += `.r${prefix}${value} { ${value} : 0 !important}\n`
  		});
  
  		if (resolucion != 0) {tempCSS += '}\n\n'}
  	})
  
  let $cssGenerated = document.createElement('style')
  $cssGenerated.id = 'newCss'
  $cssGenerated.innerHTML = tempCSS
  document.body.append($cssGenerated)
