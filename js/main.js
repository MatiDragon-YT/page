const log =(MESSAGE, _CSS = '') =>
	console.log('%c'+ MESSAGE, _CSS)

// GLOBAL VARS
const D = document

const SP = String.prototype
const EP = Element.prototype

/** Smart selector for elements of the DOM
 * @param {DOMString}
 * @param {Element} optional
 * @return {Element}
*/
const $ = (element, _parent = D) => {
	const callback = _parent
	if (typeof _parent == 'function'){
		_parent = D
	}
	const xElements = _parent.querySelectorAll(element)
	const length = xElements.length

	element = element.charAt(0) === '#' && !/\s/.test(element) || length === 1
		? _parent.querySelector(element)
		: length === 0
			? undefined
			: xElements

	if (typeof callback == 'function'){
		if(element){
			if('' + element == '[object NodeList]'){ 
				element.forEach(function(e){
					callback(e)
				})
			}else{  
				callback(element)
			}
		}
	}else{
		return element
	}
}

/** Smart selector for elements of the DOM
 * @param {DOMString}
 * @return {Element}
*/
const new$ = element => {
	let $temp = D.createElement(element)
	$('body').appendChild($temp)
	return $temp
}

/** Get the language specified in the html
 * @return {String}
*/
const LANG = ($('html').getAttribute('lang') || 'en').toUpperCase()

/** Get the root folder of the resources internal to the language
 * @return {String}
*/
const ROOT = $('head').innerHTML.match(/"(https.+|[\/\.]+)\/css\/main\.css"/)[1] + "/"

/** Get the root folder of the resources external to the language
 * @return {String}
*/
const exROOT = function(){
	// In order to have a visible resource load from the browsers
	if (navigator.userAgent.match("MSIE") != null){
		// it is checked only if IE is being used
		
		const HREF = location.href

		const X = HREF.search(/:/) == 2 ? 14 : 7
		const Y = HREF.lastIndexOf("\\") + 1

		return 'file:///' + location.href.substring(X, Y) + "/files/"
	}

	return ROOT + "/files/"
}()

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

		for(let i = 0; i < 100; i++){
			tempCSS += '.w' + prefix + i + '{width:' + i + '%!important}'
			tempCSS += '.w' + prefix + i + 'rem{width:' + i + 'rem!important}'
			tempCSS += '.h' + prefix + i + '{height:' + i + 'vh!important}'
		};

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
	return tempCSS
}()

let META = {
	TITLE : $("title").innerHTML,
	DESCRIPTION : $('meta[name=description]') ? $('meta[name=description]').content : 'Mods y herramientas para GTASA por MatiDragon',
	YT_ID : $('meta[name=image]') ? $('meta[name=image]').content : ''
}

META = {...META, YT_V: `https://www.youtube.com/watch?v=${ META.YT_ID }`}

