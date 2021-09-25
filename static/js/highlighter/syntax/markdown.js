function markdown () {
	for (let i = 0;i < class$("markdown").length;i++){ 
		let element = class$("markdown")[i];
		element.innerHTML = element.innerHTML
			/*** CITES ***/
//			.replace(/^(>)!?(\s[\w\d].+)\n/gim, '<blockquote>$2</blockquote>')
//			.replace('</blockquote><blockquote>', '<br>')
			/*** TITLES ***/
			.replace(/^######\s([\x20-\x22\x24-\xFF].+)/gim, '<h6 id="$1">$1</h6>')
			.replace(/^#####\s([\x20-\x22\x24-\xFF].+)/gim, '<h5 id="$1">$1</h5>')
			.replace(/^####\s([\x20-\x22\x24-\xFF].+)/gim, '<h4 id="$1">$1</h4>')
			.replace(/^###\s([\x20-\x22\x24-\xFF].+)/gim, '<h3 id="$1">$1</h3>')
			.replace(/^##\s([\x20-\x22\x24-\xFF].+)/gim, '<h2 id="$1">$1</h2>')
			.replace(/^#\s([\x20-\x22\x24-\xFF].+)/gim, '<h1 id="$1">$1</h1>')
			/*** FORMATS ***/
			.replace(/\*\*\*([\x20-\x29\x2B-\xFF]+)\*\*\*/gim, '<b><i>$1</i></b>')
			.replace(/\*\*([\x20-\x29\x2B-\xFF]+)\*\*/gim, '<b>$1</b>')
			.replace(/\*([\x20-\x29\x2B-\xFF]+)\*/gim, '<i>$1</i>')
			/*** CODES ***/
//			.replace(/```(sb3|ini|fxt|csm)?([\x09-\x5F\x61-\xFF]*)```/, '<pre class="$1">$2</pre>')
//			.replace(/`(sb3|ini|fxt|csm)?([\x09-\x5F\x61-\xFF]*)`/, '<code class="$1">$2</code>')
		;
	}
}
export default markdown();