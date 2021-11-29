document.write(`
	<nav>
		<div class="nav-wrapper">
			<a id="logo-container" href="${dir.local()}index.html" class="h2 black-text p-3">MatiDragon</a>
			<ul class="right"><b>
				<li><a href="${dir.local()}index.html">Inicio</a></li>
				<li><a href="${dir.local()}articles.html">Articulos</a></li>
				<li><a href="${dir.local()}builds.html">Construcciones</a></li>
			</b></ul>
			<!--
			<ul id="nav-mobile" class="sidenav">
				<li><a href="${dir.local()}index.html"><icon>home</icon>Inicio</a></li>
				<li><a href="${dir.local()}articles.html"><icon>articles</icon>Articulos</a></li>
				<li><a href="${dir.local()}builds.html"><icon>build</icon>Construcciones</a></li>
			</ul>
			<a href="#" data-target="nav-mobile" class="top-nav sidenav-trigger circle d-lg-none"><icon class=black-text>menu</icon></a>
			-->
		</div>
	</nav>
`)