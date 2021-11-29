if (dir.hash.current()) {
	$(`[href="${dir.hash.current()}"`).click()
}
let mk = $("markdown") || null;
if (mk != null) {
	mk.innerHTML = mk.innerHTML
	/*** SPECIAL ***/
	.replace('{{title}}', doc.title())
	.replace('{{subtitle}}', doc.subtitle())
	.replace('{{description}}', doc.description())
	/*** CITE ***/
	.replace(/^\|([A-Za-z]+(-(\d|\w)+)?)\s(.+)/gim, '<blockquote class="$1">$4</blockquote>')
	.replace(/^\|\s(.+)/gim, '<blockquote>$1</blockquote>')
	.replace(/<\/blockquote>(\s+)<blockquote>/g, '<br>')
	/*** TITLE ***/
	.replace(/^######\s([\x20-\x22\x24-\xFF].+)/gm, '<h6 id="$1">$1</h6>')
	.replace(/^#####\s([\x20-\x22\x24-\xFF].+)/gm, '<h5 id="$1">$1</h5>')
	.replace(/^####\s([\x20-\x22\x24-\xFF].+)/gm, '<h4 id="$1">$1</h4>')
	.replace(/^###\s([\x20-\x22\x24-\xFF].+)/gm, '<h3 id="$1">$1</h3>')
	.replace(/^##\s([\x20-\x22\x24-\xFF].+)/gm, '<h2 id="$1">$1</h2>')
	.replace(/^#\s([\x20-\x22\x24-\xFF].+)/gm, '<h1 id="$1">$1</h1>')
	.replace(/^(---|=)\n/gm, '<hr>\n')
	.replace(/^\.([A-Za-z]+(-(\d|\w)+)?)\s(.+)/gim, '<p class="$1">$4</p>')
	.replace(/^\.\n/gm, '</p><p>')
	/*** LIST ***/
	.replace(/^\*\s(.+)/gim, '<ul><li>$1</li></ul>')
	.replace(/^_\s(.+)/gim, '<ol><li>$1</li></ol>')
	.replace(/^\-\s(.+)/gim, '<dl><dd>$1</dd></dl>')
	.replace(/<\/ul>(\s+)<ul>/g, '')
	.replace(/<\/ol>(\s+)<ol>/g, '')
	.replace(/<\/dl>(\s+)<dl>/g, '')
	/*** FORMAT ***/
	.replace(/\*\*\*([\x20-\x29\x2B-\xFF]+)\*\*\*/g, '<b><i>$1</i></b>')
	.replace(/\*\*([\x20-\x29\x2B-\xFF]+)\*\*/g, '<b>$1</b>')
	.replace(/\*([\x20-\x29\x2B-\xFF]+)\*/g, '<i>$1</i>')
	/*** ATTACH ***/
	.replace(/\!\[([\w\s\d]+)\]\(([\w\d\?\=\/\\\.\-:]+)(\s"[\w\d\s].+")?\)/g, '<img src="$2" alt="$1" title="$3" loading="lazy">')
	.replace(/\[([<\w\d\s="/\-\.%>]+)\]\(([\w\d\?\=\/\\\.\-:]+)(\s"[\w\d\s].+")?\)/g, '<a href="$2" title="$3">$1</a>')
	/*** CODE ***/
	.replace(/```(sb3|ini|fxt|csm|txt|\s)!?\s([\x09-\x5F\x61-\xFF]*)```/g, '<pre class="$1">$2</pre>')
	.replace(/`([\x09-\x5F\x61-\xFF]+)`/g, '<code>$1</code>')
}

document.write(`
	<footer class="page-footer docs-footer">
		<div class="container-fluid">
			<div class="row">
				<div class="col-12 col-md-6 col-lg-6 col-xl-8">
					<h4>Que es este lugar?</h4>
					<p>Actualmente es un sitio para compartir mis herramientas y modificaciones para la saga de Grand Theft Auto 3D.<br>Deseando mayor entretenimiento y diverción a todos los fans.</p>
				</div>
				<div class="col-6 col-sm-6 col-md-3 col-lg-3 col-xl-2">
					<h5>Direcciones</h5>
					<a href="https://gtainside.com/user/MatiDragon" target="_black">GTAinside</a><br>
					<a href="https://github.com/MatiDragon-YT" target="_black">GitHub</a><br>
					<a href="https://youtube.com/c/MatiDragon" target="_black">YouTube</a><br>
				</div>
				<div class="col-6 col-sm-6 col-md-3 col-lg-3 col-xl-2">
					<h5>Frameworks</h5>
					<a href="https://getbootstrap.com" target="_black" title="CSS">Bootstrap 5</a><br>
					<a href="https://materializecss.com/" target="_black" title="CSS">Materialize CSS</a>
				</div>
			</div>
			<div class="divider"></div>
			<div class="footer-copyright">
				<div class="container-fluid center">
					<p><span class="float-md-left">© 2017-${(new Date).getFullYear()} MatiDragon, All rights reserved with love.</span>
					<a href="${dir.local()}LICENSE" class="grey-text float-md-right">CC0-1.0 License</a></p>
				</div>
			</div>
		<div class="p-1"></div>
		<div class="divider"></div>
	</footer>
`)