$('head').innerHTML = $('head').innerHTML + `
	<meta name="Author" content="MatiDragon">
	<meta name="Publisher" content="MatiDragon">
	<meta name="Copyright" content="MatiDragon">
	<!--  Android 5 Chrome Color-->
	<meta name="color-scheme" content="dark light">
	<meta name="theme-color" media="(prefers-color-scheme: light)" content="white">
	<meta name="theme-color" media="(prefers-color-scheme: dark)" content="black">
	<meta name="msapplication-TileColor" content="green">
	<meta name="MobileOptimized" content="width">
	<meta name="HandheldFriendly" content="true">
	<meta name="apple-mobile-web-app-capable" content="true">
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
	<!-- Property-->
	<meta property="og:locale" content="es_AR" />
	<meta property="og:title" content="${META.TITLE} - MatiDragon" />
	<meta property="og:description" content="${META.DESCRIPTION}" />
	<meta property="og:image" content="https://i.ytimg.com/vi/${META.VIDEO_ID}/hqdefault.jpg" />
	<meta property="article:publisher" content="https://matidragon-yt.github.io/page/" />
	<meta property="og:url" content="${location.href}" />
	<meta property="og:site_name" content="MatiDragon" />
	<meta property="article:published_time" content="2022-11-6T05:29:00+00:00" />
	<meta property="article:modified_time" content="2022-11-6T13:39:22+00:00" />
	<meta property="og:image:width" content="480" />
	<meta property="og:image:height" content="360" />
	<meta property="og:image:type" content="image/jpeg" />
	<!-- Favicons-->
	<meta name="msapplication-TileColor" content="green">
	<meta name="msapplication-TileImage" content="${ROOT}static/images/icon/144x144.png">
	<link rel="apple-touch-icon-precomposed" href="${ROOT}static/images/icon/152x152.png">
	<link rel="icon" href="${ROOT}static/images/icon/32x32.png" sizes="32x32">
	<link rel="icon" href="${ROOT}static/images/icon/48x48.png" sizes="48x48">
	<link rel="icon" href="${ROOT}static/images/icon/96x96.png" sizes="96x96">
	<link rel="icon" href="${ROOT}static/images/icon/144x144.png" sizes="144x144">
	<link rel="shortcut icon" href="${ROOT}static/images/icon/favicon.ico" type="image/x-icon">
	<!-- Resto-->
`

let CSS = {
	Add: function(styles){STYLES.innerHTML += styles},
	Remove: function(styles){STYLES.innerHTML = STYLES.innerHTML.r(styles, "")}
}

let modeLight = 0
function ModeLight(){
	const TEMPLADE = `
		#navbar {
		    background: #ddd!important;
		    color: #000!important;
		}
		#nav { background: #f2f2f2!important}
		#nav *, #navbar *{ color: #0d1117!important}
		html{
			background: #fff!important;
			color: #0d1117!important;
		}
		::-webkit-scrollbar { width: 1rem;}
		::-webkit-scrollbar-track { background: #ddd }
		::-webkit-scrollbar-thumb { background: #aaa; border: 1px #ddd solid; }
		::-webkit-scrollbar-corner {background: #ddd}
		input[type='text'], input[type='number'] {
			background: #ddd;
			color: #0d1117;
		}
		input[type='text']:focus, input[type='number']:focus {
			border-bottom: #c9cfd5 solid 1px;
		}
		code, .code, kbd, pre, samp {
			background: #eceff1!important;
			color: #212121!important;
		}
		h1, h2, h3, hr {border-bottom: #c9cfd5 1px solid}
		table {border: 1px solid #c9cfd5}
		td {
			border-left: #c9cfd5 1px solid;
			border-top: #c9cfd5 1px solid;
		}
		th, td {border-left: #c9cfd5 1px solid}
		.labels { color: #009688 }
		.keywords { color: #ff5722 }
		.models { color: #607d8b }
		.classes { color: #d32f2f }
		.commands { color: #0288d1 }
		.numbers,
		.numbers * { color: #7e57c2 }
		.variables { color: #607d8b }
		.strings,
		.strings * { color: #009688 }
		.comments,
		.comments * { color: #0288d1 }
		.directives,
		.directives * { color: #607d8b }

		.white-dm,.white-dm * {color:#0d1117}
		.bg-black-2-dm {background:#dfdfdf}
		`
	if (!modeLight) {
		modeLight++
		CSS.Add(TEMPLADE)
		return true
	}
	else{
		modeLight--
		CSS.Remove(TEMPLADE)
		return false
	}
}

EP.next = function(){
	return this.nextElementSibling
}

EP.previous = function(){
	return this.previousElementSibling
}

EP.show = function(){
    this.style.display = "block"
}

EP.hide = function(){
    this.style.display = "none"
}

EP.toggle = function(){
	setTimeout(function(){
		// Clear the hash
		history.pushState('', document.title, location.pathname)
	}, 12)

	getComputedStyle(this).display == "block"
		? this.hide()
		: this.show()
}

