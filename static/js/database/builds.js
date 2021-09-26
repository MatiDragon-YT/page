const DATA = [
 {
  "id": "g",
  "title": "Resalta codigo",
  "description": "Extención unica para Sublime Text 3 y 4 que nos permitira resaltar codigo de Sanny Builder 3.8, compatible con la mayoria por no decir que todos los temas",
  "type": [
    "sa",
    "tool",
    "developer"
  ]
 },
 {
  "id": "f",
  "title": "Teletransporte",
  "description": "Teletransportese a cualquier parte del mapa con este simple cleo script.",
  "type": [
    "sa",
    "cleo",
    "mod"
  ]
 },
 {
  "id": "e",
  "title": "Car Controller",
  "description": "Como Zeti's Car Control pero con algo más de control, y creado con sintaxis de alto nivel, para que cualquiera pueda ver su código sin marearse.",
  "type": [
    "sa",
    "cleo",
    "mod"
  ]
 },
 {
  "id": "d",
  "title": "SCMTool",
  "description": `Este es un pequeño paquete que recopila mis modificasiones para SB3, agregando 1 documentación en españos con un 50% más de información, junto con más de 1000 clases, constantes, plantillas y de más cosas.`,
  "type": [
    "sa",
    "tool",
    "developer"
  ]
 },
 {
  "id": "c",
  "title": "Doc. Moderna",
  "description": "Tal y como lo dice en el titulo, esta es una documentacion, un libro virtual con el unico propocito de proporcionar la mayor informacion de SB3.",
  "type": [
    "sa",
    "tool",
    "developer"
  ]
 },
 {
  "id": "b",
  "title": "FPS para Parodias",
  "description": `A diferencia de su hermana "FPS de Reserva", este activa el modo cinematico junto con la eliminacion de todos los peds, vehiculos y disturvios, capaz de pasar 13FPS hasta unos 24FPS estables.`,
  "type": [
    "sa",
    "cleo",
    "mod"
  ]
 },
 {
  "id": "a",
  "title": "Sultan con Rampa",
  "description": `Inspirado en Rapido y Furioso 6. Este mod nos permitira aparecer un Sultan con una Rampa delantera que nos permitira sacar a volar por los cielos a todas las cosas que se muevan.`,
  "type": [
    "sa",
    "cleo",
    "mod"
  ]
 },
 {
  "id": "9",
  "title": "Ponerse Casco",
  "description": `Inspirado en GTA5. Al subirse a una moto/bici, un casco aparece en la mano del jugador, y procede a hacer la animacion de que se coloca, para finalmente quedar en la cabeza de nuestro jugador.`,
  "type": [
    "sa",
    "cleo",
    "mod"
  ]
 },
 {
  "id": "8",
  "title": "Normal Parallax",
  "description": `Este aunque trabaja en ENB-Series, añade unos efectos graficos, que no muchos trae, esto debido a la vercion que utiliza para renderizar, que agrega Bump-Maps y agua azul marina cristalina.`,
  "type": [
    "sa",
    "shader",
    "dx9"
  ]
 },
 {
  "id": "7",
  "title": "Opty RenderHook",
  "description": `Se trata del mismo mod, pero optimizado en un solo paquete para una instalacion rapida y fuera de problemas. Ademas esta version consume un -50% de consumo de nuestro equipo.`,
  "type": [
    "sa",
    "shader",
    "dx11"
  ],
  "author": "RenderHook (por PetkaGTA)"
 },
 {
  "id": "6",
  "title": "Armas Mejoradas",
  "description": `Inspirado en Far Cry 3. Este mod se encarga de generar unas llaradas en la parte trasera de los lanza misiles junto con un retroceso en la camara. Tambien le da unos pequeños efectos a la Sniper y a la Camara.`,
  "type": [
    "sa",
    "cleo",
    "mod"
  ]
 },
 {
  "id": "5",
  "title": "1 Segundo",
  "description": `Este es un simple Hack para tener tu lista de armas favoritas en un solo click. Este mod es obviamente configurable desde un archivo *.ini por si deseas cambiar alguna arma.`,
  "type": [
    "sa",
    "cleo",
    "mod"
  ]
 },
 {
  "id": "4",
  "title": "Carrera Desertica",
  "description": `Se trata de un mod que agrega una mision de carrera, asi es, escuchaste muy bien, y no te preocupes por el DIOM, ya que no es nesesario tenerlo para poder probar este mod.`,
  "type": [
    "sa",
    "cleo",
    "mission"
  ]
 },
 {
  "id": "3",
  "title": "FPS de Reservas",
  "description": `Con este mod, podremos casi duplicar la taza de FPS en un segundo. Al inicial el mismo juego, este ya nos estara brindando FPS extras, y como si eso no es suficiente para ti, este mod agrega un modo el cual al activarlo, nos empezara a dar aun mas FPS.`,
  "type": [
    "sa",
    "cleo",
    "mod"
  ]
 },
 {
  "id": "2",
  "title": "Doc. Clasica",
  "description": `Como su hermana menor "Moderna" y liviana de 2MB, esta version ya no cuenta con soporte y pesa 13MB.`,
  "type": [
    "sa",
    "tool",
    "developer"
  ]
 },
 {
  "id": "1",
  "title": "Entrar al Garaje",
  "description": `Con este grandioso mod, podremos acceder al interior del Garaje de Doherty sin la necesidad de remplazar algun archivo esencial del mismo juego. Tambien ofrece opciones de rendimiento con la memoria virtual.`,
  "type": [
    "sa",
    "cleo",
    "mod"
  ]
 }
]

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