/** 
# RULES
=
| They should all start with a capital letter, except for the objects.
| The constants of a value or enumeration must be in uppercase.
| Only objects must end with a semicolon at the end of the braces.
| Exceeding 90 characters per line is not allowed, except for templates.
| Always leave spaces between the operators and their values.
*/

let $ = Element => Element[0] != '#' || /\s/g.test(Element)
		? document.querySelectorAll(Element)
		: document.querySelector(Element)
	_ = Message => console.log(Message);

let dir = {
	local : () =>
		origin == 'https://matidragon-yt.github.io'
			? origin + '/page/'
			: origin + '/'
	,
	imagen : () => dir.local() + 'static/images/',
	hash : {
		current : () => window.location.hash,
		clear : () => {
			history.pushState('', document.title, window.location.pathname)
		}
	}
}

let doc = {
	header : () => document.title.split(" - "),
	title : () => doc.header()[0],
	subtitle : () => doc.header()[1],
	description : () => {
		let Element = $("meta[name='description']")[0]
		return Element != null
			? Element.getAttribute("content")
			: "MatiDragon"
	},
	displayId: (id, mode) => $('#'+id).style.display = mode,
	pre : {
		hide : area => {
			doc.displayId(area,'none');
			dir.hash.clear();
		},
		show : area => {
			let Background = 'green',
				Element = event.currentTarget.classList;
			if (Element.contains(Background)) {
				Element.remove(Background);
				doc.pre.hide(area);
			}else{
				let Count = 0,
					Show = $(".tabArea"),
					Length = Show.length,
					TabLinks = $(".tab");
				for (Count; Count < Length; Count++) {
					Show[Count].style.display = "none";
					TabLinks[Count].classList.remove(Background);
				}
				doc.displayId(area,'block');
				Element.add(Background);
			}
		},
		insert : (ident, areaA, areaB) => {
			document.write(`
			<div class="row">
				<div class="col-12"><ul class="tabs">
					<li class="tab codigo" onclick="doc.pre.show('scm${ident}')"><a href="#!scm${ident}">SCMTOOL</a></li>
					<li class="tab codigo" onclick="doc.pre.show('opc${ident}')"><a href="#!opc${ident}">OPCODES</a></li>
					<li class="tab disabled right pt-2"><a><icon>code</icon></a></li>
				</ul></div>
				<div id="scm${ident}" class="col-12 tabArea w3-animate-left">
					<preHide><icon onclick="doc.pre.hide('scm${ident}')">close</icon></preHide>\`\`\`sb3\n${areaA}\`\`\`
				</div>
				<div id="opc${ident}" class="col-12 tabArea w3-animate-right">
					<preHide><icon onclick="doc.pre.hide('opc${ident}')">close</icon></preHide>\`\`\`sb3\n${areaB}\`\`\`
				</div>
			</div>
			`)
		}
	}
}

document.write(`
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
	<!-- Favicons-->
	<meta name="msapplication-TileColor" content="green">
	<meta name="msapplication-TileImage" content="${dir.imagen()}icon/144x144.png">
	<link rel="apple-touch-icon-precomposed" href="${dir.imagen()}icon/152x152.png">
	<link rel="icon" href="${dir.imagen()}icon/32x32.png" sizes="32x32">
	<link rel="icon" href="${dir.imagen()}icon/48x48.png" sizes="48x48">
	<link rel="icon" href="${dir.imagen()}icon/96x96.png" sizes="96x96">
	<link rel="icon" href="${dir.imagen()}icon/144x144.png" sizes="144x144">
	<link rel="shortcut icon" href="${dir.imagen()}icon/favicon.ico" type="image/x-icon">
	<!-- CSS-->
	<link href="${dir.local()}static/css/main.css" type="text/css" rel="stylesheet" media="screen,projection,print">
	<link rel="manifest" href="${dir.local()}manifest.json">
`)