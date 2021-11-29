import DATA from "./../../db/builds.js";

let build = document.querySelector('#contenido');
build.innerHTML = '';

for (let item of DATA){
 build.innerHTML += `
<article class="col-12">
  <div class="card horizontal bg-dark">
    <div class="card-image">
      <img loading="lazy" src="${dir.imagen()}builds/${item.id}.webp" style="height:100%;max-width: 230px;" alt="${item.title}">
    </div>
    <div class="card-stacked">
      <div class="card-content">
        <h5>${item.title}</h5>
        <p>${item.description}...</p>
      </div>
      <div class="card-action">
        <small class="light left">Etiqueta: ${item.type.join(' ')}</small><a class="btn green right b-0" href="${dir.local()}builds/${item.id}.html">Ver más</a>
      </div>
    </div>
  </div>
</article>
`
}