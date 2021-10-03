const $ = a => document.querySelectorAll(a);

let dir = {
	local : () => origin == 'https://matidragon-yt.github.io' ? origin+'/page/' : origin+'/',
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
		let d = $("meta[name='description']")[0]
		return (d != null)
			? d.getAttribute("content")
			: "MatiDragon"
	},
	pre : {
		hide : area => {
			document.getElementById(area).style.display='none';
			dir.hash.clear();
		},
		show : area => {
			let bgColor = 'green'
			if (event.currentTarget.classList.contains(bgColor)) {
				event.currentTarget.classList.remove(bgColor);
				doc.pre.hide(area)
			}
			else{
				let i,
					d = document.getElementsByClassName("tabArea"),
					l = d.length,
					tablinks = document.getElementsByClassName("tab")
				;
				for (i = 0; i < l; i++) {
					d[i].style.display = "none";
					tablinks[i].classList.remove(bgColor);
				}
				document.getElementById(area).style.display = "block";
				event.currentTarget.classList.add(bgColor);
			}
		},
		insert : (ident, areaA, areaB) => {
			document.write(`
			<div class="row">
				<div class="col-12"><ul class="tabs">
				<li class="tab codigo" onclick="doc.pre.show('scm${ident}')"><a href="#!scm${ident}">SCMTOOL</a></li>
				<li class="tab codigo" onclick="doc.pre.show('opc${ident}')"><a href="#!opc${ident}">OPCODES</a></li>
				<li class="tab disabled right pt-2"><a><icon>code</icon></a></li></ul>
			</div>
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
	<meta name="theme-color" content="#FFFFFF">
	<meta name="msapplication-TileColor" content="#FFFFFF">
	<meta name="MobileOptimized" content="width">
	<meta name="HandheldFriendly" content="true">
	<meta name="apple-mobile-web-app-capable" content="true">
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
	<!-- Favicons-->
	<meta name="msapplication-TileColor" content="#FFFFFF">
	<meta name="msapplication-TileImage" content="${dir.imagen()}icon/144x144.png">
	<link rel="apple-touch-icon-precomposed" href="${dir.imagen()}icon/152x152.png">
	<link rel="icon" href="${dir.imagen()}icon/32x32.png" sizes="32x32">
	<link rel="icon" href="${dir.imagen()}icon/48x48.png" sizes="48x48" >
	<link rel="icon" href="${dir.imagen()}icon/96x96.png" sizes="96x96" >
	<link rel="icon" href="${dir.imagen()}icon/144x144.png" sizes="144x144" >
	<link rel="shortcut icon" href="${dir.imagen()}icon/favicon.ico" type="image/x-icon" >
	<!-- CSS-->
	<link href="${dir.local()}static/css/main.css" type="text/css" rel="stylesheet" media="screen,projection,print">
	<link rel="manifest" href="${dir.local()}manifest.json">
`)