const DATA = [
 {
 "id": "3",
 "img": "code.webp",
 "title": "Editando el main.scm - EP1; flujos y opcodes 3/3",
 "data": "En este tutorial continuaremos explorando los hilos. Esta vez conoceremos los comandos gosub y return",
   "tag": [
		"tutorial",
		"main.scm"
	]
 },
 {
  "id": "2",
  "img": "code.webp",
  "title": "Editando el main.scm - EP1; flujos y opcodes 2/3",
  "data": "En este tutorial continuaremos explorando los hilos. La lección está dedicada al lanzamiento de varios hilos y describe las reglas para los flujos entre ellos.",
   "tag": [
		"tutorial",
		"main.scm"
	]
 },
 {
  "id": "1",
  "img": "code.webp",
  "title": "Editando el main.scm - EP1; flujos y opcodes 1/3",
  "data": `En este tutorial, repasaremos los conceptos básicos de la creación de scripts: hilos, comandos, etiquetas, saltos y latencia. Tambien se introducirá el concepto de los opcodes.`,
  "tag": [
		"tutorial",
		"main.scm"
	]
 }
]

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
</article>
	`
}