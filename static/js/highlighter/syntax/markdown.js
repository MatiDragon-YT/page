function markdown () {
	for (let i = 0;i < class$("markdown").length;i++){ 
		let element = class$("markdown")[i];
		element.innerHTML = element.innerHTML
			/*** CITES ***/
			.replace(/\n\|\s([\w\W]).+/gim, '<blockquote>$1</blockquote>')
			.replace('</blockquote><blockquote>', '<br>')
			/*** TITLES ***/
			.replace(/^######\s([\x20-\x22\x24-\xFF].+)/gm, '<h6 id="$1">$1</h6>')
			.replace(/^#####\s([\x20-\x22\x24-\xFF].+)/gm, '<h5 id="$1">$1</h5>')
			.replace(/^####\s([\x20-\x22\x24-\xFF].+)/gm, '<h4 id="$1">$1</h4>')
			.replace(/^###\s([\x20-\x22\x24-\xFF].+)/gm, '<h3 id="$1">$1</h3>')
			.replace(/^##\s([\x20-\x22\x24-\xFF].+)/gm, '<h2 id="$1">$1</h2>')
			.replace(/^#\s([\x20-\x22\x24-\xFF].+)/gm, '<h1 id="$1">$1</h1>')
			/*** FORMATS ***/
			.replace(/\*\*\*([\x20-\x29\x2B-\xFF]+)\*\*\*/g, '<b><i>$1</i></b>')
			.replace(/\*\*([\x20-\x29\x2B-\xFF]+)\*\*/g, '<b>$1</b>')
			.replace(/\*([\x20-\x29\x2B-\xFF]+)\*/g, '<i>$1</i>')
			.replace(/^\./gm, '</p><p>')
			/*** CODES ***/
			.replace(/```(sb3|ini|fxt|csm|\s)!?\s([\x09-\x5F\x61-\xFF]*)```/g, '<pre class="$1">$2</pre>')
//			.replace(/`(sb3|ini|fxt|csm)?\s([\x09-\x5F\x61-\xFF]*)`/, '<code class="$1">$2</code>')
			.replace(/\[([\x21-\xFF]+)\]\((http|https):\/\/([A-Za-z0-9\+\/\=\.]+)\)/g, '<a href="$2://$3">$1</a>')
// asd  [Discord](https://discord.gg/GBkEqSE2jY) sad [Discord](https://discord.gg/GBkEqSE2jY)
		;
	}
}
export default markdown();