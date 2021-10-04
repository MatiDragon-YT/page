import DATA from "./../../db/articles.js";

let build = document.querySelector('#contenido');
build.innerHTML = '';

for (let item of DATA){
 build.innerHTML += `
<article class="col-12 ${item.tag.join(' ')}">
	<div class="card horizontal bg-dark">
		<div class="card-image waves-effect waves-block waves-light">
			<img loading="lazy" src="./articles/img/${item.img}" style="height:100%" alt="${item.title}">
		</div>
		<div class="card-stacked">
			<div class="card-content">
				<h5>${item.title}</h5>
				<p>${item.data}...</p>
			</div>
			<div class="card-action">
				<small class="light left">Etiqueta: ${item.tag.join(' ')}</small><a class="btn bg-dark right b-0" href="./articles/${item.id}.html">Ver más</a>
			</div>
		</div>
	</div>
</article>`
}