const origen = window.location.origin + "/page/";

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
	<meta name="msapplication-TileImage" content="${origen}static/images/144x144.png">
	<link rel="apple-touch-icon-precomposed" href="${origen}static/images/152x152.png">
	<link rel="icon" href="${origen}static/images/32x32.png" sizes="32x32">
	<link rel="icon" href="${origen}static/images/48x48.png" sizes="48x48" >
	<link rel="icon" href="${origen}static/images/96x96.png" sizes="96x96" >
	<link rel="icon" href="${origen}static/images/144x144.png" sizes="144x144" >
	<link rel="shortcut icon" href="${origen}static/images/favicon.ico" type="image/x-icon" >
	<!-- CSS-->
	<link href="${origen}static/css/materialize.css" type="text/css" rel="stylesheet" media="screen,projection,print">
	<link rel="manifest" href="${origen}/manifest.json">
`)