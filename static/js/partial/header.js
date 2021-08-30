document.write(`
	<nav>
		<div class="nav-wrapper">
			<a id="logo-container" href="${origen}index.html" class="brand-logo pl-md-3">MatiDragon</a>
			<ul class="right hide-on-med-and-down"><b>
				<li><a href="${origen}index.html">Inicio</a></li>
				<li><a href="${origen}articles.html">Articulos</a></li>
				<li><a href="${origen}builds.html">Construcciones</a></li>
			</b></ul>
			<ul id="nav-mobile" class="sidenav">
				<li><a href="${origen}index.html"><i class="material-icons">home</i>Inicio</a></li>
				<li><a href="${origen}articles.html"><i class="material-icons">articles</i>Articulos</a></li>
				<li><a href="${origen}builds.html"><i class="material-icons">build</i>Construcciones</a></li>
			</ul>
			<a href="#" data-target="nav-mobile" class="top-nav sidenav-trigger waves-effect waves-light circle hide-on-large-only"><i class="material-icons black-text">menu</i></a>
		</div>
	</nav>
`)