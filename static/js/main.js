let dir = {
	origen : () => window.location.origin,
	local : () => dir.origen() == 'https://matidragon-yt.github.io' ? dir.origen()+'/page/' : dir.origen()+'/',
	imagen : () => dir.local() + 'static/images/'
}

let doc = {
	hash : () => new URL(document.URL).hash,
	header : () => document.title.split(" - "),
	title : () => doc.header()[0],
	subtitle : () => doc.header()[1],
	description : () => document.querySelector("meta[name='description']").getAttribute("content") || "MatiDragon"
}

console.log(doc.title())

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

