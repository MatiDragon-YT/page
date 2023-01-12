import { $ } from './dom.js'
export const sanny = (ELEMENT = $('#showed li[style=""] pre')) => {
	ELEMENT.forEach(SELECT => highlighter(SELECT))
}
export const highlighter = SELECT =>{
	SELECT.innerHTML =
	SELECT.innerHTML
	/*** COMMENTS ***/
	.replace(/(\/\/.+)/gm, `<hlC>$1</hlC>`)
	.replace(/(\/\*[\x09-.0-■]*\*\/)/gmi, `<hlC>$1</hlC>`)
	.replace(/(\{[\x09-z\|~-■]*\})/gmi, `<hlC>$1</hlC>`)
	/*** STRINGS ***/
	.replace(/\"([\x09-\!#-■]*)\"/gmi, `<hlS>\"$1\"<\/hlS>`)
	.replace(/\'([!-&(-■]+)\'/gmi, `<hlS>\'$1\'<\/hlS>`)
	/*** LABELS ***/
	.replace(/(\s+\@+\w+|\:+\w+)/gm, `<hlL>$1<\/hlL>`)
	/*** ARRAYS ***/
	.replace(/(\[)([\d+]*)(\])/gmi, `$1<hlN>$2<\/hlN>$3`)
	/*** OPCODES ***/
	.replace(/^(\s*)([a-fA-F0-9]{4}\:)/gmi, `$1<hlF>$2<\/hlF>`)
	/*** HEXALES ***/
	.replace(/\b(\d+)(x|\.)(\w+)\b/gmi, `<hlN>$1$2$3<\/hlN>`)
	/*** BOOLEANS ***/
	.replace(/\b(true|false)\b/gmi, `<hlN>$1<\/hlN>`)
	/*** NUMBERS ***/
	.replace(/(\s|\-|\,|\()(?!\$)(\d+)(?!\:|\@)(i|f|s|v)?\b/gmi, `$1<hlN>$2$3<\/hlN>`)
	/*** MODELS ***/
	.replace(/(\#+\w+)/gm, `<hlN>$1<\/hlN>`)
	/*** VARIABLES ***/
	.replace(/(\d+)(\@s|\@v|\@)(\:|\s|\n|\]|\.|\,||\))/gm, `<hlV>$1$2<\/hlV>$3`)
	.replace(/(\&amp\d+)/gim, `<hlV>$1<\/hlV>`)
	.replace(/(s|v)?(\$[0-9A-Z_a-z]+)/gm, `<hlG>$1$2<\/hlG>`)
	/*** OPERADORS ***/
	.replace(/\B(\+|\-|\*|\/|\^|\%|\||\&lt;|\&gt;|\&lt;\&lt;|\&gt;\&gt;|=)?(\+|\-|=|~|\*|\&lt;|\&gt;)\B/gmi,"<hlO>$1$2<\/hlO>")
}