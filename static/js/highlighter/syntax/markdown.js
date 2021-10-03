function markdown () {
	for (let i = 0;i < $(".markdown").length;i++){ 
		let element = $(".markdown")[i];
		element.innerHTML = element.innerHTML
			/*** CITE ***/
			.replace(/^\|([A-Za-z]+(-\d+)?)\s(.+)/gim, '<blockquote class="$1">$2</blockquote>')
			.replace(/^\|\s(.+)/gim, '<blockquote>$1</blockquote>')
			.replace('</blockquote><blockquote>', '<br>')
			/*** TITLE ***/
			.replace(/^######\s([\x20-\x22\x24-\xFF].+)/gm, '<h6 id="$1">$1</h6>')
			.replace(/^#####\s([\x20-\x22\x24-\xFF].+)/gm, '<h5 id="$1">$1</h5>')
			.replace(/^####\s([\x20-\x22\x24-\xFF].+)/gm, '<h4 id="$1">$1</h4>')
			.replace(/^###\s([\x20-\x22\x24-\xFF].+)/gm, '<h3 id="$1">$1</h3>')
			.replace(/^##\s([\x20-\x22\x24-\xFF].+)/gm, '<h2 id="$1">$1</h2>')
			.replace(/^#\s([\x20-\x22\x24-\xFF].+)/gm, '<h1 id="$1">$1</h1>')
			.replace(/^(---|=)\n/gm, '<hr>\n')
			.replace(/^\.\n/gm, '</p><p>')
			/*** LIST ***/
			.replace(/^\*\s(.+)/gim, '<ul><li>$1</li></ul>')
			.replace('</ul><ul>', '')
			/*** FORMAT ***/
			.replace(/\*\*\*([\x20-\x29\x2B-\xFF]+)\*\*\*/g, '<b><i>$1</i></b>')
			.replace(/\*\*([\x20-\x29\x2B-\xFF]+)\*\*/g, '<b>$1</b>')
			.replace(/\*([\x20-\x29\x2B-\xFF]+)\*/g, '<i>$1</i>')
			/*** ATTACH ***/
			.replace(/\!\[([\w\s\d]+)\]\(([\w\d\/\.\\\-]+)(\s"[\w\d\s].+")?\)/g, '<img src="$2" alt="$1" title="$3" loading="lazy">')
			.replace(/\[([<\w\d\s="/\-\.%>]+)\]\(([\w\d\/\.\\-]+)(\s"[\w\d\s].+")?\)/g, '<a href="$2" title="$3">$1</a>')
			/*** CODE ***/
			.replace(/```(sb3|ini|fxt|csm|\s)!?\s([\x09-\x5F\x61-\xFF]*)```/g, '<pre class="$1">$2</pre>')
			.replace(/`([\x09-\x5F\x61-\xFF]+)`/, '<code>$2</code>')
		;
	}
}
export default markdown();