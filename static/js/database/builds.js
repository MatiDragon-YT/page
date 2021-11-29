import DATA from "./../../db/builds.js";

let build = document.querySelector('#contenido');
build.innerHTML = '';

for (let item of DATA){
 build.innerHTML += `
  <article>
      <picture>
        <img loading="lazy" src="${dir.imagen()}builds/${item.id}.webp" alt="${item.title}">
      </picture>
      <main>
        <header>
          <h5>${item.title}</h5>
          <p>${item.description}...</p>
        </header>
        <footer>
          <small>${item.type.join(' ')}</small><a href="${dir.local()}builds/${item.id}.html">Ver más</a>
        </footer>
      </main>
  </article>
`
}