const CopyTextContent = function(id) {
	let $temp = new$("textarea")
	$temp.value = (typeof id == 'object' ? id.textContent : id)
	$temp.select();
	D.execCommand("copy")
	$('body').removeChild($temp)
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

/*
SP.toCapitalCase = function(){
	return this
	.r(/((^|\s)\w)/g, function(input){
		return input.toUpperCase()
	})
}
*/

let aTables = [] // contenedor de tablas

SP.toMarkdown = function(){
	SP.toLinkCase = function(){
		return this.toLowerCase()
		.r(/<(\/)?[\!\w\d\s\.,-="]+>/g, '')
		.rA('\x20', '-')
	}

	SP.parseHTML = function(){
		return this
		.rA('<br>', '\n')
		.rA('<', '&lt;')
		.rA('=""', '')
	}

	SP.rLinks = function(){
		const img   = exROOT + "img/",
			
			sa   = img+"sa/",
			sam  = img+"sa_mobile/",
			samp = img+"samp/",
			vc   = img+"vc/",
			gta3 = img+"gta3/",
			
			weapon = "weapon/",
			widget = "widget/",
			radar  = "radar/"
		
		return this
		.r(/^%sa-w\//m,   sa   + weapon)
		.r(/^%sam-w\//m,  sam  + widget)
		.r(/^%vc-w\//m,   vc   + weapon)
		.r(/^%sa-r\//m,   sa   + radar)
		.r(/^%vc-r\//m,   vc   + radar)
		.r(/^%gta3-r\//m, gta3 + radar)
		.r(/^%sa-t\//m,   sa   + "tatoo/")
		.r(/^%sa\//m,   sa  )
		.r(/^%vc\//m,   vc  )
		.r(/^%gta3\//m, gta3)
		.r(/^%e\//m, exROOT)
		.r(/^%g\//m, ROOT)
	}

	return this

	/******** LIST ********/

	// Import the value of vars
	.r(/{{ ([^\n]+) }}/g, input => {
		input = input.r(/{{ ([^\n]+) }}/, '$1')

		return new Function('return '+ input)()
	})
	// SCAPE CHAR
	.rA("\\n", "<br/>")
	.rA("\\s", "&nbsp;")
	.rA("\\\\", "&#x5C;")
	.r(/\\./g, function(input){
		return '&#' + input.r('\\').charCodeAt(0) + ';'
	})
	.r(/<\!--(.+)-->/g, '')

	// ID
	.r(/\[([^\[\]]+)\]\[\]/g, '<a id="$1"></a>')

	// DIVS
	//:::<class>[#<id>][ <styles>]
	//<body of element>
	//:::
	.r(/^:::([\w\d\x20\-_]+)(#([^\s#]+))?(\x20([^\n]+))?\n/gm, '<div id="$3" class="$1" style="$5">\n')
	.r(/^:::\n/gm, '</div>\n')

	// BLOCKQUOTES
	//> <body of element>
	.r(/^>\x20(.+)/gm, '<blockquote>\n$1</blockquote>')
	.r(/<\/blockquote>(\s+)<blockquote>/g, '<br>')

	// UL LI
	// * <body of element>
	//   * <body of element>
	//     * <body of element>
	.r(/^(\x20)?\*\s(.+)/gim, '<ul><li>$1$2</li></ul>')
	.r(/^(\x20)?\x20{2}\*\s(.+)/gim, '<ul><ul><li>$1$2</li></ul></ul>')
	.r(/^(\x20)?\x20{4}\*\s(.+)/gim, '<ul><ul><ul><li>$1$2</li></ul></ul></ul>')
	.r(/<\/ul>(\s+)<ul>/g, '')
	.rA('<\/ul><\/ul><ul><ul>', '')
	.rA('<\/ul><ul>', '')

	// OL LI
	// <any number>. <body of element>
	//   <any number>. <body of element>
	//     <any number>. <body of element>
	.r(/^(\x20)?\d\.\s(.+)/gim, '<ol><li>$1$2</li></ol>')
	.r(/^(\x20)?\x20{2}\d\.\s(.+)/gim, '<ol><ol><li>$1$2</li></ol></ol>')
	.r(/^(\x20)?\x20{4}\d\.\s(.+)/gim, '<ol><ol><ol><li>$1$2</li></ol></ol></ol>')

	.r(/<\/li><\/ol>\n<ul><ul><li>(.*)<\/ul><\/ul>/g, '<\/li><ul><li>$1</ul></ol>')

	.r(/<\/ol>(\s+)<ol>/g, '')
	.rA('<\/ol><\/ol><ol><ol>', '')
	.rA('<\/ol><ol>', '')

	// DL DD
	// - <body of element>
	//   - <body of element>
	//     - <body of element>
	.r(/^(\x20)?\-\x20\[\]\s(.+)/gim, "<dl><dd><input type='checkbox' disabled> $1$2</dd></dl>")
	.r(/^(\x20)?\-\x20\[x\]\s(.+)/gim, "<dl><dd><input type='checkbox' disabled checked> $1$2</dd></dl>")
	.r(/^(\x20)?\-\s(.+)/gim, '<dl><dd>$1$2</dd></dl>')
	.r(/^(\x20)?\x20{2}\-\s(.+)/gim, '<dl><dl><dd>$1$2</dd></dl></dl>')
	.r(/^(\x20)?\x20{4}\-\s(.+)/gim, '<dl><dl><dl><dd>$1$2</dd></dl></dl></dl>')
	.r(/<\/dl>(\s+)<dl>/g, '')
	.rA('<\/dl><\/dl><dl><dl>', '')
	.rA('<\/dl><dl>', '')

	// CHECKBOX
	// [] <body of element>
	// [x] <body of element>
	.r(/^(\x20|\t)?\[\]\x20(.+)/gm, "<div><input type='checkbox' disabled> $2</div>")
	.r(/^(\x20|\t)?\[x\]\x20(.+)/gim, "<div><input type='checkbox' disabled checked> $2</div>")

	/*** FORMAT ***/
	//***<bold and itatic>***
	//**<bold>**
	//*<itatic>*
	.r(/\*\*\*([^\*\n]+)\*\*\*/g, '<b><i>$1</i></b>')
	.r(/\*\*([^\*\n]+)\*\*/g, '<b>$1</b>')
	.r(/\*([^\*\n]+)\*/g, '<i>$1</i>')
	.r(/~~([^~\n]+)~~/g, '<s>$1</s>')
	.r(/~([^~\s]+)~/g, '<sub>$1</sub>')
	.r(/\^([^\^\s]+)\^/g, '<sup>$1</sup>')
	.r(/__([^_\n]+)__/g, '<u>$1</u>')
	.r(/\b_([^_\n]+)_\b/g, '<address>― $1</address>')
	.r(/==([^=\n\"\'\\\/]+)==/g, '<mark>$1</mark>')
	.r(/\+\+([^\+\n]+)\+\+/g, '<ins>$1</ins>')

	// EMOJIS
	.r(/([^\d\w\|]):([^:\s\|]+):([^\d\w\|])/g, function(input){
		const EMOJIS = {
			'clap': '👏',
			'wave' : '👋',
			'+1' : '👍',
			'thumbsup' : '👍',
			'-1' : '👎',
			'thumbsdown' : '👎',
			'smile' : '😄',
			'emoji' : '😄',
			'eyes' : '👀',
			'sunglasses' : '😎',
			'note' : '📝',
			'memo' : '📝',
			'warning' : '⚠',
			'bulb' : '💡',
			'tip' : '💡',
		}

		input = input.split(':')

		return input[0] + EMOJIS[input[1]] + input[2]
	})

	/*** TITLE ***/

	.r(/^(\w.+)\n==+=\n/gim, function(input){
		input = input.trim().r(/^(\w.+)\n==+=/gim, '$1')
		return '<h1 id="'+ input.toLinkCase() +'">' + input + '</h1>'
	})
	.r(/^(\w.+)\n--+-\n/gim, function(input){
		input = input.trim().r(/^(\w.+)\n--+-/gim, '$1')
		return '<h2 id="'+ input.toLinkCase() +'">' + input + '</h2>'
	})
	.r(/^#+\x20(.+)/gm, function(input){
		[
			input,
			header,
			text,
			customSection,
			classes,
			id
		] = input.match(/(#+)\x20([^\{\}\n]+)(\{([^#\{\}\n]+)?(#[^#\{\}\n]+)?\})?/)

		return '<h' + header.length + 
			' id="' + (id||text.trim().toLinkCase()).r('#') + 
			'" class="' + (classes||'') +
			'">' + text.trim() +
			'</h' + header.length + '>'
	})

	// VIDEO
	.r(/\!yt\[\]\(([^\s\[\]]+)\)/g, `<div class="video-responsive"><iframe src="https://www.youtube.com/embed/$1?rel=0" frameborder="0" allowfullscreen></iframe></div>`)

	// IMG
	.r(/\!\[([^\[\]]+)?\]\([^\(\)]+\)/g, function(input){
		input = input.match(
			/\!\[([^\[\]]+)?\]\(([^\(\)\s]+)(\x20"(([\w\d\x20\-_]+)(#[\w\d\-_]+)?)")?\)/
		)
		
		let comilla = '"',

			title   = input[1] ? ' title="' + input[1]          + comilla : "",
			src     = input[2] ? ' src="'   + input[2].rLinks() + comilla : "",
			classes = input[5] ? ' class="' + input[5]          + comilla : "",
			id      = input[6] ? ' id="'    + input[6]          + comilla : ""

		return '<img'+ id + src + title + classes +' loading="lazy">'

	})

	// A
	// Syntax:
	//        [text](url "title" 'class#id' `function onclick`)

	.r(/\[([^\[\]]+)\]\(([^\(\)\s]+)(\x20"[^"]+")?(\x20'[^']+')?(\x20`[^`]+`)?\)/g, function(input){
		input = input.match(/\[([^\[\]]+)\]\(([^\(\)\s]+)(\x20"[^"]+")?(\x20'[^']+')?(\x20`[^`]+`)?\)/)

		if(/^[.\/\w\d-]+(\\|\/)$/.test(input[2])){
			input[2] = input[2] + 'README.html'
		}

		let display = input[1],
			comilla = '"',

			href = ' href="' + input[2]
				.rLinks()
				.r('.md', '.html') + comilla,

			title   = ' title="'   + (input[3] ? input[3].r(/"/g, '') + comilla : comilla),
			classes = ' class="'   + (input[4] ? input[4].r(/#.+/, '').r(/'/g, '') + comilla : comilla),
			id      = ' id="'      + (input[4] ? input[4].r(/.+#/, '').r(/'/g, '') + comilla : comilla),
			func    = ' onclick="' + (input[5] ? input[5].r(/`/g, '').r(/"/g, '\'').r(/\(([^\(\)]+)?\)(\s+)?=>(\s+)?\{/g, 'function($1){') + comilla : comilla),

			target = function(){
				let set = ' target="'
				return /http/.test(href)
					? set + '_blank"'
					: set + '_self"'
			}()

		return "<a"+ id + title  + href + target + classes + func +">" + display + "</a>"
	})
	
	// HR
	.r(/^(--+-|\*\*+\*|__+_)$/gm, '<hr />')

	// BR
	.r(/([^\s])\x20\x20$/gm, '$1<br>')
	.r(/([^`])`\n\n`([^`])/g, "$1`<br><br>`$2")
	.r(/(\n^\.\n|(\.|:|\!|\)|b>|a>)\n\n([0-9\u0041-\u005A\u0061-\u007A\u00C0-\uFFFF]|¿|<b|<(ul|ol)?!|\*|`[^`]))/gm, '$2<br><br>$3')
	.r(/(\x20\x20\n|\\\n|\\n\w|(\.|:|\!|\)|b>|a>)\n([0-9\u0041-\u005A\u0061-\u007A\u00C0-\uFFFF]|¿|<b|<(ul|ol)?!|\*|`[^`]))/g, '$2<br>$3')

	// PRE
	//```<classes>[#<id>]
	//<body of element>
	//```
	.r(/(```([^`]*)```|~~~([^~]*)~~~)/g, function(input){
		if (/^`/m.test(input)){
			input = input.match(/```([^\n`#]+)?(#[^\s`#]+)?\n([^`]*)```/)
		}else{
			input = input.match(/~~~([^\n~#]+)?(#[^\s~#]+)?\n([^~]*)~~~/)
		}

		const eClass = input[1] || ''
		const eId = (input[2] || '').r('#', '')
		const eText = (input[3] || '').rA('<br>', '\n').rA('<,', '&#x3C;')

		return `<pre id='${eId}' class='${eClass}'>${eText}</pre>`
	})

	// CODE
	.r(/`([^\n`]+)`/g, function(input){
		input = input
		.rA('<,', '&#x3C;')
		.r(/`([^\n`]+)`/, '$1')
		.r(/<(\/?)i>/g, "*")
		.parseHTML()

		return '<code>' + input + '</code>'
	})
	
	// SPAN
	// [classes #id][content]
	.r(/\[([\w\d\s\-\+]+)?(#([^#\]]+))?\]\[([^\[\]]+)\]/gm, `<span class='$1' id='$3'>$4</span>`)

	// TABLE
	.r(/\|[\|\-\x20:]+\|/g, function(input){
		let aCol = [] // contenedor columnas

		if (input.r(/-+/, '-') != '|-|'){ // es la tabla no minificada

			input = input.split('|')
			input = input.splice(1, --input.length)

			input.forEach(function(a){
				if (/^:-+:/.test(a)) aCol.push('center')
				if (/^-+:/.test(a)) aCol.push('right')
				if (/^:-+/.test(a)) aCol.push('left')
				if (/^-+$/.test(a)) aCol.push('center')
			})

		}
		aTables.push(aCol)

		return "</thead><tbody>"

	})
	.r(/\|[^\n]+\|/g, function (input) {
		input = input.split('|')

		let newTable = ""

		input.forEach( function (element, count) {
			if (count == 0) newTable += "<tr>";
			if (count == input.length - 1) newTable += "</tr>";

			if (element !== "") newTable += "<td>" + element.trim() + "</td>";
		})

		return newTable
	})
	.r(/<(\/tr|tbody)>\n<(tr|\/thead)>/g, "<$1><$2>")
	.r(/^(<tr>(.+)<\/tr>)/gm, "<table><thead>$1</tbody></table>")
}

$('body').innerHTML = `
<div id="navbar">
	<h1><a href="${ROOT}index.html">MatiDragon</a><button id="CHANGE"><img src="${ROOT}files/img/dm-baseline.png" alt="🌓" style="user-select:none"></button></h1>
</div>
<div id='nav'>
	<section>
		<a href="${ROOT}index.html">Inicio</a>
		<!--<a href="${ROOT}docs.html">Docs</a>-->
		<a href="${ROOT}seeds.html">Seeds</a>
		<a href="${ROOT}topics.html">Temas</a>
		<a href="${ROOT}mods.html">Mods</a>
	</section>
	<!--<input id='search' type='text' placeholder='Buscar...'>-->
</div>
<div id="c"><div id="d"><textarea id="inputText" style="display:none;" disabled>${$('body').innerHTML}</textarea></div>
<div class="markdown">
	<div class="cont"></div>
	<hr>
	<footer id="credits">
		© 2017-${(new Date).getFullYear()} MatiDragon, All rights reserved with love.
	</footer>
</div></div><style id="STYLES"></style>`

let htmlGenerated = $('#inputText').value.toMarkdown()

$('.markdown .cont').innerHTML = htmlGenerated

$('thead', e => {
	e.innerHTML = e.innerHTML
	.r(/<td(\/)?>/g, '<th$1>')
})

CSS.Add(CSSComputarized)

$('body').style.display = 'block'
setTimeout(function(){$('#c').style.opacity = 1}, 12)

aTables.forEach(function(tabla, numTabla){
	if (tabla.length != 0){ 
		let $tablas = $("table")
		tabla.forEach(function(alineaminto, columna){
			if("" + $tablas == '[object NodeList]'){
				$("tr" ,$tablas[numTabla]).forEach(function(fila){
					fila.childNodes[columna].className = alineaminto
				})
			}
			else{
				$("tr").forEach(function(fila){
					fila.childNodes[columna].className = alineaminto
				})
			}
		})
	}
})

let hightlight = {
	sb3 : function(element){
		const span = {
			start : "<span class=",
			end : ">$1<\/span>"
		}

		const enter = {
			comments  : span.start + "comments"   + span.end,
			numbers   : span.start + "numbers"    + span.end,
			variables : span.start + "variables"  + span.end,
			opcodes   : span.start + "uppercase"  + span.end,
			directives: span.start + "directives" + span.end,
			commands  : span.start + "commands"   + span.end,
			classes   : span.start + "classes"    + span.end
		}

		element.innerHTML = element.innerHTML
		.rA('\t', '    ')
		.rA('&lt;br/&gt;', "\\n")
		//Comentarios 
		.r(/(\/\/[^\n]+)/gm, enter.comments)
		.r(/(\/\*[^\/]*\*\/)/gmi, enter.comments)
		.r(/(\{[^\$][^\{\}]*\})/gmi, enter.comments)
		//Directivas
		.r(/(\{\$[^{}\n]+\})/gmi, enter.directives)
		//Cadenas de texto
		.r(/\"([^\n"]+)\"/gmi, '<span class=strings>"$1"<\/span>')
		.rA('\\"</span>', '\\"')
		.rA('\\"<span>', '\\"')
		.r(/\'([^\n']+)\'/gmi, "<span class=strings>'$1'<\/span>")
		.rA("\\'</span>", "\\'")
		.rA("\\'<span>", "\\'")
		//Palabras Reservadas
		.r(/(\b)(longstring|shortstring|integer|thread|create_thread|create_custom_thread|end_thread|name_thread|end_thread_named|if|then|else|hex|end|else_jump|jump|jf|print|const|while|not|wait|repeat|until|break|continue|for|gosub|goto|var|array|of|and|or|to|downto|step|return|ret|rf|tr|Inc|Dec|Mul|Div|Alloc|Sqr|Random|int|string|float|bool|fade|DEFINE|nop)\b/gi, "$1<span class=keywords>$2<\/span>")
		//Etiquetas
		.r(/(^|\s+)(\@+\w+|\:+\w+)/gm, "$1<span class=labels>$2<\/span>")
		.r(/(^|\s+)([A-Za-z0-9_]+\(\))/gm, "$1<span class=commands>$2<\/span>")
		//Arreglos
		.r(/(\[)([\d+]*)(\])/gmi, "$1<span class=numbers>$2<\/span>$3")
		//Opcodes
		.r(/([a-fA-F0-9]{4}\:)/gmi, enter.opcodes)
		//Numeros
		.r(/\b(\d+(x|\.)\w+)\b/gmi, enter.numbers)
		.r(/\b(true|false)\b/gmi, enter.numbers)
		.r(/((\s|\-|\,)(?!\$)(\d+)(?!\:|\@)(i|f|s|v)?)\b/gmi, enter.numbers)
		//Modelos
		.r(/(\#[\w\d]+)/gm, "<span class='models uppercase'>$1<\/span>")
		//Clases
		.r(/\b([a-z0-9]+)\.([a-z0-9]+)/gmi, "<span class=classes>$1</span>.<span class=commands>$2</span>")
		.r(/(\w+)(\(.+\)\.)(\w+)/gmi, "<span class=classes>$1</span>$2<span class=commands>$3</span>")
		.r(/(\$\w+|\d+\@)\.([0-9A-Z_a-z]+)/gm, "$1.<span class=commands>$2</span>")
		.r(/: (\w+)\n/gm,          ": "+ enter.classes  +"\n")
		.r(/\.([0-9A-Z_a-z]+)\n/gm,"." + enter.commands +"\n")
		//Variables  
		.r(/\b(timer(a|b))\b/gmi, enter.variables)
		.r(/(\d+\@(s|v|\B)[^\w\d])/gm, enter.variables)
		.r(/(\&amp;\d+)/gim, enter.variables)
		.r(/((\x{00}|s|v)(\$[0-9A-Z_a-z]+))/gm, enter.variables)
		// Operadores
		//.r(/\s(\.|\=|\+|\-|\*|\/|\%|\=\=|\+\=|\-\=|\*\=|\/\=|\%\=|\+\+|\-\-|\<|\>|\<\=|\>\=)\s/gmi," <font class=operador>$1<\/font> ")
	},
	ini : function(element){
		element.innerHTML = element.innerHTML
		// comments
		.r(/((;|#).+)/g, "<span class=comments>$1<\/span>")
		// numbers
		.r(/^(\w+)=(\d+([\.\d]+)?)/gm, "<span class=variables>$1<\/span>=<span class=numbers>$2<\/span>")
		// variable
		.r(/^(\w+)=(\w.+)/gm, "<span class=variables>$1<\/span>=<span class=strings>$2<\/span>")
		.r(/\[(\w+)\]/gm, "[<span class=keywords>$1<\/span>]")
	},
}

$('.sb3',e=>hightlight.sb3(e))

$('.ini',e=>hightlight.ini(e))

$("#CHANGE").onclick = function(){
	const $THIS_ELEMENT = this
	function IMAGE(X){
		$("img", $THIS_ELEMENT).setAttribute("src", ROOT +'files/img/dm-'+ X +'line.png')
	} 

	ModeLight()
		? IMAGE('out')
		: IMAGE('base')
}

function buscador(palabras, base_de_datos, orden_A_Z = false){
    palabras = palabras.split(' ')

    if (typeof base_de_datos == 'string') {
    	base_de_datos = base_de_datos.split('\n')
    }

    base_de_datos = base_de_datos.filter(elemento => {
        return palabras.every(palabra => elemento.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(palabra.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
    })


    if (orden_A_Z == true){
        base_de_datos = base_de_datos.sort((a, b) => {
          if (isNaN(a) || isNaN(b)) {
            return a.localeCompare(b);
          } else {
            return a - b;
          }
        });   
    }

    return base_de_datos
}

function paginarResultados(base_de_datos, paginaActual = 1, resultadosPorPagina = 12){
    const indicePrimerResultado = (paginaActual - 1) * resultadosPorPagina
    const indiceUltimoResultado = (paginaActual * resultadosPorPagina) - 1

    const resultadosPaginados = base_de_datos.slice(indicePrimerResultado, indiceUltimoResultado + 1)

    const numPaginas = Math.ceil(base_de_datos.length / resultadosPorPagina)

    return {
        resultados: resultadosPaginados,
        numPaginas: numPaginas,
        paginaActual: paginaActual
    }   
}