'use strict';

// GLOBAL VARS
const D = document

const
		NP = Number.prototype,
		SP = String.prototype,
		AP = Array.prototype,
		EP = Element.prototype

SP.i = SP.includes
SP.r = function(text, _text = '', _machs = ''){
  return this.replace(text, _text, _machs)
}
SP.rA = function(text, _text = ''){
  return this.replaceAll(text, _text)
}
AP.i = AP.includes

RegExp.prototype.s = RegExp.prototype.source
NodeList.prototype.forEach = Array.prototype.forEach



//       FUNCIONES DE DOM


/** Console.log
 * @param {AnyTypeData} opciona
 */
const log = (MESSAGE) => console.log(MESSAGE)
/** Smart selector for elements of the DOM
 * @param {DOMString}
 * @param {Element} optional
 * @return {Element}
 */
const $ = (element, _parent = document) => {
	const callback = _parent
	if(typeof _parent == 'function') {
		_parent = document
	}
	const xElements = _parent.querySelectorAll(element)
	const length = xElements.length
	element = element.charAt(0) === '#' && !/\s/.test(element) || length === 1 ? _parent.querySelector(element) : length === 0 ? undefined : xElements
	if(typeof callback == 'function') {
		if(element) {
			if('' + element == '[object NodeList]') {
				element.forEach(function(e) {
					callback(e)
				})
			} else {
				callback(element)
			}
		}
	} else {
		return element
	}
}
/** Smart creator for elements of the DOM
 * @param {DOMString}
 * @return {Element}
 */
const new$ = (element, append = 'body') => {
	let $temp = document.createElement(element)
	$(append).appendChild($temp)
	return $temp
}
/** Apply a function to all elements of the DOM
 * @param {NodeList} 
 * @param {function}
 */
function apply(element, callback) {
  if (element) {
    if ('' + element == '[object NodeList]') {
      element.forEach(function(e) {
        callback(e)
      })
    } else {
      callback(element)
    }
  }
}





function vibrateNavigator(x){
  if (window.navigator.vibrate)
    window.navigator.vibrate(x)
  else
    log('API.vibrate: not available')
}

//       FUNCIONES DE OBJECT





function isObject(obj) {
    return obj && typeof obj === 'object' && !Array.isArray(obj);
}

// Combina objetos a profundidad. solo si un elemento
//   no es un objeto, no le aplica una combinacion,
//   sino un remplazo.
function deepMerge(target, source) {
    const stack = [{ target, source }];

    while (stack.length > 0) {
        const { target, source } = stack.pop();

        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (isObject(source[key])) {
                    if (!target[key] || !isObject(target[key])) {
                        target[key] = {};
                    }
                    stack.push({ target: target[key], source: source[key] });
                } else {
                    target[key] = source[key];
                }
            }
        }
    }

    return target;
}






//       FUNCIONES DE ARRAY




/** Remove elements of a array what is same to ''.
 */
AP.clear = function() {
  let result = []

  this.forEach((e) => {
    if (!e == '') result.push(e)
  })

  return result
}

/** Return the last element of a array.
 * @pos - Position [optional]
 */
AP.last = function(pos = 0) {
  return this[this.length - 1 - pos]
}
AP.first = function() {
  return this[0]
}



//       FUNCIONES DE FETCH



// Utilidad de LocalStorage
const LS = {
  t : localStorage,
  get : (x) => LS.t.getItem(x),
  set : (x, y) => LS.t.setItem(x, y)
}

/**
 * Hace una petición Fetch con posibilidad de pasar un callback para indicar el porcentaje de descarga.
 * Si la descarga toma más de 3 segundos o falla, recarga la página.
 */
async function fetchPercentage(response, callback) {
  const contentLength = response.headers.get('Content-Length');
  if (!contentLength) throw new Error("Content-Length no disponible");

  let loaded = 0;
  const timeoutId = setTimeout(() => location.reload(), 3000); // Timeout de 3 segundos para recargar

  return new Response(
    new ReadableStream({
      start(controller) {
        const reader = response.body.getReader();
        function read() {
          reader.read()
            .then((progressEvent) => {
              if (progressEvent.done) {
                clearTimeout(timeoutId); // Descarga completada, cancelar el timeout
                controller.close();
                return;
              }
              loaded += progressEvent.value.byteLength;
              const percentage = Math.round((loaded / contentLength) * 100);
              if (callback) callback(percentage);
              controller.enqueue(progressEvent.value);
              read();
            })
            .catch(() => {
              clearTimeout(timeoutId); // Cancela el timeout en caso de error
              location.reload(); // Recarga la página si hay un fallo en la lectura
            });
        }
        read();
      }
    })
  );
}

/**
 * Almacena un archivo de texto en el localStorage y lo recupera para evitar descargas innecesarias.
 * Si falla, recarga la página.
 * @param {string} url - URL de descarga.
 * @param {string} _saveAt - Dirección de almacenamiento (opcional).
 * @param {number} retries - Intentos antes de recargar
 * @returns {string} - Texto recuperado
 */
async function LSget(url, _saveAt, retries = 3) {
  _saveAt = _saveAt ?? url;
  let text = LS.get(_saveAt);

  if (!text) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url);
        const streamResponse = await fetchPercentage(response);
        text = await streamResponse.text();
        LS.set(_saveAt, text);
        break;
      } catch (error) {
        if (attempt === retries) {
          console.error(`Error al descargar el archivo en ${url} después de ${retries} intentos.`);
          location.reload();
        } else {
          console.log(`Reintentando descarga ${url} (${attempt}/${retries})...`);
        }
      }
    }
  }

  return text;
}

/**
 * Descarga y almacena múltiples archivos de texto en el localStorage, mostrando el progreso con hashtags.
 * Si falla alguno, recarga la página.
 * @param {Array} files - Array de arrays con URLs y direcciones de almacenamiento.
 * @param {HTMLElement} messaElem - Elemento HTML para mostrar el progreso.
 * @returns {Array<string>} - Array con el contenido de los archivos descargados.
 */

async function LSgetCollection(files, messaElem, loadElem) {
  const results = [];
  const totalFiles = files.length;
  let completedFiles = 0;

  // Actualiza el progreso visual en el elemento HTML
  function updateProgress() {
    if (messaElem) {
      loadElem.textContent = `${"▓".repeat(completedFiles)}${"░".repeat(totalFiles - completedFiles)}`;
      messaElem.textContent = 'Downloading...';
    }
  }

  // Actualiza el progreso visual inicial
  updateProgress();

  for (const [url, saveAt] of files) {
    try {
      const text = await LSget(url, saveAt);
      results.push(text);
      completedFiles++;
      updateProgress();
    } catch {
      messaElem.textContent = "Reloading..."
      setTimeout(() => {
        location.reload(); // Recarga la página si algún archivo falla
      }, 350);
      
    }
  }

  // Espera 1 segundo y cambia el texto de progreso a [OKEY!!]
  if (messaElem) {
    setTimeout(() => {
      messaElem.textContent = "OK"
    }, 250);
  }

  return results;
}




// &&&&&&&&&&&&&&&&&&&&&&&&&&&


SP.dividirCadena = function() {
    const resultado = [];
    let dentroComillas = false;
    let subcadenaActual = '';
    let comilla = 0

    for (let i = 0; i < this.length; i++) {
        const caracter = this[i];
        const caracterAnterior = this[i-1];

        if (caracter === '"' || caracter === "'"){
          if (caracterAnterior != '\\') {
             dentroComillas = !dentroComillas;
          }
          
          subcadenaActual += caracter;
        } else if (caracter === ' ' && !dentroComillas) {
            // Si encontramos un espacio fuera de las comillas, guardamos la subcadena actual
            if (subcadenaActual.trim() !== '') {
                resultado.push(subcadenaActual);
            }
            subcadenaActual = '';
        } else {
            subcadenaActual += caracter;
        }
    }

    // Al final, si hay una subcadena no vacía, la agregamos al resultado
    if (subcadenaActual.trim() !== '') {
        resultado.push(subcadenaActual);
    }

    return resultado;
}


let shared_db = JSON.parse(localStorage.getItem("shared_db") || "{}")

SP.fixOpcodes = function(){
  let tm = this.split('\n').map(line => {
    let negado = false
    line = line.trim().dividirCadena()
    
    if (line.length >= 1){
      if (line[0].length < 5 && line[0].endsWith(':')){
        line[0] = line[0].r(/:$/m)
        if (line[0].startsWith('!')){
          line[0] = line[0].r(/^\!/m).hexToDec()
          line[0] += 0b1000000000000000
          line[0] = line[0].toString(16)
        }
        line[0] = (line[0]+'').padStart(4, '0') + ':'
      }
    }
    
    line = line.join(' ')
    return line
  }).join('\n')
  
  return tm
}


EP.class = function(str = ''){
  if (str != ''){
    if (str.i(' ')){
      str.split(' ').forEach(className=>{
        this.class(className)
      })
      return this.classList.value.split(' ')
    }
    
    let [m, action, classes] = str.match(/^([\!\?\+\-\~\>]?)(.+)/m)
    
    classes = classes.trim()
    
    if (action == '+') this.classList.add(classes);
    if (action == '-') this.classList.remove(classes);
    if (action == '~') this.classList.toggle(classes);
    if (action == '>') this.classList.replace(classes);
    if (action == '?')
      return this.classList.contains(classes);
    if (action == '!')
      return !this.classList.contains(classes);
  }
  return this.classList.value.split(' ')
  
}

	EP.next = function(){
		return this.nextElementSibling
	}

	EP.previous = function(){
		return this.previousElementSibling
	}
	
	EP.gAttr = function (attr){
	  return this.getAttribute(attr)
	}
	
  EP.sAttr = function(attr, val="") {
    this.setAttribute(attr, val)
  }

	EP.hidden = function(){
	    return this.style.display == "none"
	}

	EP.show = function(){
	    this.style.display = "block"
	}

	EP.hide = function(){
	    this.style.display = "none"
	}

	EP.toggle = function(c){
		if (c){
			setTimeout(function(){
				// Clear the hash
				history.pushState('', document.title, location.pathname)
			}, 12)	
		}

		if (this.class("?d-block")){
			this.class('-d-block')
			this.style = 'display:block'
		}
		if (this.class("?d-none")){
			this.class('-d-none')
			this.style = 'display:none'
		}

		getComputedStyle(this).display == "block"
			? this.hide()
			: this.show()
		;
	}

	EP.setCursor = function(atPosition){
	    this.setSelectionRange(atPosition, atPosition);
	    this.focus();
	}
	
	EP.setCursorFull = function (linea, columna) {
	  linea<1?linea=1:linea
    // Obtenemos el contenido del TextArea
    const contenido = this.value;

    // Calculamos la posición del cursor en función de la línea y columna
    let posicionCursor = 0;
    let lineas = contenido.split("\n");
    for (let i = 0; i < Math.min(linea - 1, lineas.length); i++) {
        posicionCursor += lineas[i].length + 1; // Sumamos 1 para el salto de línea
    }
    posicionCursor += Math.min(columna, lineas[linea - 1].length);

    // Establecemos la posición del cursor
    this.selectionStart = posicionCursor;
    this.selectionEnd = posicionCursor;
    
    updateDataLine()
}


	EP.getCursor = function() {
    return [this.selectionStart, this.selectionEnd];
};

EP.DATA_TEXTAREA = function() {
    let t = this.getCursor();
    let posicionCursor = t[0] !== t[1] ? t[0] - t[1] : t[0];
    let stringRequerido = this.value.substr(0, posicionCursor);
    let lineaCursor = stringRequerido.split("\n").length;
    let posicionLinea = stringRequerido.lastIndexOf("\n") + 1;
    const textLine = this.value.split("\n")[lineaCursor - 1].trim();
    let primerPalabra = textLine.split(' ')[0];
    
    const columnaCursor = posicionCursor - posicionLinea;
    
    let tempA = (str) => {
        let palabra = '';
        let corta = " ,<>{}()[]\t\n";
        for (let i = columnaCursor; i < str.length; i++) {
            if (corta.includes(str[i])) break;
            palabra += str[i];
        }
        for (let i = columnaCursor - 1; i >= 0; i--) {
            if (corta.includes(str[i])) break;
            palabra = str[i] + palabra;
        }
        return palabra;
    };
    
    const inSelection = t[0] !== t[1];
    
    let mediaPalabra = '';
    if (!inSelection) {
        mediaPalabra = tempA(this.value.split("\n")[lineaCursor - 1]);
    }
    
    const charsSelected = inSelection ? t[1] - t[0] : 0;
    const textSelected = this.value.substring(t[0], t[1]);
    
    // Cálculo del rango de números de líneas seleccionadas
    const lineStart = this.value.substring(0, t[0]).split("\n").length;
    const lineEnd = this.value.substring(0, t[1]).split("\n").length;
    const linesSelected = Array.from({length: lineEnd - lineStart + 1}, (_, i) => i + lineStart);
    
    // Posición absoluta del cursor
    const posicionCursorAbsoluta = t[0];
    
    const output = {
        lineaCursor,
        columnaCursor,
        inSelection,
        charsSelected,
        textSelected,
        primerPalabra,
        mediaPalabra,
        textLine,
        linesSelected,
        posicionCursorAbsoluta
    };
    return output;
};

	EP.AddAtSection = function(text){
	  var start = this.selectionStart;
	  var end = this.selectionEnd;
	  this.value = this.value.substring(0, start) + text + this.value.substring(end);
	  this.selectionStart = this.selectionEnd = start + 1; // Posiciona el cursor
	  this.focus()
	}

	EP.obtenerUltimaPalabra = function() {
    const contenido = this.value.trim();
    let cursorPosicion = this.selectionStart;

    // Buscamos la posición del espacio, tabulación, salto de línea o retorno de carro anterior al cursor
    const regex = /[\s\t\n\r]+/g;
    const palabras = contenido.split(regex);

    // Obtenemos la última palabra antes del cursor
    let ultimaPalabra = "";
    for (let i = 0; i < palabras.length; i++) {
        if (palabras[i].length + 1 <= cursorPosicion) {
            cursorPosicion -= palabras[i].length + 1;
        } else {
            if (cursorPosicion === 0) {
                // Si el cursor está justo después de un espacio, avanzamos al siguiente
                i++;
            }
            ultimaPalabra = palabras[i];
            break;
        }
    }

    // Verificamos si la última palabra es un espaciador de caracteres
    if (/\s/.test(ultimaPalabra)) {
        return ""; // No retornamos nada si es un espaciador
    }

    return ultimaPalabra;
}

EP.getTextSelected = function() {
    let start = this.selectionStart;
    let end = this.selectionEnd;
    return this.value.substring(start, end);
}

	EP.CopyTextContent = function() {
		let $temp = new$("textarea")
		$temp.value = (typeof this == 'object' ? this.textContent : this)
		$temp.select();
		D.execCommand("copy")
		$('body').removeChild($temp)
	}

EP.clearLine = function(lineNumber) {
    const lines = this.value.split("\n");
    if (lineNumber < 1 || lineNumber > lines.length) {
        return false; // Línea fuera del rango, no se puede borrar
    }
    // Reemplaza la línea especificada con un salto de línea vacío
    lines[lineNumber - 1] = "";
    // Reconstruye el texto con las líneas modificadas
    this.value = lines.join("\n");
    return true; // Indica que se borró la línea correctamente
}








const $itemsContainer = $('#items');
const $addTextTabButton = $('#addTextTab');
const $addFolderTabButton = $('#addFolderTab');
const $currentDirectory = $('#currentDirectory');
const $clearAll = $('#clearAll');

const $menu = $('#menu')
const $explorer = $('#explorer')
const $backgroundExplorer = $('#backgroundExplorer')

const $editorCounterLine = $("#editor-counterLine")
const $editorContainer = $('#editor-container')
const $editor = $('#editor');
const $highlighting = $("#highlighting")

const $settings = $('#settings')
const $documentation = $('#documentation')
const $debugHex = $('#debug_hex')



const resetView = (sinFx) => {
  let visible = null
  if (sinFx) visible = sinFx.class('?d-none');
  
  $settings.class('+d-none')
  $documentation.class('+d-none')
  $debugHex.class('+d-none')
  
  $editorCounterLine.class('-d-none')
  $editorContainer.class('-w-50')
  $highlighting.class('-w-50')
  
  if (sinFx){
    if (visible) sinFx.class('-d-none')
  }
  return sinFx ? sinFx.class() : null
}

$('[for=open_docu]', e=>{e.onclick = () =>{
  closeMenu()
  resetView($documentation)
}})

$('[for="settings"]', e=>{e.onclick = () =>{
  closeMenu()
  resetView($settings)
}})

$('[for="debug_hex"]', e=>{e.onclick = () =>{
  closeMenu()
  $editorCounterLine.class('~d-none')
  $editorContainer.class('~w-50')
  $highlighting.class('')
  $('#error').style.display = 'none'

  if (!$debugHex.class('~d-none').i('d-none')){
    syncDebugHex()
    $settings.class('+d-none')
    $documentation.class('+d-none')
  }
}})







//---------------------
// explorador de archivos aqui
// tambien sistema de pestañas



let cutTabId = null;
let activeTabId = null;
let editedTabs = JSON.parse(localStorage.getItem('tabs')) || [];
let tabs = JSON.parse(localStorage.getItem('items')) || [];
let currentTabId = localStorage.getItem('currentTabId');


let DATA_DOWNLOADED = []

let keywords = {
    "syntax": ["hex", "end", "while", "if", "else", "for", "then", "break", "continue", "until", "repeat", 'float', 'int', 'string', 'long', 'short', 'not', 'and', 'or', 'endif', 'endfor', 'endwhile', 'null', 'undefined', 'NaN', 'forin', 'forinend'],
    "label": [],
    "var": []
};

let constants = []

let classMembers = {}

// Supongamos que tienes una estructura de datos para las enumeraciones
let enums = {};
let models = {};

const snippets = {
    "if-then-end": "if |\nthen |\nend",
    "if-then-else-end": "if |\nthen |\nelse |\nend",
    "while": "while |\n  |\nend",
    "while-true": "while true\n  |\nend",
    "while-false": "while false\n  |\nend",
    "repeat-until": "repeat\n  |\nuntil |",
    "for": "for 0@ = 0 to | step 1\n  |\nend",
    "forin": "forin 0@(1@,20)\n  0@(1@,20) = 0|\nend"
};





let classNames = Object.keys(classMembers);

function toggleMenu() {
  if ($backgroundExplorer.style.display == 'none') {
    $explorer.style.translate = '0'

    $backgroundExplorer.style.display = 'block'
    $backgroundExplorer.style.opacity = '1'
    resetView()
  } else {
    $explorer.style.translate = '-100vw 0'
    $backgroundExplorer.style.display = 'none'
    $backgroundExplorer.style.opacity = '0'
  }
}

function closeMenu() {
  if ($backgroundExplorer.style.display != 'none') {
    $explorer.style.translate = '-100vw 0'
    $backgroundExplorer.style.display = 'none'
    $backgroundExplorer.style.opacity = '0'
  }
}



//    EXPLORADOR Y PESTAÑAS
document.addEventListener('DOMContentLoaded', () => {
	$menu.onclick = toggleMenu
	$backgroundExplorer.onclick = toggleMenu
	
	$clearAll.onclick = () => {
		showConfirmationDialog('ALL THE PROYECT', () => {
			localStorage.setItem('items', '[]')
			localStorage.setItem('tabs', '[]')
			localStorage.setItem('currentTabId', 0)
			window.location.href = window.location.href
		});
	}





// Función para buscar un archivo o carpeta por su ruta
function findTabByPath(path, currentDir = tabs) {
    // Dividimos la ruta en partes para navegar
    let pathParts = path.split('/');

    // Recursivamente buscamos en la estructura
    for (let part of pathParts) {
        let found = currentDir.find(item => item.name === part);
        if (found) {
            // Si encontramos una carpeta, actualizamos el directorio actual
            if (found.type === 'folder') {
                currentDir = found.contents; // Navegamos a la carpeta
            } else {
                return found; // Retornamos el archivo encontrado
            }
        } else {
            // Si no encontramos el archivo o carpeta, retornamos null
            return null;
        }
    }
    return null; // Si no se encuentra nada
}


  
function getFileContent(path, currentDir = tabs, currentFolder = null, callingFile = '') {
    path = path
        .toLowerCase()
        .replace('.txt', '') // Quitamos la extensión .txt
        .replace(/\\/g, '/')
        .replace(/^\.\//m, '');

    // Si estamos dentro de una carpeta y el archivo está en la misma carpeta
    if (currentFolder) {
        let foundInFolder = currentFolder.contents.find(item => item.name.toLowerCase() === path);
        if (foundInFolder) {
            return `// OPEN '${path}.txt'\n${processImports(foundInFolder.content, currentDir, currentFolder, path)}\n// CLOSE '${path}.txt'`;
        }
    }

    // Si no está en la misma carpeta, seguimos buscando en la estructura principal
    let pathParts = path.split('/');
    for (let part of pathParts) {
        let found = currentDir.find(item => item.name.toLowerCase() === part);
        if (found) {
            if (found.type === 'folder') {
                currentDir = found.contents; // Navegamos dentro de la carpeta
            } else if (found.type === 'text') {
                return `// OPEN '${path}'\n${processImports(found.content, currentDir, currentFolder, path)}\n// CLOSE '${path}'`;
            }
        } else {
            // Manejo del error: archivo no encontrado
            vibrateNavigator(200);
            showToast(`File "${path}.txt" not found while importing from "${callingFile}.txt".`, 'fail', 5000);
            return null;
        }
    }
    return null;
}


  // Función recursiva para procesar las importaciones
function processImports(content, currentDir, currentFolder, callingFile) {
    let directiveRegex = /\{\$I\s+([^\s]+)\}/ig;

    return content.replace(directiveRegex, (match, path) => {
        // Usamos currentFolder para importar dentro de la misma carpeta
        let importedContent = getFileContent(path, currentDir, currentFolder, callingFile);
        
        return importedContent !== null ? importedContent : match;
    });
}
  
window.importFileInFile = function() {
    // Encontramos el archivo abierto
    let openTab = findTabById(currentTabId, tabs);
    if (!openTab) {
        showToast('Current file not found.', 'fail', 5000);
        return;
    }

    // Calculamos la carpeta padre del archivo abierto
    let parentFolder = findParentFolder(openTab.id, tabs);

    // Obtenemos el contenido del archivo y procesamos las importaciones
    let finalContent = processImports(openTab.content, tabs, parentFolder, openTab.name);

    // Imprimimos el resultado final
    if (!/\{\$I\s+([^\s]+)\}/i.test(finalContent)){
      return finalContent
    }
    return null
}
  
  // Event listener para el botón "compile"
  $('[for=compile]', e=>{e.onclick = ()=>{
    try {
      importFileInFile()
      .toCompileSCM(
        findTabById(currentTabId, tabs).name + '.txt'
      )
      showToast(`Compiled project!`)
    } catch (error) {
      showToast('Error:<br>'+error.message, 'fail', 5000)
      console.error(error.message)
      throw error
    }
    closeMenu()
    resetView()
}});








	window.Explorer_Save = function() {
		localStorage.setItem('items', JSON.stringify(tabs));
	}

	window.saveCurrentTabId = function(id) {
		localStorage.setItem('currentTabId', id);
	}

	function Items_render() {
		$itemsContainer.innerHTML = '';
		if(tabs == '') tabs = []
		const sortedTabs = Item_Sort(tabs);
		sortedTabs.forEach(tab => Explorer_render(tab, $itemsContainer));
		updateMoveToRootButtonVisibility();
		renderEditedTabs();
	}

	function renderEditedTabs() {
		const $tabsContainer = $('#tabsContainer');
		$tabsContainer.innerHTML = '';
		editedTabs.forEach(tab => {
			const $tabButton = new$('button');
			$tabButton.textContent = `📄 ${tab.name}.txt`;
			$tabButton.onclick = () => {
				Item_Select(tab.id);
				updateActiveTab(tab.id);
			};
			$tabButton.className = 'upperTab'
			
			const $closeButton = new$('button');
			$closeButton.className = 'closeTab';
			$closeButton.textContent = '×';
			$closeButton.onclick = (event) => {
				event.stopPropagation();
				Tab_Remove(tab.id);
			};
			$tabButton.appendChild($closeButton);
			$tabsContainer.appendChild($tabButton);
			// Estilo para la pestaña activa
			if(tab.id === activeTabId) {
				$tabButton.classList.add('active')
			}
		});
		addCounterLine()
	}

	function updateActiveTab(tabId) {
    activeTabId = tabId;
    renderEditedTabs();
    const tab = findTabById(tabId, tabs);
    if (tab && tab.type === 'text') {
        $editor.value = tab.content; // Cargar el nuevo contenido en el editor
        syncHighlighting()
    }
}

	window.saveTabContent = function() {
		const tab = findTabById(activeTabId, tabs);
		if(tab) {
			tab.content = $editor.value;
			Explorer_Save();
			Tab_Add(tab);
		}
	}
	/** Quita una pestaña de ID escogido
	 * @param {Number} id
	 */
	window.Tab_Remove = function(id) {
		editedTabs = editedTabs.filter(tab => tab.id !== id);
		localStorage.setItem('tabs', JSON.stringify(editedTabs));
		renderEditedTabs();
	}
	/** Añade una pestaña a la lista de pestañas editadas y actualiza el almacenamiento local y la interfaz.
	 * @param {Object} tab
	 */
	function Tab_Add(tab) {
		if(!editedTabs.some(t => t.id === tab.id)) {
			editedTabs.push(tab);
			localStorage.setItem('tabs', JSON.stringify(editedTabs));
			renderEditedTabs();
		}
	}

	function Item_Sort(tabList) {
		return tabList.slice().sort((a, b) => {
			if(a.type === 'folder' && b.type !== 'folder') return -1;
			if(a.type !== 'folder' && b.type === 'folder') return 1;
			return a.name.localeCompare(b.name);
		}).map(tab => {
			if(tab.type === 'folder' && tab.contents) {
				return {
					...tab,
					contents: Item_Sort(tab.contents)
				};
			}
			return tab;
		});
	}

	function Explorer_render(tab, $container, parentFolderId = null) {
		const $tabElement = new$('div');
		$tabElement.className = tab.type === 'folder' ? 'folder' : 'tab';
		const isCut = cutTabId === tab.id;
		const isActive = activeTabId === tab.id;
		
		const cutButton = !isCut && (!parentFolderId || parentFolderId !== tab.id) && tabs.some(t => t.type === 'folder' && t.id !== tab.id) ? `<button onclick="Item_cutTab(${tab.id})">✄ Curt</button>` : '';
		
		const pasteButton = tab.type === 'folder' && cutTabId !== null && !isDescendant(cutTabId, tab.id) && cutTabId !== tab.id ? `<button onclick="Item_Paste(${tab.id})">⎗ Paste</button>` : '';
		
		const cancelCutButton = isCut ? `<button onclick="Item_cancelCut()">↶ Cancel</button>` : '';
		
		const moveToParentButton = parentFolderId ? `<button onclick="Item_moveToParent(${tab.id}, ${parentFolderId})">⇠ Descend</button>` : '';
		
		const childCount = tab.type === 'folder' ? `<sup>${tab.contents.length}</sup>` : '';
		
		const deleteButton = `<button onclick="
          vibrateNavigator(200);
          showConfirmationDialog('${tab.name}', ()=>{
            Tab_Remove(${tab.id});
            Item_Remove(${tab.id});
          });"
        >✖ Delete</button>`
        
		const downloadButton = tab.type === 'text' ? `<button onclick="File_download(${tab.id})">⬇ Download</button>` : '';
		
		const uploadButton = tab.type === 'folder' ? `<button onclick="File_upload(${tab.id})">⇪ Upload</button>` : '';
		
		$tabElement.innerHTML = `
      <span ${tab.type === 'folder' ? 'onclick="Item_toggleFolder(' + tab.id + ')"' : ''}>
          ${tab.type === 'folder' ?  (tab.expanded ? '📂' : '📁') : '📄'}
          ${tab.name}${childCount}${tab.type === 'folder' ? '<span class="indicator"></span>' : '.txt'}
      </span>
      
      <span class="dropdown">
        <button class='for-open'>⋯</button>
        <div class="content">
          ${tab.type === 'folder'
            ? '<button onclick="Explorer_addItem(' + tab.id
            + ', `text`)">+ New File</button>'
            + '<button onclick="Explorer_addItem(' + tab.id
            + ', `folder`)">+ New Folder</button>'
            + uploadButton
            + '<hr>'
            : ''}
          <button onclick="Item_rename(${tab.id});">✎ Rename</button>
          ${cutButton}
          ${pasteButton}
          ${cancelCutButton}
          ${moveToParentButton}
          <hr>
          ${downloadButton}
          ${deleteButton}
        </div>
      </span>
    `;
		if(isActive) {
			$tabElement.style.backgroundColor = '#E6E6FA17'; // Violeta claro para la pestaña activa
		} else {
			$tabElement.style.backgroundColor = ''; // Fondo normal para pestañas no activas
		}
		$tabElement.onclick = (event) => {
			if(currentTabId != tab.id) {
				event.stopPropagation();
				if(tab.type === 'text') {
					Item_Select(tab.id);
				}
			}
		};
		$container.appendChild($tabElement);
		if(tab.type === 'folder' && tab.contents && tab.expanded) {
			const $folderContents = new$('div');
			$folderContents.className = 'folder-contents';
			tab.contents.forEach(subTab => Explorer_render(subTab, $folderContents, tab.id));
			$container.appendChild($folderContents);
		}
	}

	function removeTab(tabId) {
		// Eliminar la pestaña del array de pestañas
		tabs = tabs.filter(tab => tab.id !== tabId);
		// Eliminar la pestaña de las carpetas, si es necesario
		tabs.forEach(tab => {
			if(tab.type === 'folder') {
				tab.contents = tab.contents.filter(content => content.id !== tabId);
			}
		});
		// Si la pestaña eliminada es la pestaña activa, actualizar la pestaña activa
		if(activeTabId === tabId) {
			activeTabId = null;
		}
		// Eliminar la pestaña de las pestañas editadas
		editedTabs = editedTabs.filter(tab => tab.id !== tabId);
		Tab_Remove(tabId)
		Explorer_Save();
		Items_render();
		renderEditedTabs(); // Asegurarse de que la barra de pestañas activas se actualice
	}

	function updateMoveToRootButtonVisibility() {
		const $moveToRootButton = $('#moveToRootButton');
		if(cutTabId !== null) {
			$moveToRootButton.style.display = 'inline';
		} else {
			$moveToRootButton.style.display = 'none';
		}
	}

	function tabHasYourItem(_items, _tabs) {
		// Crear un Set con los IDs del primer array
		const work = new Set(_items.map(obj => obj.id));
		// Filtrar los objetos del segundo array que tienen un ID presente en el primer array
		const matching = _tabs.filter(obj => work.has(obj.id));
		// Retornar el nuevo array con los objetos coincidentes
		return matching;
	}

function findParentFolder(childId, tabList) {
	  for (let tab of tabList) {
	    if (tab.type === 'folder' && tab.contents.some(subTab => subTab.id === childId)) {
	      return tab;
	    }
	    if (tab.type === 'folder') {
	      const found = findParentFolder(childId, tab.contents);
	      if (found) return found;
	    }
	  }
	  return null;
	}
	window.Item_cutTab = function(id) {
		cutTabId = id;
		Items_render();
	};
	window.Item_cancelCut = function() {
		cutTabId = null;
		Items_render();
	};

window.getFileSize = function(content) {
        return new Blob([content]).size; // Calcula el tamaño en bytes del contenido
    }

window.Item_moveToParent = function(id, parentFolderId) {
		// Sobrescribir el contenido de la pestaña existent
		const tabToMove = findTabById(id, tabs);
		const parentFolder = findParentFolder(parentFolderId, tabs);
		
		
		// Verificar si existe un archivo con el mismo nombre en el directorio padre
    let conflictingTab = null;
    
    if (parentFolder) {
        conflictingTab = parentFolder.find(tab =>
          tab.name === tabToMove.name &&
          tab.type === tabToMove.type
        );
    } else {
        conflictingTab = tabs.find(tab =>
          tab.name === tabToMove.name &&
          tab.type === tabToMove.type
        );
    }
    
		if (conflictingTab) {
  	  const tabToMoveSize = getFileSize(tabToMove.content);
  	  const conflictingTabSize = getFileSize(conflictingTab.content);
	
	    openModal('⚠️ File Conflict',
	      `There is already a file named "${tabToMove.name}" in the parent folder. Do you want to replace it?

<br><br>${conflictingTabSize} bytes will be lost
<br>${tabToMoveSize} bytes will be added

<br><br><b>This action cannot be undone</b>`,
	      null, 'Replace', 'Cancel')
	    .then(confirmOverwrite => {
	      if (confirmOverwrite) {
	        // Eliminar ambos archivos
	        Item_Remove(tabToMove.id); // Eliminar el archivo que se va a mover de su ubicación original
	        Item_Remove(conflictingTab.id); // Eliminar el archivo en conflicto
	
	        // Crear un nuevo archivo con la información del archivo movido
	        const newTab = {
	          ...tabToMove, // Copiar la información del archivo que se va a mover
	          id: id, // Generar un nuevo ID único
	        };
	
	        if (parentFolder) {
	          parentFolder.contents.push(newTab); // Añadir el nuevo archivo en la carpeta padre
	        } else {
	          tabs.push(newTab); // Añadir el nuevo archivo a la raíz si no hay carpeta padre
	        }
	        Item_Select(id)
	
	        cutTabId = null; // Cancelar la acción de cortar
	        Explorer_Save();
	        Items_render();
	        showToast('Successfully replaced!')
	      } else {
	        // Si el usuario cancela la operación
	        cutTabId = null;
	        Explorer_Save();
	        Items_render();
	      }
	    });
	} else {
	  Item_Remove(id); // Eliminar el archivo que se va a mover de su ubicación original
	  
	  // Si no hay conflicto, mover el archivo normalmente
	  if (parentFolder) {
	    parentFolder.contents.push(tabToMove); // Mover el archivo a la carpeta padre
	  } else {
	    tabs.push(tabToMove); // Mover el archivo a la raíz si no hay carpeta padre
	  }
	
	  Item_Select(id)
	  cutTabId = null; // Cancelar la acción de cortar
	  
	  
	  updateMoveToRootButtonVisibility();
	    updatePlaceholder();
	    Items_render();
	    renderEditedTabs();
	    Explorer_Save();
	    showToast('Successfully moved!')
	}
	};
	
	
window.Item_Paste = function(folderId) {
	  // Guardar la información del archivo a cortar
	  const cutTab = findTabById(cutTabId, tabs);
	  const folder = findTabById(folderId, tabs);
	  if (!cutTab || !folder || folder.type !== 'folder') return;
	
	  // Guardar la información del archivo con el que entra en conflicto (si existe)
	    const conflictingTab = folder.contents.find(tab => tab.name === cutTab.name && tab.type === cutTab.type);
	    
	    // Variable para determinar si alguno de los archivos estaba seleccionado
	    const wasSelected = (activeTabId === cutTab.id || (conflictingTab && activeTabId === conflictingTab.id));
	    
	    if (conflictingTab) {
  	  const tabToMoveSize = getFileSize(cutTab.content);
  	  const conflictingTabSize = getFileSize(conflictingTab.content);
  	  
	    // Si existe un conflicto, preguntar si se desea sobrescribir
	    openModal('⚠️ File Conflict',
	      `There is already a file named "${tabToMove.name}" in the parent folder. Do you want to replace it?

<br><br>${conflictingTabSize} bytes will be lost
<br>${tabToMoveSize} bytes will be added

<br><br><b>This action cannot be undone</b>`,
	      null, 'Replace', 'Cancel')
	      .then(confirmOverwrite => {
	        if (confirmOverwrite) {
	          // Eliminar ambos archivos
	          removeTab(cutTab.id); // Eliminar el archivo cortado de su ubicación original
	          removeTab(conflictingTab.id); // Eliminar el archivo en conflicto
	
	          // Crear un nuevo archivo con la información del archivo cortado
	          const newTab = {
	            ...cutTab, // Copiar la información del archivo cortado
	            id: Date.now(), // Nuevo ID único
	          };
	          folder.contents.push(newTab); // Añadir el nuevo archivo a la carpeta
	
	          // Si alguno de los archivos estaba seleccionado, seleccionar el nuevo archivo
	          if (wasSelected) {
	            activeTabId = newTab.id;
	            Item_Select(newTab.id); // Seleccionar el nuevo archivo
	          }
	
	          cutTabId = null; // Cancelar la acción de cortar
	          updateMoveToRootButtonVisibility();
	          updatePlaceholder();
	          Items_render();
	          renderEditedTabs();
	          saveTabContent();
	          Explorer_Save();
	          showToast('Successfully replaced!')
	        } else {
	          // Si se cancela la sobrescritura
	          Item_cancelCut();
	          updateMoveToRootButtonVisibility();
	        }
	      });
	  } else {
	    // Si no hay conflicto, mover el archivo normalmente
	    const cutTab = findAndRemoveTabById(cutTabId, tabs);
	    folder.contents.push(cutTab);
	    folder.expanded = true;
	    cutTabId = null;
	    updateMoveToRootButtonVisibility();
	    updatePlaceholder();
	    Items_render();
	    renderEditedTabs();
	    Explorer_Save();
	    showToast('Successfully moved!')
	  }
	};

	function isDescendant(parentId, childId) {
		const parent = findTabById(parentId, tabs);
		if(!parent || parent.type !== 'folder') return false;
		for(let subTab of parent.contents) {
			if(subTab.id === childId) return true;
			if(subTab.type === 'folder' && isDescendant(subTab.id, childId)) return true;
		}
		return false;
	}
	window.moveCutTabToRoot = function() {
    if (cutTabId !== null) {
        // Guardar la información del archivo a mover
        const cutTab = findTabById(cutTabId, tabs);
        
        // Verificar si existe un archivo con el mismo nombre en la raíz
        const conflictingTab = tabs.find(tab =>
          tab.name === cutTab.name 
          && tab.type === cutTab.type
          && tab.id !== cutTab.id
        );
        
        // Variable para determinar si el archivo cortado o el archivo en conflicto está seleccionado
        const wasSelected = (activeTabId === cutTab.id || (conflictingTab && activeTabId === conflictingTab.id));

        if (conflictingTab) {
            const cutTabSize = getFileSize(cutTab.content);
            const conflictingTabSize = getFileSize(conflictingTab.content);

            // Si existe un conflicto, pedir confirmación al usuario
            openModal('⚠️ File Conflict',
`There is already a file named "${cutTab.name}" in the root. Do you want to replace it?

<br><br>${conflictingTabSize} bytes will be lost
<br>${cutTabSize} bytes will be added

<br><br><b>This action cannot be undone</b>`,
              null, 'Replace', 'Cancel')
            .then(confirmOverwrite => {
                if (confirmOverwrite) {
                    // Eliminar ambos archivos
                    Item_Remove(cutTab.id); // Eliminar el archivo cortado de su ubicación original
                    Item_Remove(conflictingTab.id); // Eliminar el archivo en conflicto

                    // Crear un nuevo archivo en la raíz con los datos del archivo cortado
                    const newTab = {
                        ...cutTab, // Copiar la información del archivo cortado
                        id: Date.now(), // Generar un nuevo ID único
                    };
                    tabs.push(newTab); // Añadir el nuevo archivo a la raíz

                    // Si alguno de los archivos estaba seleccionado, seleccionar el nuevo archivo
                    if (wasSelected) {
                        activeTabId = newTab.id;
                        Item_Select(newTab.id); // Seleccionar el nuevo archivo
                    }

                    cutTabId = null; // Cancelar la acción de cortar
                    updateMoveToRootButtonVisibility();
                    updatePlaceholder();
                    Items_render();
                    renderEditedTabs();
                    saveTabContent();
                    Explorer_Save();
                    showToast('Successfully replaced!')
                } else {
                    // Si se cancela la sobrescritura
                    Item_cancelCut();
                    updateMoveToRootButtonVisibility();
                }
            });
        } else {
            // Si no hay conflicto, mover el archivo a la raíz normalmente
            const cutTab = findAndRemoveTabById(cutTabId, tabs);
            tabs.push(cutTab);
            cutTabId = null; // Cancelar la acción de cortar
            updateMoveToRootButtonVisibility();
            updatePlaceholder();
            Items_render();
            renderEditedTabs();
            Explorer_Save();
            showToast('Successfully moved!')
        }
    }
};


	window.showConfirmationDialog = function(elementName, callback) {
		const currentNumber = Math.floor(Math.random() * 900) + 100;
		
		openModal('⚠️ ALERT',
`<b>Are you sure you want to delete "${elementName}"?</b> This action cannot be undone. Enter the number <b>${currentNumber}</b> to confirm.`,
'number', 'Accept', 'Cancel')
    .then(userNumber => {
		  if (userNumber == null)return;
		  
      if(userNumber === currentNumber.toString()) {
		  	callback();
		  } else {
		    showToast(`Incorrect number. Operation cancelled.`, 'fail', 5000);
		    vibrateNavigator(200)
		  }
		  if (elementName != 'ALL THE PROYECT')
		    showToast('Successfully removed!');
    })
	}

	function findAndRemoveTabById(id, tabList) {
		for(let i = 0; i < tabList.length; i++) {
			if(tabList[i].id === id) {
				return tabList.splice(i, 1)[0];
			}
			if(tabList[i].type === 'folder') {
				const found = findAndRemoveTabById(id, tabList[i].contents);
				if(found) return found;
			}
		}
		return null;
	}
	window.Item_toggleFolder = function(id) {
		const folder = findTabById(id, tabs);
		folder.expanded = !folder.expanded;
		Explorer_Save();
		Items_render();
	};

	function Item_Select(id) {
		currentTabId = id
		const tab = findTabById(id, tabs);
		if(tab) {
			if(tab.type === 'text') {
				activeTabId = id;
				$editor.value = tab.content;
				saveCurrentTabId(id);
				Items_render();
				Tab_Add(tab);
				$editor.disabled = false;
			} else {
				$editor.disabled = true
				$editor.value = '';
			}
		}
		updatePlaceholder()
	}
	window.Item_Remove = function(id) {
		tabs = deleteTabById(id, tabs)
		editedTabs = tabHasYourItem(tabs, editedTabs)
		localStorage.setItem('tabs', JSON.stringify(editedTabs))
		Explorer_Save()
		if(id == currentTabId) {
			$editor.value = ''
			currentTabId = null
		}
		if(id == cutTabId) {
			cutTabId = null
		}
		updateMoveToRootButtonVisibility()
		updatePlaceholder()
		Items_render()
		renderEditedTabs()
	};

	function updatePlaceholder() {
		// Uso de la función
		if(countTextFiles(tabs) != 0) {
			$editor.placeholder = '✨ Choose a file to get started ✨';
			if(doesTabExist(currentTabId, tabs)) {
				$editor.placeholder = 'You’re all set! 📝 Start writing...';
			}
		} else {
			$editor.placeholder = '🌟 Create your first file and bring your ideas to life 🌟';
		}
		$currentDirectory.textContent = getCurrentFileLocation(currentTabId, tabs)
	}

	function doesTabExist(id, tabList) {
		for(let tab of tabList) {
			if(tab.id === id) {
				return true;
			}
			if(tab.type === 'folder' && tab.contents) {
				if(doesTabExist(id, tab.contents)) {
					return true;
				}
			}
		}
		return false;
	}
	/**
	 * Returns a message indicating the current file being edited and its location.
	 * @param {number} currentTabId - The ID of the currently active tab.
	 * @param {Array} tabs - The array of all tabs.
	 * @return {string} - A message indicating the file name and its location.
	 */
	function getCurrentFileLocation(currentTabId, tabs) {
		const tab = findTabById(currentTabId, tabs);
		if(!tab) {
			return 'No file is currently being edited.';
		}
		let location = tab.name;
		let parentFolder = findParentFolder(tab.id, tabs);
		while(parentFolder) {
			location = `${parentFolder.name}  >  ${location}`;
			parentFolder = findParentFolder(parentFolder.id, tabs);
		}
		return location + '.txt'
	}

	function isTabNameTaken(name, type) {
		return tabs.some(tab => tab.name === name && tab.type === type);
	}

function generateUniqueId() {
    return Math.floor(Math.random() * Date.now());
}

function generateUniqueName(baseName, type, existingTabs) {
		let count = 0;
		let uniqueName = baseName;
		while(existingTabs.some(tab => tab.name === uniqueName && tab.type === type)) {
			count++;
			uniqueName = `${baseName} (${count})`;
		}
		return uniqueName;
	}

function Explorer_addText() {
  openModal('New File', 'Enter a Name or Path<br>(e.g., "src/main")', 'text', 'Create', 'Cancel',
  generateUniqueName('New file', 'text', tabs))
  .then(path => {
    if (path == null) return;

    // Reemplazar barras invertidas '\' con barras normales '/'
    path = path.replace(/\\/g, '/');

    // Dividir la ruta en carpetas y archivo
    const pathParts = path.split('/');
    const fileName = pathParts.pop(); // El último elemento es el nombre del archivo
    let currentFolder = tabs; // Empezamos en la raíz

    // Crear las carpetas si no existen
    for (let folderName of pathParts) {
      let folder = currentFolder.find(tab => tab.name === folderName && tab.type === 'folder');

      if (!folder) {
        // Si la carpeta no existe, crearla
        const newFolder = {
          id: generateUniqueId(),
          name: folderName,
          type: 'folder',
  			contents: [],
  			expanded: true,
        };
        currentFolder.push(newFolder);
        currentFolder = newFolder.contents; // Navegar dentro de la nueva carpeta
      } else {
        // Si la carpeta ya existe, navegar dentro de ella
        currentFolder = folder.contents;
      }
    }

    // Verificar si ya existe un archivo con el mismo nombre en la carpeta actual
    const existingFile = currentFolder.find(tab => tab.name === fileName && tab.type === 'text');
    if (existingFile) {
      showToast(`The file "${fileName}" already exists in this folder.`, 'fail', 5000);
      return;
    }

    // Crear el archivo dentro de la carpeta adecuada
    const id = generateUniqueId();
    currentFolder.push({
      id,
      name: fileName,
      type: 'text',
      content: ''
    });

    // Guardar cambios y actualizar la interfaz
    Explorer_Save();
    Items_render();
    Item_Select(id); // Seleccionar automáticamente la nueva pestaña para editarla
    updateActiveTab(id); // Actualizar la pestaña activa
    updatePlaceholder();
  });
}

	function Explorer_addFolder() {
	  openModal('New Folder', `Enter a name`,
'text', 'Create', 'Cancel',
	    generateUniqueName('New folder', 'folder', tabs)
	  ).then(name =>{
		  if (name == null)return;
	  
  		const id = Date.now();
  		tabs.push({
  			id,
  			name,
  			type: 'folder',
  			contents: [],
  			expanded: true
  		});
  		Explorer_Save();
  		Items_render();
	  })
	}
	
	window.addTabToFolder = function(folderId, type) {
    const folder = findTabById(folderId, tabs);
    if (!folder) {
        console.error('The folder with the specified ID does not exist.');
        return;
    }
let nameBase=''
    openModal(
    'New ' + (type === 'text' ? 'file' : 'folder'), 
    'Enter a name with the path (e.g., "src/main")', 
    'text',
    'Ok', 'Cancel',
    nameBase = 'New ' + (type === 'text' ? 'file' : 'folder')
).then(path => {
        if (path == null) return;

        // Reemplazar barras invertidas '\' por barras normales '/'
        path = path.replace(/\\/g, '/');

        // Dividir la ruta en carpetas y el nombre final
        const pathParts = path.split('/');
        const finalName = pathParts.pop(); // El último elemento es el nombre del archivo/carpeta
        let currentFolder = folder.contents; // Comenzamos en la carpeta seleccionada

        // Crear las carpetas si no existen
        pathParts.forEach(folderName => {
            let subFolder = currentFolder.find(tab => tab.name === folderName && tab.type === 'folder');
            
            if (!subFolder) {
                // Crear la carpeta si no existe
                const newFolder = {
                    id: generateUniqueId(),
                    name: folderName,
                    type: 'folder',
                    contents: [],
                    expanded: true
                };
                currentFolder.push(newFolder);
                currentFolder = newFolder.contents; // Navegar dentro de la nueva carpeta
            } else {
                // Si la carpeta ya existe, navegar dentro de ella
                currentFolder = subFolder.contents;
            }
        });

        // Verificar si ya existe un archivo o carpeta con el mismo nombre
        const existingItem = currentFolder.find(tab => tab.name === finalName && tab.type === type);
        if (existingItem) {
            showToast(`The file "${fileName}" already exists in this folder.`, 'fail', 5000);
            return;
        }

        // Crear el nuevo archivo o carpeta
        const newTab = {
            id: generateUniqueId(),
            name: finalName,
            type: type,
            content: type === 'text' ? '' : undefined,
            contents: type === 'folder' ? [] : undefined,
            expanded: type === 'folder' ? true : undefined
        };

        currentFolder.push(newTab);

        // Guardar cambios y actualizar la interfaz
        Explorer_Save();
        Items_render();
    });
};

	window.Explorer_addItem = function(folderId, type) {
		type ||= prompt('What would you like to add? (text/folder)');
		if(type === 'text' || type === 'folder') {
			addTabToFolder(folderId, type);
		} else if(type != null) {
		  showToast(`Type invalid. Use "text" or "folder".`, 'fail', 5000);
		}
	};
	window.Item_rename = function(id) {
	  const tab = findTabById(id, tabs);
	  
		openModal(
		  'Rename file', '', 'text',
		  'Ok', 'Cancel', tab.name
		).then(newName => {
		  if (newName == null)return;
		  newName = (''+newName).trim()
		  if (newName == '')return;
		  
  		if(newName) {
  			// Verificar si el nuevo nombre es el mismo que el actual
  			if(tab.name === newName) {
  				return; // No hacer nada si el nombre no cambia
  			}
  			const sameTypeTabs = tabs.filter(t => t.type === tab.type);
  			let uniqueName = newName;
  			let counter = 1;
  			while(sameTypeTabs.some(t => t.name === uniqueName)) {
  				uniqueName = `${newName} (${counter})`;
  				counter++;
  			}
  			tab.name = uniqueName;
  			Explorer_Save();
  			if(tab.type != 'folder') {
  				// Cerrar y volver a abrir la pestaña para forzar la actualización del nombre en el localStorage
  				Tab_Remove(id); // Cierra la pestaña actual
  				Tab_Add(tab); // Reabre la pestaña con el nuevo nombre
  			}
  			Items_render(); // Actualizar todas las pestañas en el DOM
  			renderEditedTabs(); // Actualizar la barra de pestañas activas
  			updatePlaceholder()
  			
  			showToast('Renamed successfully')
  		}
    })
	};
	/** Descarga el archivo de texto con el contenido correspondiente.
	 * @param {Number} id - El ID de la pestaña.
	 */
	window.File_download = function(id) {
		const tab = findTabById(id, tabs);
		if(tab && tab.type === 'text') {
			const element = document.createElement('a');
			const file = new Blob([tab.content], {
				type: 'text/plain'
			});
			element.href = URL.createObjectURL(file);
			element.download = `${tab.name}.txt`;
			document.body.appendChild(element); // Necesario para Firefox
			element.click();
			document.body.removeChild(element);
		}
	}
	/** Activa el input de subida de archivos para la carpeta seleccionada.
	 * @param {Number} folderId - El ID de la carpeta donde se subirá el archivo.
	 */
	window.File_upload = function(folderId) {
		const fileInput = document.createElement('input');
		fileInput.type = 'file';
		fileInput.accept = '.txt'; // Limitar a archivos de texto, puedes cambiar esto según tu necesidad
		fileInput.onchange = () => handleFileUpload(fileInput.files, folderId);
		fileInput.click();
	}
	/** Maneja la subida de archivos y los agrega a la carpeta seleccionada.
	 * @param {FileList} files - Lista de archivos subidos.
	 * @param {Number} folderId - El ID de la carpeta donde se subirá el archivo.
	 */
	window.handleFileUpload = function(files, folderId) {
		const folderTab = findTabById(folderId, tabs);
		if(folderTab && folderTab.type === 'folder') {
			Array.from(files).forEach(file => {
				const reader = new FileReader();
				reader.onload = (e) => {
					const content = e.target.result;
					const newFileTab = {
						id: generateId(), // Genera un ID único para el nuevo archivo
						type: 'text',
						name: file.name.replace(/\.txt$/, ''), // Remover extensión .txt para el nombre
						content: content
					};
					folderTab.contents.push(newFileTab);
					cutTabId = null;
					updateMoveToRootButtonVisibility()
					updatePlaceholder()
					Items_render()
					renderEditedTabs()
					saveCurrentTabId(newFileTab.id)
					Item_Select(newFileTab.id)
					Explorer_Save()
					saveTabContent()
				};
				reader.readAsText(file);
			});
		}
	}
	window.generateId = function() {
		return Math.floor(Math.random() * Date.now());
	}

	function findTabByName(name, tabList) {
		for(let tab of tabList) {
			if(tab.name === name) return tab;
			
		}
		return null;
	}

	function findTabById(id, tabList) {
		for(let tab of tabList) {
			if(tab.id === id) return tab;
			if(tab.type === 'folder') {
				const found = findTabById(id, tab.contents);
				if(found) return found;
			}
		}
		return null;
	}

	function deleteTabById(id, tabList) {
		return tabList.filter(tab => {
			if(tab.id === id) return false; // Excluir la pestaña que se eliminará
			if(tab.type === 'folder') {
				tab.contents = deleteTabById(id, tab.contents);
			}
			return true;
		});
	}
	$addTextTabButton.onclick = Explorer_addText;
	$addFolderTabButton.onclick = Explorer_addFolder;
	
	$editor.oninput = () => {
		saveTabContent()
		if(currentTabId !== null) {
			const tab = findTabById(parseInt(currentTabId), tabs);
			tab.content = $editor.value;
			Explorer_Save();
		}
		addCounterLine()
		UpdateCurrentLine()
		syncHighlighting()
		
		syncDebugHex()
	};
	$editor.onclick = () => {
	  addCounterLine()
	  UpdateCurrentLine()
	  syncHighlighting()
	}
	
	window.addCounterLine = function(){
	  UpdateCurrentLine()
	  const TEXT_DATA = $editor.DATA_TEXTAREA()
	  /* lineaCursor, columnaCursor, inSelection,
     charsSelected, textSelected, primerPalabra,
     mediaPalabra, textLine, linesSelected,
     posicionCursorAbsoluta */
	  
	  $editorCounterLine.innerHTML = ''
    $editor.value.split('\n').forEach((a,line)=>{
      
      let counter = ''
      if (TEXT_DATA.inSelection){
        if (TEXT_DATA.linesSelected.includes(line+1)){
          counter = `<span>${line+1}</span>\n`
        }
        else {
          counter = (line + 1) + '\n'
        }
      }
      else if (TEXT_DATA.lineaCursor == line+1){
        counter = `<span>${line+1}</span>\n`
      }
      else {
        counter = (line+1)+'\n'
      }
      
      $editorCounterLine.innerHTML += counter
    })
	}
	
	
	Items_render();
	if(currentTabId) {
	  Item_Select(parseInt(currentTabId))
	  if (doesTabExist(currentTabId, tabs)){
		  toggleMenu()
	  }
	} else if(tabs.length > 0) {
		Item_Select(tabs[0].id);
	}

	function countTextFiles(tabList) {
		let count = 0;
		for(let tab of tabList) {
			if(tab.type === 'text') {
				count++;
			}
			if(tab.type === 'folder' && tab.contents) {
				count += countTextFiles(tab.contents); // Recursión para contar archivos dentro de carpetas
			}
		}
		return count;
	}
	updatePlaceholder()
	addCounterLine()
	syncHighlighting()
});









// ------- Tostadas








let toastId = 0;

function showToast(MENSAJE, _clase = '...', _duracion = 2000) {
  const $toast_container = $('#toast-container');
  const $toast = document.createElement('div');
  const id = toastId++;
  
  $toast.classList.add('toast');
  $toast.classList.add(_clase);
  $toast.setAttribute('id', `toast-${id}`);
  $toast.innerHTML = `
  <div class="toast-content">
    <span>${MENSAJE}</span>
    <span class="toast-close" onclick="closeToast(${id})">&times;</span>
    <div class="toast-progress ${_clase}" style='animation: progress ${_duracion}ms linear;'></div>
  </div>
  `;
  
  // Auto hide after 2 seconds
  if (_clase == 'fail') vibrateNavigator(200);
  if (_clase == '...') vibrateNavigator(50);
  setTimeout(() => closeToast(id), _duracion);
  
  $toast_container.appendChild($toast);
  
  // Swipe to remove (PC & Mobile)
  let startX = 0;
  $toast.addEventListener('touchstart', (e) => startX = e.touches[0].clientX);
  $toast.addEventListener('touchmove', (e) => handleSwipe(e, id, startX));
  $toast.addEventListener('mousedown', (e) => startX = e.clientX);
  $toast.addEventListener('mousemove', (e) => handleSwipe(e, id, startX));
}
  
 function handleSwipe(e, id, startX) {
  const $toast = $(`#toast-${id}`);
  const currentX = e.touches ? e.touches[0].clientX : e.clientX;
  const deltaX = currentX - startX;
  
  if (Math.abs(deltaX) > 50) {
    $toast.style.transform = `translateX(${deltaX}px)`;
  }
  
  if (Math.abs(deltaX) > 100) {
    closeToast(id);
  }
}

window.closeToast = function(id) {
  const $toast = $(`#toast-${id}`);
  if ($toast) {
    $toast.classList.add('hide');
    setTimeout(() => {
      if ($toast && $toast.parentElement) {
        $toast.parentElement.removeChild($toast);
      }
    }, 300);
  }
}







// --------- MODAL







let modalResolve; // Para devolver valores cuando se acepta o cancela

  let $modal = new$('div')
  $modal.id = 'modal'
  
  $modal.innerHTML = 
     `<div class="modal-content">
              <span id="modal-title" class="modal-title"></span>
              <p id="modal-message" class="modal-message"></p>
              
              <!-- Input opcional -->
              <input id="modal-input" class="modal-input" type="text" style="display: none;" />
  
              <div class="modal-buttons">
                  <button id="modal-accept" class="modal-button" onclick="acceptModal()">Aceptar</button>
                  <button id="modal-cancel" class="modal-button" onclick="cancelModal()">Cancelar</button>
              </div>
          </div>`


function openModal(title, message, inputType = null, acceptText = 'ok', cancelText = 'nop', defaultValue = '') {
  const modal = $('#modal');
  const modalTitle = $('#modal-title');
  const modalMessage = $('#modal-message');
  const modalInput = $('#modal-input');
  const modalAccept = $('#modal-accept');
  const modalCancel = $('#modal-cancel');

  // Configurar título, mensaje y botones
  modalTitle.textContent = title;
  modalMessage.innerHTML = message;
  modalAccept.textContent = acceptText;
  modalCancel.textContent = cancelText;

  // Si hay un tipo de entrada (texto o número)
  if (inputType) {
    modalInput.style.display = 'block';
    modalInput.type = inputType;
    modalInput.value = defaultValue; // Cargar valor predeterminado
    
  } else {
    modalInput.style.display = 'none';
  }

  // Mostrar el modal con animación
  modal.style.display = 'flex'; // Asegurar que se vea
  setTimeout(() => {
    modal.classList.add('modal-show');
    modalInput.focus();
    modal.classList.remove('modal-hide');
  }, 10); // Pequeña demora para que aplique la animación correctamente

  return new Promise((resolve) => {
    modalResolve = resolve;
  });
}

window.acceptModal = function() {
  const modalInput = $('#modal-input');
  const inputValue = modalInput.style.display === 'block' ? modalInput.value : true;

  closeModal(); // Cerrar el modal después de aceptar
  
  (""+inputValue).trim() != ''
    ? modalResolve(inputValue) // Devuelve el valor del input o null si no hay input
    : modalResolve(null) // Devuelve el valor del input o null si no hay input
}

window.cancelModal = function () {
  closeModal(); // Cerrar el modal después de cancelar
  modalResolve(null); // Devuelve null y cancelado
}

function closeModal() {
  const $modal = $('#modal');
  $modal.classList.add('modal-hide');
  $modal.classList.remove('modal-show');

  // Después de la animación, ocultar el modal
  setTimeout(() => {
    $modal.style.display = 'none';
  }, 330); // Tiempo que dura la animación en CSS (0.3s)
}








// ------- Asistente para Movil






const KEYS_MOBILE = ["\t","&","@","$","#","=","_",'""',"''",'()','{}','[]']

let $keys = $('key',$('#keys-mobile')) 

$keys.forEach((e, i)=> {
  e.onclick = ()=>{
    $editor.focus();
      document.execCommand("insertText",false,KEYS_MOBILE[i])
      if (i > 6) {
        $editor.selectionStart--
        $editor.selectionEnd=$editor.selectionStart
      }
  }
})

let clipPaste = ""

$("[cmd]", e => {
  let x = e.gAttr("cmd")
  e.title=x
  if (x == "paste") {
    e.onclick = () =>{
      $editor.focus();
      document.execCommand("insertText",false,clipPaste);
    }
  } else if (x == "copy" || x == "cut") {
    e.onclick = (y,z)=>{
      $editor.focus();
      clipPaste = $editor.getTextSelected()
      if (clipPaste == ''){
        const dataline = $editor.DATA_TEXTAREA()
        
        clipPaste = dataline.textLine;
        showToast(`copied to clipboard`,null,1000);
        if (x == "cut") {
          $editor.clearLine(dataline.lineaCursor) 
          $editor.setCursorFull(dataline.lineaCursor,0)
        }
      }
      document.execCommand(x);
    }
  } else {
    const f = ()=>{
      $editor.focus();
      document.execCommand(x);
    }
    e.onclick = f
  }
})

let ctrlPressed = false
$("[key]", e => {
  let x = e.gAttr("key")
  e.title=x
  if (x == "all") {
    e.onclick = () =>{
      $editor.focus();
      $editor.selectionStart = 0
      $editor.selectionEnd = $editor.value.length
      UpdateCurrentLine()
    }
  }
  if (x == "left") {
    e.onclick = () =>{
      $editor.focus();
      $editor.selectionStart--
      $editor.selectionEnd--
      UpdateCurrentLine()
      addCounterLine()
    }
  }
  if (x == "right") {
    e.onclick = () =>{
      $editor.focus();
      $editor.selectionEnd++
      $editor.selectionStart++
      UpdateCurrentLine()
      addCounterLine()
    }
  }
  if (x == "up") {
    e.onclick = () =>{
      $editor.focus();
      let {columnaCursor, lineaCursor} = $editor.DATA_TEXTAREA()
      $editor.setCursorFull(lineaCursor-1,columnaCursor)
    
      UpdateCurrentLine()
      addCounterLine()
    }
  }
  if (x == "down") {
    e.onclick = () =>{
      $editor.focus();
      let {columnaCursor, lineaCursor} = $editor.DATA_TEXTAREA()
      $editor.setCursorFull(lineaCursor+1,columnaCursor)
    
      UpdateCurrentLine()
      addCounterLine()
    }
  }
  if (x == "ctrl") {
    e.onclick = () =>{
      $editor.focus();
      ctrlPressed = !ctrlPressed
    }
  }
})



let textData
function UpdateCurrentLine() {
  textData = $editor.DATA_TEXTAREA()
  /* lineaCursor, columnaCursor, inSelection,
     charsSelected, textSelected, primerPalabra,
     mediaPalabra, textLine, linesSelected,
     posicionCursorAbsoluta */
  if (textData.inSelection) {
    $('#current_line').innerText =
      '[' + textData.charsSelected + '] '
      
      if (textData.linesSelected.length > 1){
      $('#current_line').innerText += 
        ' Ln '+ textData.linesSelected.first() + '-' + textData.linesSelected.last()
      }
  } else {
    $('#current_line').innerText =
      'Ln '+textData.lineaCursor + ', Col ' + textData.columnaCursor
  }
}
function hasScrollBar(e) {
    return {
        vertical: e.scrollHeight > e.clientHeight,
        horizontal: e.scrollWidth > e.clientWidth
    };
}

$editor.onscroll = () =>{
	//$('#PREVIEW').scrollTop = $editor.scrollTop
	$("#editor-counterLine").scrollTop = $editor.scrollTop
}









//     MENU CONTEXTUAL



$editor.addEventListener('contextmenu', function(e) {
  
  if (e.target != $editor) return;
  
  e.preventDefault();
  const contextMenu = document.getElementById('context-menu');

  // Coordenadas iniciales del cursor
  let posX = e.clientX;
  let posY = e.clientY + 7;
  
  contextMenu.style.top = `0px`;
  contextMenu.style.left = `0px`;
  contextMenu.classList.add('d-flex')

  contextMenu.style.opacity = '0';

  // Obtenemos el tamaño del menú contextual
  const menuWidth = contextMenu.offsetWidth;
  const menuHeight = contextMenu.offsetHeight;

  // Tamaño de la ventana
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // Definimos un umbral de porcentaje, por ejemplo, si más del 50% del menú se sale, corregimos la posición
  const threshold = 1.0; // 50%

  // Recolocación si más del umbral del menú queda fuera del borde derecho
  if (windowWidth - posX < menuWidth * threshold) {
    posX = windowWidth - menuWidth;
  }

  // Recolocación si más del umbral del menú queda fuera del borde inferior
  if (windowHeight - posY < menuHeight * threshold) {
    posY = windowHeight - menuHeight;
  }

  // Establecemos la posición corregida del menú
  contextMenu.style.top = `${posY}px`;
  contextMenu.style.left = `${posX}px`;
  contextMenu.classList.add('d-flex')
  contextMenu.style.opacity = '1';
});

document.addEventListener('click', function() {
  const contextMenu = document.getElementById('context-menu');
  contextMenu.classList.remove('d-flex')
});






//        AUTO COMPLETADO






let cursorX = 0;
let cursorY = 0;
let suggestionEngineType = "fuzzy"; // Puede ser "exact" o "fuzzy"

// Debounce Function
function debounce(func, delay) {
    let debounceTimer;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
}

document.addEventListener("mousemove", function(event) {
    cursorX = event.clientX;
    cursorY = event.clientY;
});

const editor = document.getElementById("editor");
const autocomplete = document.getElementById("autocomplete");
const autocompleteMenu = document.getElementById("autocomplete-menu");


let lastPosition = { top: 0, left: 0 }; // Para recordar la última posición del autocompletado

$editor.addEventListener("click", () => {
    autocomplete.classList.add("hidden");
});

function isCursorInString(text, cursorPosition) {
  let enString = false,
    elString = '';
  
  for (let i=0; i < cursorPosition; i++){
    if (/['"`]/.test(text[i])){
      if (elString == ''){
        elString = enString ? text[i] : '';
        enString = !enString
      }
      else if (text[i] == elString){
        elString = ''
        enString = !enString
      }
    }
  }
  
  return enString
}

let eventoForzado = false

$editor.addEventListener("input", debounce(function(event) {
  const cursorPosition = $editor.selectionStart;

  // Verificar si el cursor está dentro de un string
  if (isCursorInString($editor.value, cursorPosition)) {
    return; // No mostrar el autocompletado si estamos dentro de un string
  }

  const textBeforeCursor = $editor.value.substring(0, cursorPosition);
  const lastWord = textBeforeCursor.split(/[^\w$@#\.]/).pop();
  const classNameMatch = lastWord.match(/^(\w+)\.(\w*)$/); // Detectar "objeto."

  let suggestions = [];

  if (classNameMatch) {
    const classNameInput = classNameMatch[1].toLowerCase(); // Convertir a minúsculas
    const partialMember = classNameMatch[2].toLowerCase();

    // Verificar si es un objeto de enumeración (ignorando mayúsculas/minúsculas)
    const enumName = Object.keys(enums).find(enumKey => enumKey.toLowerCase() === classNameInput);
    
    if (enumName) {
      suggestions = Object.keys(enums[enumName])
        .filter(enumKey => suggestionMatches(enumKey.toLowerCase(), partialMember))
        .map(enumKey => ({
          type: 'enum',
          value: enumKey,
          extraInfo: `= ${enums[enumName][enumKey]}`
        }));
    } else {
      // Verificar si es una clase (ignorando mayúsculas/minúsculas)
      const className = classNames.find(name => name.toLowerCase() === classNameInput);
      if (className && classMembers[className]) {
        suggestions = classMembers[className]
          .filter(member => suggestionMatches(member.name.toLowerCase(), partialMember))
          .map(member => ({
            type: 'property',
            value: member.name,
            extraInfo: `(${member.params || ''})${member.returns ? ' : ' + member.returns : ''}
            ${
              (!member.name.startsWith('Is')
              &&!member.name.startsWith('Get')
              &&!member.name.startsWith('Set')
              &&!member.name.startsWith('Create'))
              ? member.methods || '' :''
            }`
          }));
      }
    }

  } else if (
    (lastWord.length >= 2 && !/^\d/m.test(lastWord))
    || eventoForzado) {
    const lowerLastWord = lastWord.toLowerCase();
    // Agregar snippets a las sugerencias
    suggestions.push(
      ...Object.keys(snippets)
      .filter(snippet => suggestionMatches(snippet.toLowerCase(), lowerLastWord))
      .map(snippet => ({
        type: 'snippet',
        value: snippet,
        extraInfo: '[snippet]'
      }))
    );
    
    
      suggestions.push(
        ...constants
        .filter(constant => suggestionMatches(constant.name.toLowerCase(), lowerLastWord))
        .map(constant => ({
          type: 'constant',
          value: constant.name,
          extraInfo: `= ${constant.value}`
        }))
      )


    // Sugerencias de clases, constantes y enumeraciones
    suggestions.push(
      ...classNames
      .filter(className => suggestionMatches(className.toLowerCase(), lowerLastWord))
      .map(className => ({ type: 'class', value: className })),
      ...Object.keys(enums)
      .filter(enumName => suggestionMatches(enumName.toLowerCase(), lowerLastWord))
      .map(enumName => ({
        type: 'enumObject',
        value: enumName,
        extraInfo: '[enum]'
      }))
    );
    
    if (!eventoForzado){
      suggestions.push(
        ...models
        .filter(model => suggestionMatches(model.name.toLowerCase(), lowerLastWord))
        .map(model => ({
          type: 'model',
          value: model.name,
          extraInfo: `= ${model.value}`
        }))
      )
      
      for (const [category, words] of Object.entries(keywords)) {
        suggestions.push(
          ...words
          .filter(word => suggestionMatches(word.toLowerCase(), lowerLastWord))
          .map(word => ({
            type: 'keyword',
            value: category == 'opcode' ?
              word.r(/.+=/, '') : word,
            extraInfo: category == 'opcode' ?
              `[${word.r(/=.+/,'')}]` : `[${category}]`
          }))
        );
      }
    }
              //`
    updateAutocompletePositionWithCursor();
  }

  if (suggestions.length > 0) {
    updateAutocompleteMenu(suggestions, lastWord, classNameMatch);
  } else {
    autocomplete.classList.add("hidden")
  }
  eventoForzado = false
}, 250));


function suggestionMatches(word, query) {
  if (suggestionEngineType === "exact") {
    // Motor de búsqueda exacta (empieza con la palabra)
    return word.startsWith(query);
  } else if (suggestionEngineType === "fuzzy") {
    // Motor de búsqueda "fuzzy" (contiene la palabra en cualquier parte)
    return word.includes(query);
  }
  return false;
}

function setSuggestionEngineType(type) {
  if (["exact", "fuzzy"].includes(type)) {
    suggestionEngineType = type;
  }
}

document.getElementById("engineSelector").addEventListener("change", function(event) {
  setSuggestionEngineType(event.target.value);
});

function updateAutocompleteMenu(suggestions, lastWord, classNameMatch) {
  autocompleteMenu.innerHTML = ""; // Limpiar las sugerencias previas
 
 
 // para evitar que el hilo principal se congele durante mucho tiempo, limitamos la cantidad de sugerencias.
 if (eventoForzado == false){
   if (suggestions.length > 100) {
     suggestions.length = 100
   }
 } else {
   if (suggestions.length > 380) {
     suggestions.length = 380
   }
 }
  
  suggestions.forEach(({ type, value, extraInfo }) => {
    const suggestionItem = document.createElement("li");
    suggestionItem.classList.add("suggestion-item");
    suggestionItem.textContent = value;

    const typeIndicator = document.createElement("span");
    typeIndicator.classList.add("type-indicator");

    const extraInfoElement = document.createElement("span");
    extraInfoElement.classList.add("extra-info");
    extraInfoElement.style.float = "right";

    // Estiliza las sugerencias según su tipo y muestra la información extra
    suggestionItem.classList.add(type);

    switch (type) {
      case 'keyword':
        typeIndicator.textContent = "λ";
        extraInfoElement.textContent = extraInfo || ""; // Mostrar la categoría si existe
        // Agregar una clase personalizada según la categoría
        const keywordCategory = extraInfo?.replace(/\[|\]/g, ""); // Quitar corchetes de la categoría
        if (keywordCategory) {
          suggestionItem.classList.add(keywordCategory.toLowerCase());
          switch (keywordCategory){
            case 'label':
              typeIndicator.textContent = "⌫"
              break;
            case 'var':
              typeIndicator.textContent = "X"
              break;
          }
        }
        break;
      case 'class':
        typeIndicator.textContent = "⌂";
        extraInfoElement.textContent = "[class]";
        break;
      case 'property':
        typeIndicator.textContent = "ƒ";
        extraInfoElement.textContent = extraInfo || "";
        // Mostrar info si existe
        extraInfoElement.style.float = "";
        break;
      case 'constant':
        typeIndicator.textContent = "π";
        extraInfoElement.textContent = extraInfo || ""; // Mostrar el valor si existe
        suggestionItem.classList.add(
          /["']/.test(extraInfo) ? "strings"
          : /[\$\@\&]/.test(extraInfo) ? "var" : "number");
        break;
      case 'model':
        typeIndicator.textContent = "M";
        extraInfoElement.textContent = extraInfo || ""; // Mostrar el valor si existe
        suggestionItem.classList.add("number");
        break;
      case 'snippet':
        typeIndicator.textContent = "§";
        extraInfoElement.textContent = extraInfo || ""; // Mostrar info si existe
        break;
      case 'enumObject':
        typeIndicator.textContent = "⧮";
        extraInfoElement.textContent = "[enum]";
        break;
      case 'enum':
        typeIndicator.textContent = "⧰";
        extraInfoElement.textContent = extraInfo || ""; // Mostrar el valor de la enumeración
        suggestionItem.classList.add(/["']/.test(extraInfo) ? "string" : "number");
        break;
    }

    suggestionItem.insertAdjacentElement("afterbegin", typeIndicator);
    suggestionItem.insertAdjacentElement("beforeend", extraInfoElement);
    suggestionItem.addEventListener("click", () => {
      completeWord(value, lastWord, classNameMatch, type, extraInfo);
    });
    autocompleteMenu.appendChild(suggestionItem);
  });

  autocomplete.classList.remove("hidden");
}

function completeWord(suggestion, lastWord, classNameMatch, type, extraInfo) {
  const cursorPosition = $editor.selectionStart;
  let textBeforeCursor = $editor.value.substring(0, cursorPosition - lastWord.length);
  const textAfterCursor = $editor.value.substring(cursorPosition);

  // Si es una sugerencia de miembro de clase, preservamos la clase y el punto
  if (classNameMatch) {
    textBeforeCursor += classNameMatch[1] + '.';
  } else if (classNames.includes(suggestion) || type === 'enumObject') {
    suggestion += '.'; // Añadir el punto si es un objeto de enumeración o una clase
  }

  // Verificar si el snippet existe en la lista
  if (snippets[suggestion]) {
    suggestion = snippets[suggestion]; // Reemplazar la sugerencia por el snippet correspondiente
  }

  // Eliminar el marcador `|` en snippets y calcular la posición del cursor
  let cursorIndex = suggestion.indexOf('|');
  if (cursorIndex !== -1) {
    suggestion = suggestion.replace('|', ''); // Remover el marcador `|`
  } else {
    cursorIndex = suggestion.length; // Si no hay marcador, el cursor va al final
  }

  // Verificar si hay parámetros en la sugerencia (para métodos)
  const hasParams = extraInfo && extraInfo.includes("(") && !extraInfo.includes("()");
  if (type === 'property' && hasParams) {
    suggestion += "()";
  }

  // Actualizar el contenido del textarea con la sugerencia seleccionada
  $editor.value = textBeforeCursor + suggestion + textAfterCursor;

  // Determinar la nueva posición del cursor
  let newCursorPosition = textBeforeCursor.length + cursorIndex;
  if (type === 'property' && hasParams) {
    newCursorPosition = textBeforeCursor.length + suggestion.length - 1; // Entre paréntesis
  }

  // Posicionar el cursor y enfocar el $editor
  $editor.setSelectionRange(newCursorPosition, newCursorPosition);
  $editor.focus();
  autocomplete.classList.add("hidden");

  // Si se autocompleta un objeto de enumeración, mostrar sus valores
  if (type === 'enumObject' && enums[suggestion.replace('.', '')]) {
    const enumSuggestions = Object.keys(enums[suggestion.replace('.', '')]).map(enumKey => ({
      type: 'enum',
      value: enumKey,
      extraInfo: `= ${enums[suggestion.replace('.', '')][enumKey]}`
    }));
    setTimeout(() => {
      updateAutocompleteMenu(enumSuggestions, '', null);
    }, 0);
  }

  // Si se autocompleta una clase, volvemos a mostrar sugerencias para sus miembros
  if (classNames.includes(suggestion.replace('.', ''))) {
    setTimeout(() => {
      const simulatedEvent = new Event("input");
      $editor.dispatchEvent(simulatedEvent);
    }, 0);
  }
  addCounterLine()
  syncHighlighting() // resalta el codigo
  Explorer_Save() // guarda el codigo
  saveTabContent()
  
  syncDebugHex()
}

function updateAutocompletePositionWithCursor() {
    if (!autocomplete.classList.contains("hidden")){
      cursorX = lastPosition.left
      cursorY = lastPosition.top
    }
    autocomplete.classList.remove("hidden");
    
    let posX = cursorX;
    let posY = cursorY; // Le damos un margen para evitar superposición

    const menuWidth = autocomplete.offsetWidth;
    const menuHeight = autocomplete.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Ajuste si el menú se sale del borde derecho
    if (posX + menuWidth > windowWidth) {
        posX = windowWidth - menuWidth;
    }

    // Ajuste si el menú se sale del borde inferior
    if (posY + menuHeight > windowHeight) {
        posY = windowHeight - menuHeight;
    }

    autocomplete.style.top = `${posY}px`;
    autocomplete.style.left = `${posX}px`;

    // Guardar la posición actual
    lastPosition = { left: posX, top: posY };
}

function updateAutocompletePosition(left, top) {
    autocomplete.style.left = `${left}px`;
    autocomplete.style.top = `${top}px`;
}

$editor.addEventListener("click", (e) => {
    if (e.target !== $editor) {
        autocomplete.classList.add("hidden");
    }
});




// PARA ARRASTRAR EL AUTOCOMPLETADO




let isDragging = false;
let offsetX = 0;
let offsetY = 0;
const autocompleteContainer = document.getElementById("autocomplete");
const dragArea = document.getElementById("autocomplete-title");

if (localStorage.getItem("autocompletePosition")) {
  const savedPosition = JSON.parse(localStorage.getItem("autocompletePosition"));
  autocompleteContainer.style.left = `${savedPosition.left}px`;
  autocompleteContainer.style.top = `${savedPosition.top}px`;
}

// Función para iniciar el arrastre
function startDrag(event) {
  isDragging = true;
  const touch = event.touches ? event.touches[0] : event;
  offsetX = touch.clientX - autocompleteContainer.offsetLeft;
  offsetY = touch.clientY - autocompleteContainer.offsetTop;

  autocompleteContainer.classList.add("dragging");
}

// Función para arrastrar el contenedor con optimización
function drag(event) {
  addCounterLine()
  if (!isDragging) return;

  const touch = event.touches ? event.touches[0] : event;
  let posX = touch.clientX - offsetX;
  let posY = touch.clientY - offsetY;

  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const menuWidth = autocompleteContainer.offsetWidth;
  const menuHeight = autocompleteContainer.offsetHeight;

  posX = Math.max(0, Math.min(posX, windowWidth - menuWidth));
  posY = Math.max(0, Math.min(posY, windowHeight - menuHeight));

  lastPosition = { left: posX, top: posY };

  // Usamos requestAnimationFrame para mejorar la eficiencia
  requestAnimationFrame(() => {
    autocompleteContainer.style.left = `${posX}px`;
    autocompleteContainer.style.top = `${posY}px`;
  });
}

// Función para detener el arrastre
function stopDrag() {
  if (isDragging) {
    isDragging = false;
    autocompleteContainer.classList.remove("dragging");
    localStorage.setItem("autocompletePosition", JSON.stringify(lastPosition));
  }
}

// Eventos de arrastre para mouse
dragArea.addEventListener("mousedown", startDrag);
document.addEventListener("mousemove", drag);
document.addEventListener("mouseup", stopDrag);

// Eventos de arrastre para touch
dragArea.addEventListener("touchstart", startDrag);
document.addEventListener("touchmove", drag);
document.addEventListener("touchend", stopDrag);







//    AUTO CIERRES




let codigoOriginal = $editor.value
let codigoModificado = codigoOriginal

let dondeEstaba = {}
let charAfterCaret

$editor.addEventListener("keydown", event => {
  dondeEstaba = $editor.DATA_TEXTAREA()
  charAfterCaret = $editor.value.charAt(dondeEstaba.posicionCursorAbsoluta)
})

$editor.addEventListener("keyup", event => {
  codigoOriginal = $editor.value
  let keyDown = $editor.value.substr($editor.selectionStart-1, 1).toLowerCase()
  
  if (codigoOriginal.length < codigoModificado.length){
    keyDown = 'backspace'
  }
  else if (codigoOriginal.length == 0 && codigoModificado.length == 0){
    keyDown = 'backspace'
  }
  else if (codigoOriginal.length == codigoModificado.length){
    keyDown = encontrarCaracterDiferente(
      codigoOriginal, codigoModificado
    )
  }
  else if (keyDown === ''){keyDown = 'backspace'}
  else if (keyDown === ' '){keyDown = 'space'}
  else if (keyDown === '\t'){keyDown = 'tab'}
  else if (keyDown === '\n'){keyDown = 'enter'}
  
  const pares = {
    '(':')',
    '{':'}',
    '[':']',
    '"':'"',
    '`':'`',
    "'":"'"
  }
  //textLength
  if (keyDown in pares){
    $editor.value = insertarCaracter($editor.value, pares[keyDown], $editor.selectionStart)
    $editor.selectionStart = dondeEstaba.posicionCursorAbsoluta +1
    $editor.selectionEnd = $editor.selectionStart
  }

  if (
    (keyDown == ']' && charAfterCaret == ']') ||
    (keyDown == ')' && charAfterCaret == ')') ||
    (keyDown == '}' && charAfterCaret == '}')
  ) {
    $editor.value = eliminarCaracter($editor.value, dondeEstaba.posicionCursorAbsoluta)
    $editor.selectionStart = dondeEstaba.posicionCursorAbsoluta + 1
    $editor.selectionEnd = $editor.selectionStart
  }
  
  if (
    (keyDown == '"' && charAfterCaret == '"') ||
    (keyDown == "'" && charAfterCaret == "'") ||
    (keyDown == '`' && charAfterCaret == '`')
  ) {
    $editor.value = eliminarCaracter($editor.value, dondeEstaba.posicionCursorAbsoluta)
    $editor.value = eliminarCaracter($editor.value, dondeEstaba.posicionCursorAbsoluta)
    $editor.selectionStart = dondeEstaba.posicionCursorAbsoluta + 1
    $editor.selectionEnd = $editor.selectionStart
  }
  
  codigoModificado = $editor.value
})

function eliminarCaracter(cadena, posicion) {
    if (posicion < 0 || posicion >= cadena.length) {
        return cadena; // Si la posición es inválida, retorna la cadena original
    }
    return cadena.slice(0, posicion) + cadena.slice(posicion + 1);
}
function insertarCaracter(cadena, caracter, posicion) {
    if (posicion > cadena.length) {
        return cadena + caracter;
    }
    return cadena.slice(0, posicion) + caracter + cadena.slice(posicion);
}
function encontrarCaracterDiferente(str2, str1) {
    for (let i = 0; i < str1.length; i++) {
        if (str1[i] !== str2[i]) {
            return str1[i];
        }
    }
    // Si no se encuentra ninguna diferencia, retorna null
    return null;
}






// RESALTADOR DE SINTAXIS


NP.entre = function(min, max){
  return this >= min && this <= max ? true : false
}

const keywordPattern = 
  new RegExp("\\b(" + keywords.syntax.join("|")+ ")\\b", "gi");


let keysHigh;
let classNamesReg;
let constantes;
let CONSTANTS

const syntaxHighlight = (code, exception = $editor) => {

  const span = {
		start : "<span class=",
		end : ">$1<\/span>"
	}

	const enter = {
		comments  : span.start + "comment"   + span.end,
		numbers   : span.start + "number"    + span.end,
		variables : span.start + "var"  + span.end,
		opcodes   : span.start + "opcode"    + span.end,
		directives: span.start + "directive" + span.end,
		commands  : span.start + "property"   + span.end,
		classes   : span.start + "class"    + span.end
	}

  let lineaActual = $editor.DATA_TEXTAREA().lineaCursor
  
  code = code.split('\n').map((text,index) =>{
  
  if (exception != $editor || (index+1).entre(lineaActual-16, lineaActual+14)){
  // Escapa HTML
    text = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&apos;")
    .replace(/"/g, "&quot;")
    .replace(/\//g, "&sol;")
    

	text = text
	//Comentarios 
	.r(/(&sol;&sol;([^\n]*)|&sol;\*[^\/]*?(\*&sol;))/, enter.comments)
	
	.r(/(\{([^\{\}]*(\})?)?)/g, enter => {
	  return enter[1] == '$'
	    ? '<span class=directive>'+enter+'</span>'
	    : '<span class=comment>'+enter+'</span>'
	})
	
	//Cadenas de texto
	.r(/(&quot;((?:\\|[^\\\n])+)&quot;|&apos;((?:\\|[^\\\n])+)&apos;|`((?:\\|[^`\\])*)`)/gi, match => {
	  match = match
	  .r(/\\([xX]\w{1,2}|\w|&apos;|&quot;|`)/g, "<span class=charScape>\\$1</span>")
	  return '<span class="strings">'+match+'</span>'
  })
	
	
	//Etiquetas
	.r(/([^\w]|^)([@:]\w+)/gm, "$1<span class=label>$2<\/span>")
	.r(/([^\w\.])(\w+)(\([^\n]*\))/g, "$1<span class=property>$2<\/span>$3")
	//Arreglos
	.r(/(\[)([\d+]*)(\])/g, "$1<span class=number>$2<\/span>$3")
	
	//Variables
	.r(/([ifvs]?\&amp;[0-9\-]+|(\x{00}|[ifsv])\$([\d\w]+)|timer(a|b|x|z)|\d+\@([ifsv])?)/gi, enter.variables)


	//Numeros
	.r(/(c?\#\w*|\d+([box.])\w+|\-?\.?\d[e\+\-_\d\.]*(fps|[smh])?)\b/gi, enter.numbers)
	
	.r(/(?!\#)(\W)(?!\$)([\d_]+)(?!\:|\@)([ifsv]?)\b/ig, '$1<span class=number>$2$3<\/span>')

	//Clases

	.r(/(\w+)\.(\w+)/gm, "<span class=class>$1</span>.<span class=property>$2</span>")
	.r(/(\!?)\.([\w]+)/g, "$1.<span class=property>$2</span>")
	.r(/(\$\w+|\d+\@)\.(\w+)/g, "$1.<span class=property>$2</span>")
	.r(/\.([0-9A-Z_a-z]+)\n/g,"." + enter.commands +"\n")


      // Palabras claves: sintaxis
      text = text.replace(keywordPattern, '<span class="keyword ">$1</span>');
  
	   text = text.r(constantes, enter => {
	     
	     let valor = CONSTANTS[enter.toUpperCase()]
	     let clase = /["']/.test(valor) ? "strings"
	     : /[\$\@\&]/.test(valor) ? "var"
	     : "number"
	     
	     return `<span class="${clase}">${enter}</span>`
	   });
	
      // Palabras claves: opcodes
      text = text.replace(keysHigh, '<span class="keyword">$1</span>');
  
      // Clases Reservadas
      text = text.replace(classNamesReg, '<span class="class">$1</span>');
  }
  return text
  }).join('<br/>')
  
  return code
};

// Sincroniza el contenido del $editor con el resaltado
function syncHighlighting(){
    const text = $editor.value;
    $highlighting.innerHTML = syntaxHighlight(text) + "\n"; // Añade \n para mantener la altura en textarea vacío
    $highlighting.scrollTop = $editor.scrollTop; // Sincroniza el scroll
};

function syncDebugHex(){
  if (!$debugHex.class('?d-none'))
  try {
    $debugHex.innerText =
      importFileInFile().Translate(true, true);
    $('#error').style.display = 'none'
  } catch (error) {
    $('#error').style.display = 'flex'
    $('#error').innerText = error.message
    console.error(error.message)
  }
}

$editor.addEventListener("click", syncHighlighting);
$editor.addEventListener("scroll", () => {
    $highlighting.scrollTop = $editor.scrollTop;
});

// Llamada inicial para el resaltado
syncHighlighting();

const openAutocompleteBtn = document.getElementById("openAutocompleteBtn");

openAutocompleteBtn.addEventListener("click", function() {
  eventoForzado = true
  const eventoClick = new Event('input');
  $editor.dispatchEvent(eventoClick);
  $editor.focus();
  // Mostrar el autocompletado en la última posición conocida
    //autocomplete.classList.remove("hidden");
    
});




// PILA DE DATOS PARA TRABAJAR

const DOWNLOADED = {
  ENUMS:0,
  KEYWORDS:1,
  CLASSES_SB:2,
  CLASSES_MD:3,
  VARIABLES:4,
  CONSTANTS:5,
  MODELS:6,
  JSON_VERSION:7,
  JSON_DATA:8
}

/**/
DATA_DOWNLOADED = await LSgetCollection(
 [
   // enums
   ['https://library.sannybuilder.com/assets/sa/enums.txt',
   './data/enums.txt'],
   
   // Keyword
   ['https://raw.githubusercontent.com/MatiDragon-YT/data/master/sa_cp/keywords.txt',
   './data/keywords.txt'],
   
   // clases de sannybuilder
   ['https://library.sannybuilder.com/assets/sa/classes.db',
   './data/classes.db'],
   
   // clases de matidragon
   ['./data/classes.db',
   './data/classesCP.db'],
   
   // variable 
   ['./data/CustomVariables.ini'],
   
   // constante
   ['./data/constants.txt'],
   
   // modelos
   ['./data/models.ide'],
   
   // version json sa
   ['https://raw.githubusercontent.com/sannybuilder/library/master/sa/version.txt',
   'version_sbl'],
   
   // file json sa
   ['https://raw.githubusercontent.com/sannybuilder/library/master/sa/sa.json',
   './data/sa.json']
 ],
  $('#porcentaje'), // Elemento HTML para mostrar progreso
  $('#carga')
);

enums = autocompled_enumsGenerator(
  DATA_DOWNLOADED[DOWNLOADED.ENUMS]
)

keywords.opcode = autocompled_keywordsGenerator(
  DATA_DOWNLOADED[DOWNLOADED.KEYWORDS]
)

models = autocompled_modelsConstants(
  DATA_DOWNLOADED[DOWNLOADED.MODELS]
)

DATA_DOWNLOADED[DOWNLOADED.CONSTANTS]
	.r(/(^const|end$)/gm, '')
	.r(/\r/g, '\n')
	.r(/[\x20\t]+\n/g, '\n')
	.r(/^[\x20\t]+/gm, '')
	.r(/(\x20+)?=(\x20+)?/g, '=')
	.split('\n')
	.clear()
  .forEach(e => {
    const [constante, valor] = e.split('=')
    constants.push({name: constante, value: valor})
  })

function autocompled_enumsGenerator(source) {
    // Eliminamos los saltos de línea y espacios innecesarios
    let str = source.replace(/\n\n/g, '').trim();

    // Dividimos el string en las secciones "enum"
    const enumSections = str.split('enum ');

    // Creamos un objeto para almacenar los resultados
    const resultado = {};

    // Iteramos sobre cada sección "enum"
    for (const section of enumSections) {
        if (section) {
            // Extraemos el nombre del enum y las opciones
            const [enumName, ...options] = section.rA(',', '\n').split(/\s+/);

            // Creamos un objeto para almacenar las opciones
            const enumObj = {};
            let nIndex = 0
            
            // Asignamos valores a las opciones
            options.forEach((option, index) => {
              if(option != 'end' && !(options.length-1==index)){
                if (option.includes('=')) {
                    let [name, value] = option.split('=');
                    if (!/("|')/.test(value)) {
                      value = Number(value)
                    }
                    enumObj[name.toUpperCase()] = value
                    nIndex = value
                } else {
                 if(typeof nIndex == "number"){
                  enumObj[option.toUpperCase()] = ++nIndex
                 }else{
                  enumObj[option.toUpperCase()] = option
                 }
                }
              }
            });

            // Agregamos el enum al resultado
            resultado[enumName.toUpperCase()] = enumObj
        }
    }
    return resultado;
}

function autocompled_keywordsGenerator(inputText){
  let collection = []
  
  inputText.toLowerCase().split('\n').map(keyword => {
    keyword = keyword.trim()
  
    if (!keyword.startsWith(';')) {
      if (keyword != '') {
        collection.push(keyword)
      }
    }
  }).clear()
  
  return collection
}

keysHigh =
  new RegExp("\\b("
    + keywords.opcode
      .map(e => e.replace(/.+=/g, ''))
      .join("|")
    + ")\\b",
  "gi");

function autocompled_modelsConstants(inputText) {
  let collection = []
  
  inputText.toUpperCase().split('\n').map(model => {
    model = model.trim()
    
    let [id, name] = model.split(' ')
  
    collection.push({'name':'#'+name, 'value': id})
  }).clear()
  
  return collection
}



function classesDbToEnchantiIDE(txt){
  let addClass = false
  let currentClass = ''
  let classesTemp = {}
  
  txt = txt
  // Aquí se utiliza para eliminar comentarios de una sola línea que comienzan con ';'.
  .r(/;(.+)?$/gm, '')
  .r(/^\s*$/gm, '')
  .r(/^(\x20|\t)*/gm, '')
  .r(/\$begin|\$end/gi, input => {
    return input.toUpperCase()
  })
  .split('\n')
  .clear()   // .clear elimina líneas vacias
  .forEach(line => {
    line = line.trim()
    // Aquí se manejan las directivas que indican el comienzo y fin de la lista de clases y las definiciones de clases.
    
    if (line == '#CLASSESLIST'){
      addClass = true;
    }
    else if (line == '#CLASSES') {
      addClass = false;
    }
    else if (line == '#EOF'){
      addClass = false;
    }
    else {
      // Si estamos en la sección de lista de clases, se crea un nuevo objeto para cada clase.
      if (addClass == true) {
        classesTemp[line] = []
      } else {
        // Si la línea comienza con '$', indica el comienzo o fin de una definición de clase.
        if (/^\$.+/m.test(line)) {
          if (line != '$BEGIN'
            && line != '$END'
          ){
            // Extrae el nombre de la clase actual.
            currentClass = line.match(/^\$(.+)/m)[1]
            if (classMembers[currentClass] == undefined)
              classMembers[currentClass] = [];
          }
        } else {
          // Si la línea comienza con '^', se trata de una propiedad con operaciones y códigos asociados.
          if (line.startsWith('^')) {
            // Extrae el nombre de la propiedad.
            let propertyName = line.match(/\^(.*?),\[/)[1];
            // Extrae los datos asociados con la propiedad y los divide en un array.
            let data = line.match(/\[(.*?)\]/g).map(e => e.replace(/[\[\]]/g, '').split(','));
          
            let parameters = line.match(/\((.*)\)/g)
            .map(e => e
                .r(/\("|"\)/g, '')
                .split('" "')
                .map(e => e
                  .r(/(.*):/,'')
                  .r(/(.*(sphere|car|actor|object|id|model|gxt|w|x|y|z))%(i|f|s|v)/i, '$1')
                  .r(/.*%h/, 'handle')
                  .r(/.*%i/, 'int')
                  .r(/.*%f/, 'float')
                  .r(/.*%s/, 'short')
                  .r(/.*%b/, 'bool')
                  .r(/.*%v/, 'long')
                )
                .join(', ').trim()
            )
          
            let miember = {}
            // Itera sobre cada conjunto de operaciones y códigos para la propiedad.
            miember = {
              name: propertyName,
              params: parameters,
              methods: []
            }
            data.forEach(prop => {
              let [opCode, mathCode, pos, type, helpCode] = prop;
              // Realiza acciones basadas en el código matemático.
              switch (mathCode) {
                case '==':
                  miember.methods.push('IS')
                  break;
                case '=':
                  if (pos === '1') {
                    miember.methods.push('SET')
                  } else if (pos === '2') {
                    miember.methods.push('GET')
                  }
                  break;
                case '+=':
                  miember.methods.push('ADD')
                  break;
                case '>=':
                  miember.methods.push('BIG')
                  break;
                  // Se pueden agregar más casos según sea necesario.
              }
              
            });
            miember.methods = '<'+(miember.methods.join(','))+'>'
            
            classMembers[currentClass].push(miember)
          }
          // Si la línea contiene comas, se trata de una propiedad simple con un valor asociado.
          else if (/([^,]+),([^,]+)/.test(line)){
            // Extrae la clave y el valor de la propiedad.
            let temp =
              line.match(/([^,]+),([^,]+).+(\(.*\))/)
              


            // Crea un objeto temporal para la propiedad.
            let miember = {
              name: temp[1],
              params: temp[3]
                .r(/\("|"\)/g, '')
                .split('" "')
                .map(e => e
                  .r(/(.*):/,'')
                  .r(/(.*(sphere|car|actor|object|id|model|gxt|w|x|y|z))%(i|f|s|v)/i, '$1')
                  .r(/.*%h/, 'handle')
                  .r(/.*%i/, 'int')
                  .r(/.*%f/, 'float')
                  .r(/.*%s/, 'short')
                  .r(/.*%b/, 'bool')
                  .r(/.*%v/, 'long')
                )
                .join(', ').trim()
            }

            // Combina la propiedad con la clase actual.
            if (currentClass in classMembers == false){
              classMembers[currentClass] = [];
            }
              
                
            classMembers[currentClass].push(miember)
                
          }
        }
      }
    }
  })
  return classMembers
}


classesDbToEnchantiIDE(DATA_DOWNLOADED[2])
classesDbToEnchantiIDE(DATA_DOWNLOADED[3])
classNames = Object.keys(classMembers);
classNamesReg =
  new RegExp("\\b(" + classNames.join("|") + ")\\b", "gi");
  
  
  
  
  
  
  
  
  
  
  
  
  
  

  
  
  
  
  
  
  
  
  
//         PROCESOS DEL COMPILADOR DE MATIDRAGON





/*
# SCM: State Machine Control
(Maquina de Estados con Control)


## Formato de Instrucciones SCM:

Las instrucciones SCM son operaciones individuales en un archivo SCM, compuestas por un opcode y argumentos. Se ejecutan cuando se corre el script y se usan para cambiar lo que ocurre en el juego.

```
SHAKE_CAM 150
WAIT 150
SHAKE_CAM 300
```

## Opcodes y Argumentos:

Los opcodes son típicamente de 2 bytes, pero solo usan 15 bits, reservando el bit más significativo para invertir el valor de retorno de una operación.

```
00AD: actor_is_live
80AD: actor_is_dead
```

Los argumentos pueden ser enteros, números de punto flotante, cadenas de texto, o referencias a arrays.

```
wait 123
printf "%.2f" 123.456
destroy_actor 23@(1@i,255i)
```


## Tipos de Argumentos:

Los tipos de argumentos incluyen enteros, números de punto flotante, cadenas de texto (cortas y largas), y arrays. Cada tipo tiene un código específico que determina cómo se debe tratar el valor.

*/

const TYPE_CODE = {
	TERMINAL_NULL		:'00',
	INT32				:'01', // 4 bytes : INT & LABEL
	GVAR				:'02', // 2 bytes
	LVAR				:'03', // 2 bytes
	INT8				:'04', // 1 byte : INT of -128 to 127
	INT16				:'05', // 2 bytes
	FLOAT32			:'06', // 4 bytes
	GVAR_ARRAY  :'07', // 6 bytes
	LVAR_ARRAY	:'08', // 6 bytes
	STRING8				      :'09', // 7 bytes + null
	GVAR_STRING8		    :'0A', // 2 bytes
	LVAR_STRING8	    	:'0B', // 2 bytes
	GVAR_ARRAY_STRING8	:'0C', // 2 bytes
	LVAR_ARRAY_STRING8	:'0D', // 2 bytea
	STRING_VARIABLE	  	:'0E', // 1 byte + str_length
	STRING16			      :'0F', // 15 bytes + null
	GVAR_STRING16		    :'10', // 2 bytes
	LVAR_STRING16		    :'11', // 2 bytea
	GVAR_ARRAY_STRING16	:'12', // 6 bytes
	LVAR_ARRAY_STRING16	:'13'  // 6 bytes
}
// Algo asi es como se traduce:
//
//               0001: wait 0
//              /            \
//          [0100]   [04     00]
//           \__/     \/      \/
//         opcode  type_code  value
//
// Todos los numeros se tienen que escribir en
//   big-endian, esto significa que el orden del los
//   hexadecimales van de izquierda a derecha.
//
//           X 00-01   -->   V 01-00
//
// Si el opcode tiene mas de un parametro, se pone
//   de nuevo el type y despues el value.
//
//               0004: 7@ = 15
//              /      |      \
//          [0400][03 0700][04 0F]
//           \__/   | \__/  |  \/
//          opcode  | lvar  |  int
//                type     type
//
// Hay opcodes a los que se les puede pasar diferentes
//   cantidades de parametros al mismo. A estos al
//   terminar de ingresar los parametros del opcode
//   es necesario que ingresemos un terminal-null (00)
//
//             0AD0:  "ab"  1000
//              /      |      \
//          [0D0A][0E 6162][05 E803][00]
//           \__/   | \__/  |   \/    \
//          opcode  | strv  |   int   terminal
//                type     type         null
//

// Para crear la estructura de un Array
const ELEMENT_TYPE = {
	LINT      : '00',
	LFLOAT    : '01',
	LSTRING8  : '02',
	LSTRING16 : '03',
	GINT      : '80',
	GFLOAT    : '81',
	GSTRING8  : '82',
	GSTRING16 : '83'
}

/*
         0006: 1@(2@, 123i) = 1
    ____/   ___/  \__  | \     \
  [0600][08 0100 0200 7B 00][04 01]
    \__/  | \__/ \__/  |  |  \   \
   opcode |  id   id   | lint \   \
     lvar_array      lenght  int8  num


         0007: 1@(2@, 123f) = 1.0
    ____/   ___/  \__  | \     \__________
    0700 08 0100 0200 7B 01 06 00 00 80 3F
    \__/  | \__/ \__/  |  |  \         |
   opcode |  id   id   |lfloat\        |
     lvar_array      lenght  float32  num


         05AA: 1@s(2@, 123s) = 'test'
    ____/   ___/  \__  |  |    \______________________
    AA05 0D 0100 0200 7B 02 09 74 65 73 74 00 00 00 00
    \__/  | \__/ \__/  |  |  \            |
   opcode |  id   id   |lstr8 \           |
lvar_array_string8  lenght  string8     string


         06D2: 1@v(2@, 123v) = "test"
    ____/   ___/  \__  |  |    \_____________
    D206 13 0100 0200 7B 03 0E 04 74 65 73 74
    \__/  | \__/ \__/  |  |  \            |
   opcode |  id   id   |lstr16\           |
lvar_array_string16 lenght  string_v    string

     op  @            l  $  values
    0600 08 0100 2803 7B 80 04 01
    0700 08 0100 2803 7B 81 06 00 00 80 3F
    AA05 0D 0100 2803 7B 82 09 74 65 73 74 00 00 00 00
    D206 13 0100 2803 7B 83 0E 04 74 65 73 74
         $               $
    0400 07 2C03 0200 7B 00 04 01
    0500 07 2C03 0200 7B 01 06 00 00 80 3F
    A905 0C 2C03 0200 7B 02 09 74 65 73 74 00 00 00 00
    D106 12 2C03 0200 7B 03 0E 04 74 65 73 74
         $               @
    0400 07 2C03 2803 7B 80 04 01
    0500 07 2C03 2803 7B 81 06 00 00 80 3F
    A905 0C 2C03 2803 7B 82 09 74 65 73 74 00 00 00 00
    D106 12 2C03 2803 7B 83 0E 04 74 65 73 74 
*/

  
  




//     TRANSPILADORES







SP.toHex = function(offset = 0) {
    let result = '';
    for (let i = 0; i < this.length; i++) {
      if (this.charCodeAt(i) > 255){
        throw new Error('Un caracter del String es Unicode')
      }
      
      result += this
      .charCodeAt(i)
      .toString(16)
      .padStart(2,'0');
    }
    for (let i = 0; i < offset; i++) {
      result += '00'
    }
    return result;
}

SP.toBigEndian = function(){
    if (this.length % 2 != 0){
      throw new Error('La longitud del String es impar.')
    }
  	let newResult = ''
  	let result = this
  		.split(/([a-f0-9]{2})/i)
  		.clear()
  		.forEach(e => newResult = e + newResult)
  	return newResult
}

SP.parseCharScape = function(){
    let nString = this
		.replaceAll('\\n','\n')
		.replaceAll('\\t','\t')
		.replaceAll('\\\\','\\')
    .replaceAll("\\'","'")
		.replaceAll("\\`","`")
    .replaceAll('\\"','"')
    .replace(/\\x([A-F\d]{1,2})/gi,(match, content)=> {
      return String.fromCharCode(content.hexToDec())
    })
    return nString
}

SP.hexToFloat = function() {
    let view = new DataView(new ArrayBuffer(4));
  
    this.match(/.{1,2}/g).forEach((byte, i) => {
      view.setUint8(i, parseInt(byte, 16));
    });
  
    return view.getFloat32(0);
}

SP.setOpcodeNegative = function() {
  if (+('0x'+this) >= 0x8000){
    return new Error('El opcode ya es negativo')
  }
  // Convierte el input en una cadena HEX entendible
  //   para JS, para convertirlos en Number y
  //   retornar la suma de ambos.
  return (
    +('0x' + (this + "")) + 0x8000
  ).toString(16).padStart(4,'0')
}

SP.setOpcodePositive = function() {
  if (+('0x'+this) <= 0x7FFF) {
    return new Error('El opcode ya es positivo')
  }
  // Convierte el input en una cadena HEX entendible
  //   para JS, para convertirlos en Number y
  //   retornar la resta de ambos.
  return (
    +('0x' + (this + "")) - 0x8000
  ).toString(16).padStart(4,'0')
}

/** Convert any number to HEX with BIG-ENDIAN
*/
NP.toHex = function(){
	const getHex = i => ('00' + i.toString(16)).slice(-2);

	let view = new DataView(new ArrayBuffer(4)),
		result;

	view.setFloat32(0, this);

	result = Array
		.apply(null, { length: 4 })
		.map((_, i) => getHex(view.getUint8(i)))
		.join('');

	return result.toBigEndian()
}
function IsInRange(VAR, MIN, MAX){
	return (VAR >= MIN && VAR <= MAX) ? 1 : 0;
}
NP.intToHex = function () {
  let decimal = this
  let bitReq = 0
  
  let abs = Math.abs(decimal)
  if (decimal < 0) abs-=1;
  if (IsInRange(abs, 0x00, 0x7F)) bitReq = 1;
  if (IsInRange(abs, 0x80, 0x7FFF)) bitReq = 2;
  if (IsInRange(abs, 0x8000, 0x7FFFFFFF)) bitReq = 4;
  
  const getHex = i => ('00' + i.toString(16)).slice(-2).toUpperCase();

    let view = new DataView(new ArrayBuffer(4));
    view.setUint32(0, decimal);

    let result = Array
        .from({ length: 4 }, (_, i) => getHex(view.getUint8(i)))
        .reverse()
        .join('');

    // Eliminar ceros a la izquierda
    result = result.replace(/^0+/, '');

    // Asegurarse de que la longitud sea par
    if (result.length % 2 !== 0) {
        result = '0' + result;
    }

    // Asegurarse de que la longitud sea múltiplo de 2 bytes
    while (result.length % 4 !== 0) {
        result = '00' + result;
    }
    
    if (bitReq == 1) result = result.slice(0,2)
    if (bitReq == 2) result = result.slice(0,4)
    if (bitReq == 4) result = result.slice(0,8)
    
    return result;
}

















//            PARSEADORES

















SP.enumsGenerator = function() {
    // Eliminamos los saltos de línea y espacios innecesarios
    let str = this.replace(/\n\n/g, '').trim();

    // Dividimos el string en las secciones "enum"
    const enumSections = str.split('enum ');

    // Creamos un objeto para almacenar los resultados
    const resultado = {};

    // Iteramos sobre cada sección "enum"
    for (const section of enumSections) {
        if (section) {
            // Extraemos el nombre del enum y las opciones
            const [enumName, ...options] = section.rA(',', '\n').split(/\s+/);

            // Creamos un objeto para almacenar las opciones
            const enumObj = {};
            let nIndex = 0
            
            // Asignamos valores a las opciones
            options.forEach((option, index) => {
              if(option != 'end' && !(options.length-1==index)){
                if (option.includes('=')) {
                    let [name, value] = option.split('=');
                    if (!/("|')/.test(value)) {
                      value = Number(value)
                    }
                    enumObj[name.toUpperCase()] = value
                    nIndex = value
                } else {
                 if(typeof nIndex == "number"){
                  enumObj[option.toUpperCase()] = ++nIndex
                 }else{
                  enumObj[option.toUpperCase()] = option
                 }
                }
              }
            });

            // Agregamos el enum al resultado
            resultado[enumName.toUpperCase()] = enumObj
        }
    }
    return resultado;
}


let CUSTOM_ENUM = DATA_DOWNLOADED[DOWNLOADED.ENUMS].enumsGenerator()

/*
let SASCM = (await LSget(
  'https://raw.githubusercontent.com/MatiDragon-YT/data/master/sa_cp/SASCM.INI',
  'cyan',
  './data/SASCM.INI'
))
*/

let CUSTOM_KEYWORDS = DATA_DOWNLOADED[DOWNLOADED.KEYWORDS]

CUSTOM_KEYWORDS = 
CUSTOM_KEYWORDS.toLowerCase().split('\n').map(keyword =>{
  keyword = keyword.trim()
  if (!keyword.startsWith(';')){
    if (keyword != ''){
      keyword = keyword.split('=')
      return {
        key: keyword[1],
        opcode: keyword[0]
      }
    }
  }
}).clear()

// ----------------------------

let addClass = false
let currentClass = ''

let classes = deepMerge(
 deepMerge({}, 
  txtToClass(DATA_DOWNLOADED[DOWNLOADED.CLASSES_SB])
 ),
 txtToClass(DATA_DOWNLOADED[DOWNLOADED.CLASSES_MD])
)


function txtToClass(txt){
  let classesTemp = {}
  
  txt = txt
  .toUpperCase() // Aquí se utiliza para eliminar comentarios de una sola línea que comienzan con ';'.
  .r(/;(.+)?$/gm, '')
  .r(/^\s*$/gm, '')
  .split('\n')
  .clear()   // .clear elimina líneas vacias
  .forEach(line => {
    line = line.trim()
    // Aquí se manejan las directivas que indican el comienzo y fin de la lista de clases y las definiciones de clases.
    
    if (line == '#CLASSESLIST'){
      addClass = true;
    }
    else if (line == '#CLASSES') {
      addClass = false;
    }
    else if (line == '#EOF'){
      addClass = false;
    }
    else {
      // Si estamos en la sección de lista de clases, se crea un nuevo objeto para cada clase.
      if (addClass == true) {
        classesTemp[line] = {}
      } else {
        // Si la línea comienza con '$', indica el comienzo o fin de una definición de clase.
        if (/^\$.+/m.test(line)) {
          if (line != '$BEGIN'
            && line != '$END'
          ){
            // Extrae el nombre de la clase actual.
            currentClass = line.match(/^\$(.+)/m)[1]
          }
        } else {
          // Si la línea comienza con '^', se trata de una propiedad con operaciones y códigos asociados.
          if (line.startsWith('^')) {
            // Extrae el nombre de la propiedad.
            let propertyName = line.match(/\^(.*?),\[/)[1];
            // Extrae los datos asociados con la propiedad y los divide en un array.
            let data = line.match(/\[(.*?)\]/g).map(e => e.replace(/[\[\]]/g, '').split(','));
          
            // Inicializa un objeto para la propiedad dentro de la clase actual.
            if (!(propertyName in classesTemp[currentClass]))
            classesTemp[currentClass][propertyName] = {};
          
            // Itera sobre cada conjunto de operaciones y códigos para la propiedad.
            data.forEach(prop => {
              let [opCode, mathCode, pos, type, helpCode] = prop;
              // Realiza acciones basadas en el código matemático.
              switch (mathCode) {
                case '==':
                  classesTemp[currentClass][propertyName].IS = opCode;
                  break;
                case '=':
                  if (pos === '1') {
                    classesTemp[currentClass][propertyName].SET = opCode;
                  } else if (pos === '2') {
                    classesTemp[currentClass][propertyName].GET = opCode;
                  }
                  break;
                case '+=':
                  classesTemp[currentClass][propertyName].ADD = opCode;
                  break;
                case '>=':
                  classesTemp[currentClass][propertyName].UPPER = opCode;
                  break;
                  // Se pueden agregar más casos según sea necesario.
              }
            });
          }
          // Si la línea contiene comas, se trata de una propiedad simple con un valor asociado.
          else if (/([^,]+),([^,]+)/.test(line)){
            // Extrae la clave y el valor de la propiedad.
            let temp =
              line.match(/([^,]+),([^,]+)/)

            // Crea un objeto temporal para la propiedad.
            let miember = {}
            miember[temp[1]] = temp[2]

            // Combina la propiedad con la clase actual.
            classesTemp[currentClass] = { ...classesTemp[currentClass],  ...miember}
          }
        }
      }
    }
  })
  return classesTemp
}

let CUSTOM_VARIABLES =
  DATA_DOWNLOADED[DOWNLOADED.VARIABLES]

CUSTOM_VARIABLES = CUSTOM_VARIABLES
	.r(/;.+/g,'')
	.r(/\r/g,'\n')
	.split('\n')
	.clear()
CUSTOM_VARIABLES.forEach((l,i)=>{
	CUSTOM_VARIABLES[i] = l.r(/(.+)=(.+)/,'$2=$1').toUpperCase().split('=')
})
CUSTOM_VARIABLES = Object.fromEntries(CUSTOM_VARIABLES)




CONSTANTS = DATA_DOWNLOADED[DOWNLOADED.CONSTANTS]

CONSTANTS = CONSTANTS
	.r(/(^const|end$)/gm, '')
	.r(/\r/g, '\n')
	.r(/[\x20\t]+\n/g, '\n')
	.r(/^[\x20\t]+/gm, '')
	.r(/(\x20+)?=(\x20+)?/g, '=')
	.toUpperCase()
	.split('\n')
	.clear()
CONSTANTS.forEach((e,i) => CONSTANTS[i] = e.split('='))
CONSTANTS = Object.fromEntries(CONSTANTS)

constantes = 
  new RegExp("\\b(" + Object.keys(CONSTANTS).join("|")+ ")\\b", "gi");





let MODELS = DATA_DOWNLOADED[DOWNLOADED.MODELS]

MODELS = MODELS
	.r(/\r/g,'')
	.r(/(\d+) (.+)/g, '$2 $1')
	.toUpperCase()
	.split('\n')
	.clear()
MODELS.forEach((e,i) => MODELS[i] = e.split(' '))
MODELS = Object.fromEntries(MODELS)

let SCM_DB = {}
let SCM_DB2 = {}
let DATA_DB = ''
let DATA_DB2 = ''

async function dbSBL2(game){
  DATA_DB2 = DATA_DOWNLOADED[DOWNLOADED.JSON_DATA]

  DATA_DB2 = JSON.parse(DATA_DB2)
  
	DATA_DB2.extensions.forEach(extension => {
		extension.commands.forEach((command) => {
		  let omitir = false
		  if (command?.attrs?.is_unsupported){
		    omitir = true
		  }
		  
		  if (!omitir){
  		  SCM_DB2[command.name.toLowerCase()] = 
  			  command.id.toLowerCase();
  		
  			SCM_DB2[command.id.toLowerCase()] = {
  			  id: command.id.toLowerCase(),
  			  name: command.name,
  			  class: command.class ?? '',
  			  member: command.member ?? '',
  			  short_desc: command.short_desc ?? '',
  			  num_params: command.num_params ?? 0, 
  			  input: command.input ?? [],
  			  output: command.output ?? [],
  			  attrs: command.attrs ?? '',
  			  variable: false
  			}
  			
  			SCM_DB2[command.id.toLowerCase()]
  			.input
  			.forEach(e => {
  			  if (e.type == 'arguments')
  			  {
  			  SCM_DB2[command.id.toLowerCase()]
  			  .variable = true
  			  }
  		  })
		  }
		})
	})
	
	CUSTOM_KEYWORDS.forEach(keyword => {
	  SCM_DB2[keyword.key] = SCM_DB2[keyword.opcode] 
	})
	
	LS.set('shared_db', JSON.stringify(SCM_DB2))
	return true
}


async function dbSBL(game){
  DATA_DB = DATA_DOWNLOADED[DOWNLOADED.JSON_DATA]

  DATA_DB = JSON.parse(DATA_DB)
  
  
  
	DATA_DB.extensions.forEach(extension =>{
		
		extension.commands.forEach((command, c) =>{
		  let omitir = false
			
		  if (command.attrs) {
				if ("is_unsupported" in command.attrs) {
					omitir = true
				}
		  }
		  
		  if (!omitir){
				SCM_DB[command.name.toLowerCase()] = {
					opcode : command.id.toLowerCase(),
					params : []
				}
				if (command.input) {
					command.input.forEach(param =>{
						SCM_DB[command.name.toLowerCase()].params.push(param.type.toLowerCase())
					})
				}
		  }
		})
	})
	return true
}


const game = 'sa'

let version = DATA_DOWNLOADED[DOWNLOADED.JSON_VERSION]


await dbSBL(game)
await dbSBL2(game)


SP.toUnicode = function() {
  return this.split("").map(s => {
	return `${s.charCodeAt(0).toString(16).padStart(2, '0')}`;
  }).join("");
}

SP.hexToDec = function(){
	return +('0x'+this)
}

SP.parseHigthLevelIfs = function() {
    const lineas = this.split('\n');
    const etiquetas = [];
    let etiquetaCounter = 1;

    const codigoTransformado = lineas.map((linea) => {
        linea = linea.trim();
        
        if (/IF/i.test(linea)) {
            return linea.replace(/IF/gi, 'if');
        } else if (/THEN/i.test(linea)) {
            etiquetas.push(`label_${etiquetaCounter}`);
            etiquetaCounter++;
            return 'goto_if_false @' + etiquetas[etiquetas.length - 1];
        } else if (/ELSE/i.test(linea)) {
            const etiqueta = etiquetas.pop();
            const etiquetaElse = `label_${etiquetaCounter}`;
            etiquetaCounter++;
            etiquetas.push(etiquetaElse);
            return `goto @${etiquetaElse}\n:${etiqueta}`;
        } else if (/END/i.test(linea)) {
            const etiqueta = etiquetas.pop();
            return etiqueta ? ':' + etiqueta : 'END';
        }
        return linea;
    }).join('\n');

    return codigoTransformado;
}

SP.parseHigthLevelLoops = function(){
    // Para abrir y cerrar un bucle, necesitamos saber
    // el nombre de la ultima etiqueta creada para este
    // fin, y una forma de saber cual hay que poner,
    // es con un Stack(pila). Cada etiqueda creada para
    // indicar el comienzo del bucle, se guarda en una
    // Stack. Para que cada cierre de bucle, solo valla
    // al final del stack, tome la etiqueta que necesita.
    
    let stacks = {
      general: [], // para saber que stack hay que revisar
      reverse: [],
      custom: [],
      for : [],
      forin: [],
      repeat : [],
      until : [],
      while : [],
      if : []
    }
    
    // Para evitar que las etiquetas se repitan, usamos
    // contadores que solo sean para incrementar.
    let counts = {
      reverse:0,for:0,repeat:0,while:0,if:0,custom:0,forin:0
    }
    let label = ''
    
    // dividimoa el codigo, para analizarlo por lineas.
    const lines = this.split('\n');
    let outputText = ''
    
    //1@(2@, 123i)
    
    const SYNTAX = {
      FOR: /^FOR (.+)=(.+) (TODOWN|TO) (.+)STEP(.+)/im,
      FORIN: /^FORIN (.+\((.+),(\d+)\w\))/im,
      WHILE: /^WHILE (.+)/im,
      REPEAT: /^UNTIL (.+)/im,
      IF: /^IF (.+)/im
    };
    
    lines.forEach(line => {
      line = line.trim()
      
      if (/^then$/im.test(line)) {
        stacks.general.push('then');
        
        label = `if_${++counts.if}`
        line = [
          'goto_if_false @'+label+''
        ].join('\n')
        
        stacks.if.push(label);
      }
      else if (/^else$/im.test(line)) {
        if (stacks.general.slice(-1) != 'then'){
          throw new Error('cierre de pila inconclusa :'+stacks.general)
        }
        
        label = stacks.if.slice(-1);
        let labelElse = `if_${++counts.if}`
        line = [
          'goto @'+labelElse,
          ':'+label
        ].join('\n')
        
        stacks.if[stacks.if.length - 1] = labelElse
      }
      else if (/^while /im.test(line)){
        if (/^while true$/im.test(line)){
          stacks.general.push('true')
          
          label = `while_true_${++counts.while}`
          line = ':'+label+'_return // begin-loop'
          
          stacks.while.push(label)
        }
        else if (/^while false$/im.test(line)){
          stacks.general.push('false')
          
          label = `while_false_${++counts.reverse}`
          line = `goto @`+label
          
          stacks.reverse.push(label)
        }
        else {
          stacks.general.push('custom')
          
          const values = line.match(SYNTAX.WHILE)
          
          label = `while_custom_${++counts.custom}`
          line = [
            ':'+label+'_return // begin-loop',
            'if',
            values[1],
            'goto_if_false @' + label
          ].join('\n')
          
          stacks.custom.push(label)
        }
      }
      else if(/^forin .+/im.test(line)) {
        stacks.general.push('forin')
        
        const VALUES = line.match(SYNTAX.FORIN)
        
        const ARRAY = VALUES[1],
              INDEX = VALUES[2],
              SIZE = VALUES[3]
        
        label = `loop_forin_${++counts.forin}`
        
        line = [
          INDEX+' = -1',
          ':'+label+'_return // begin-loop',
          INDEX+' += 1',
          'if',
          INDEX+' >= '+SIZE,
          'goto_if_false @'+label
        ].join('\n')
        
        
        stacks.forin.push(label)
      }
      else if(/^for .+/im.test(line)) {
        stacks.general.push('for')
        
        const values = line.match(SYNTAX.FOR)
        const variable = values[1].trim()
        const start = values[2].trim()
        const forUp = /down/i.test(values[3])
        const end = values[4]
        const step = values[6] || 1
        
        label = `loop_for_${++counts.for}`
        
  			line =[
  			  variable+' = '+start,
  			  variable+' '+(forUp?'+=':'-=')+' '+step,
          ':'+label+'_return // begin-loop',
          variable+' '+(forUp?'-=':'+=')+' '+step,
          'if',
          variable+' '+(forUp?'<=':'>=')+' '+end,
          'goto_if_false @'+label
        ].join('\n')
        
        stacks.for.push(label)
      }
      else if (/^repeat$/im.test(line)){
        stacks.until.push('repeat')
          
        label = `repeat_${++counts.repeat}`
        line = `:`+label+'_return // begin-loop'
          
        stacks.repeat.push(label)
      }
      else if(/^until.+$/im.test(line)){
        if (stacks.until.length == 0){
          throw new Error(`pila sintactica: vacia`)
        }
        else{
          if (/^until true$/im.test(line)) {
            label = stacks.repeat.pop()
            stacks.until.pop()
            
            line = [
              'goto @'+label+'_return',
              ':'+label +' // end-loop'
            ].join('\n')
          }
          else if (/^until false$/im.test(line)) {
            stacks.repeat.pop()
            stacks.until.pop()
            
            line = ':'+label +' // end-loop'
          }
          else {
            label = stacks.repeat.pop()
            stacks.until.pop()
            
            const condition = line.match(SYNTAX.REPEAT)[1]
            
            line = [
              'if',
              condition,
              'goto_if_false @'+label,
                'goto @'+label+'_return',
              ':'+label +' // end-loop'
            ].join('\n')
          }
        }
      }
      else if(/^end$/im.test(line)) {
        if (stacks.general.length == 0) {
          throw new Error(`>>> ERROR: The loops and conditionals were all closed. you are trying to put one too many.`)
        }
        else {
          let closed = stacks.general.pop()
          
          if (closed == 'true') {
            label = stacks.while.pop()
            line = [
              'goto @'+label+'_return',
              ':'+label +' // end-loop'
            ].join('\n')
          }
          else if (closed == 'false') {
            line = ':' + stacks.reverse.pop()
          }
          else if (closed == 'custom') {
            label = stacks.custom.pop()
            line = [
              'goto @'+label+'_return',
              ':' + label +' // end-loop'
            ].join('\n')
          }
          else if(closed == 'forin'){
            label = stacks.forin.pop()
            line = [
              'goto @'+label+'_return',
              ':' + label +' // end-loop'
            ].join('\n')
          }
          else if(closed == 'for'){
            label = stacks.for.pop()
            line = [
              'goto @'+label+'_return',
              ':' + label +' // end-loop'
            ].join('\n')
          }
          else if (closed == 'then'){
            label = stacks.if.pop()
            line = ':' + label +' // end-condition'
          }
        }
      }
      
      outputText += line + '\n'
    })
    if (stacks.general.length > 0){
      
      throw new Error(`>>> ERROR: there is an unclosed loop or condicional: ${stacks.general}\nWrite the closing with 'END'`)
    }
    return outputText;
}

SP.addBreaksToLoops = function(){
    const lines = this.split('\n')
    let result = ''

    let loopBehin = null
    let loopEnd = null

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.includes('// begin-loop')) {
        loopBehin = line.slice(1)
        loopEnd = null
      }
      if (line.includes('// end-loop')) {
        loopBehin = null
        loopEnd = null
      } 
      
      if (/^continue$/im.test(line)) {
        if (!loopBehin) {
          throw new Error('>>> ERROR: continue - not found loop init')
        }else{
          result += 'goto @'+loopBehin+'\n'
        }
      } else if (/^break$/im.test(line)) {
        if (!loopBehin) {
          throw new Error('>>> ERROR: break -  not found loop init')
        }else {
          for (let s = i; s < lines.length; s++){
            const lineSearch = lines[s].trim()
          
            if (lineSearch.includes('// end-loop')) {
              loopEnd = lineSearch.slice(1)
              break;
            }
          }
          if (!loopEnd) {
            throw new Error('>>> ERROR: break -  not found loop init')
          }else{
            result += 'goto @' + loopEnd + '\n'
          }
        }
      } else {
        result += line+'\n'
      }
    }
    
    return result
}

SP.addNumbersToIfs = function() {
	let lineas = this.split('\n');
	let nLineas = ''
	let tReg = /^if .+/im
	
	// aca solo se arreglan los cuerpos para
	// que se ajusten a un solo fomando por linea.
	lineas.forEach(line =>{
	  if (tReg.test(line)){
	    let vars = line.match(/^if (.+)/mi)
	    let cond = vars[1].trim()
	    if (!/^(and|or)$/im.test(cond)){
	      nLineas += 'if\n'+cond+'\n'
	    }else{
	      nLineas += line+'\n'
	    }
	  }else if (/^(then|else) .+/im.test(line)){
	    let vars = line.match(/^(then|else) (.+)/im)
	    
	    let cond = vars[2].trim()
	    if (cond == ''){
	      nLineas += vars[1]+'\n'
	    }else{
	      nLineas += vars[1]+'\n'+cond+'\n'
	    }
	  }else {
	    nLineas += line + '\n'
	  }
	})
	
	
  lineas = nLineas.split('\n')
  
	let real = 0
	let contador = 0;
	let iniciar = false
	let multiCondicion = false
	let numeros = [];

	for (let linea of lineas) {
	  linea = linea.trim()
		if (/^if/im.test(linea)) {
			iniciar = true
			real = 0
			contador = 0
			if (/\s+(or|and)$/i.test(linea)) {
				multiCondicion = true
				if (/or/i.test(linea)) {
					contador += 20;
				} else {
					contador += 1;
				}
			}
		} else if (/^(then|goto_if_false|else_jump|else_goto|jf|004D)/im.test(linea)) {
		  //real--;
		  
			if (real > 1 && multiCondicion == false)
			 throw new Error('¡Error! El "if" debe ir seguido de "and" o "or".')
			  
			if (real > 8 && multiCondicion == true)
			  throw new Error('¡Este if tiene más de 8 líneas de texto!');
			
			contador += real > 0 ? real-1 :real
			numeros.push(contador);
			contador = 0;
			real = 0;
			iniciar = false
		} else {
		  if(linea != '') {
				real++;
		  }
		  
		}
	}
	
	let number = 0
	let counter = 0
	for (let linea of lineas) {
	  linea = linea.trim()
		if (linea.startsWith('if')) {
		  if (/^if .+/im.test(linea)){
			const param = linea.match(/^if (.+)/im)
			lineas[counter] = 
			  "if "
			  +numeros[number]
			  +"\n"
			  +(param[1].replace(/^(and|or)/im, ''))
		  }else{
			lineas[counter] = linea +" "+numeros[number]
		  }
		  number++
		}
		counter++
	}
	
	return lineas.join('\n');
}

SP.removeComments = function() {
  let result = this
    .r(/\/\/.*$/gm, '')
		.r(/(\s+)?\/\*([^\/]*)?\*\//gm, '')
		.r(/(\s+)?\{([^\$][^\}]*(\})?)?/gm, '')
	
	return result
    .split('\n')
    .map(e => {return e.trim()})
    .clear()
    .join('\n')
}

SP.formatScript = function() {
  let code = this
  
  code = code.split('\n').map(line => {
    return line.trim()
  }).clear()
  
  code = code.join('\n')
  
  code = code
    .r(/^(if and|if or|if )?/mgi, "$1\n")
    .r(/^hex /mgi, "hex\n")
    .r(/^then /mgi, "then\n")
    .r(/^else /gmi, "else\n")
    .r(/ end$/mgi, "\nend\n")
    .r(/^repeat /mgi, "repeat\n")
  return code
}

function encontrarAdiciones(texto) {
  const patron1 = /(\d+@[if]?|[if]?(\$|&)\w+|\w+)/;
  const patron2 = /(\+\+|--)/;
  const resultados = [];
  let textoModificado = texto;

  // Función para buscar y procesar los patrones
  function buscarYProcesar() {
    const regex = new RegExp(`${patron1.source + patron2.source}|${patron2.source + patron1.source}`, 'gi');
    
    let match = regex.exec(textoModificado);
    while (match) {
      
      const indicePatron1 = match.index;
      const indicePatron2 = match[2] ? indicePatron1 + match[1].length : match.index;

      // Determinar la posición relativa y agregar al resultado
      if (match[3]) {
        resultados.push([match[0], 'derecha', match[3]]);
      } else {
        resultados.push([match[0], 'izquierda', match[4]]);
      }
      
      // Buscar el siguiente match
      match = regex.exec(textoModificado);
    }
  }

  // Iniciar la búsqueda y procesamiento
  buscarYProcesar();

  return resultados;
}

function encontrarTemporales(texto){
    const patronTemp = /(\d+@[if]?|[if]?[\$&]\w+|[a-z_]\w*)([\-+*\/])([\w#$&@.]+)/
    return texto.match(new RegExp(patronTemp.source, 'ig'))
}

let CLEO_FUNCTIONS

SP.preProcesar = function() {
  CLEO_FUNCTIONS = {
    MATH : {
      INT_INT : false,
      FLOAT_FLOAT : false,
      INVERT_BOOL : false,
      TO_BOOL : false,
    }
  }
  let nString = ''
  
  this.formatScript().split('\n').forEach(linea =>{
    linea = linea.trim()
    let lineaAnterior = ""
    let lineaSiguiente = ""
    
    const patron1 = /(\d+@[if]?|[if]?(\$|&)\w+|[a-z_]\w*)/;
    const patron2 = /([+-]{2})/;
    const patron3 = /([\+\-\*\/])([\w#$&@.]+)/;
    
    const patronEn = new RegExp(`^(${patron1.source + patron2.source}|${patron2.source + patron1.source})$`, 'mi')
    
    const patronTemp = /(\d+@[if]?|[if]?[\$&]\w+|[a-z_]\w*)([\-+*\/])([\w#$&@.]+)/i
  
    if (!/^\w+:/.test(linea) && !patronEn.test(linea)){
      if (patron2.test(linea)){
        let operadores = encontrarAdiciones(linea)
       
        operadores.forEach(fix => {
          if (fix[1] == "derecha"){
            lineaSiguiente += fix[0] + '\n'
          } else {
            lineaAnterior += fix[0].r(fix[2])+fix[2] + '\n'
          }
          linea = linea.r(fix[2])
        })
        
        linea = lineaAnterior + linea +'\n'+ lineaSiguiente +'\n'
      }
      else if(patron3.test(linea)
        && !/(^-?\d+$|["'`\.])/m.test(linea)
      ){
        let temporales = encontrarTemporales(linea)
        
        if (temporales){
          temporales.forEach(temporal =>{
            
            let sec = linea.match(patronTemp)
            let ant = '+'
            if (sec[2] == '+') ant = '-';
            if (sec[2] == '-') ant = '+';
            if (sec[2] == '/') ant = '*';
            if (sec[2] == '*') ant = '/';
            
            lineaAnterior += sec[1] + ' ' + sec[2] + '= ' + sec[3] + '\n'
            linea = linea.r(sec[0], sec[1])
            lineaSiguiente += sec[1] + ' ' + ant + '= ' + sec[3] + '\n'
            
            
          })
          linea = lineaAnterior + linea + '\n' + lineaSiguiente + '\n'
        }
      }
    }
    
    if (/^\d+ == \d+$/im.test(linea)){
      CLEO_FUNCTIONS.MATH.INT_INT = true
    }
    if (/^\d+\.\d+ == \d+\.\d+$/mi.test(linea)){
      CLEO_FUNCTIONS.MATH.FLOAT_FLOAT = true
    }
    nString += linea.trim() + '\n'
  })
  
  nString = nString
    .r(/\btoHex\(([^)(]+)\)(\.offset\((\d+)\))?/gi, (...input) => {
      let str = input[1] || ''
      let offset = +input[3] ?? 0
      
      if (str.length > 4){
        throw new RangeError('Max 4 Characters')
      }
      if (str.length + offset > 4){
        throw new RangeError('string + offset, must NOT add up to more than 4 characters.')
      }
      
      return +('0x'+str.toHex(offset))
    })
    
    .r(/^forEach (.+) => (.+)$/gim, input => {
      input = input.r(/^forEach\s*/im,'')
      
      let n = input.match(/(([^\(]+)\((.+),(\d+[isfv]?)\)) => (.+)/i)
      return `for ${n[3]} = 0 to ${n[4]} step 1\n`+
        n[5]+' = '+n[1]
    })
    .r(/^END(IF|WHILE|FORIN|FOR)$/gim, 'END')
    .r(/^(\+\+|--)(.*)$/gm, '$2$1')
    .r(/(.+) = (\d+@b|b[\$&]\w+)/gim, '$2 == 0 ? $1 = 0 : $1 = 1')
    // char VAR1 =& VAR2
    .r(/^(char|actor) (.+) =& (.+)/gim, 'GET_PED_POINTER $3 $2')
    .r(/^object (.+) =& (.+)/gim, 'GET_OBJECT_POINTER $2 $1')
    .r(/^car (.+) =& (.+)/gim, 'GET_VEHICLE_POINTER $2 $1')
    .r(/^pickup (.+) =& (.+)/gim, 'GET_PICKUP_POINTER $2 $1')
    .r(/^task (.+) =& (.+)/gim, 'GET_CHAR_TASK_POINTER_BY_ID $2 $1')
    .r(/^fx (.+) =& (.+)/gim, 'GET_FX_SYSTEM_POINTER $2 $1')
    .r(/^model (.+) =& (.+)/gim, 'GET_MODEL_NAME_POINTER $2 $1')
    .r(/^(.+) =& @(.+)/gim, 'GET_LABEL_POINTER $2 @$1')
    .r(/^(.+) =& (.+)/gim, 'GET_VAR_POINTER $2 $1')
  	// 0@ = 1@ == 1 ? 0 : 1
  	.r(/^(.+) ([\-\+\*\/%]?=) (.+) \? (.+) \: (.+)$/gm,
  	  `if\n$3\nthen\n$1 $2 $4\nelse\n$1 $2 $5\nend\n`)
    .r(/^(.+) => (.+);/gim, 'if $1\nthen $1 end')
  	  
  	// 0@ == 1 ? 0 : 1
  	.r(/^(.+) \? (.+) \: (.+)$/gm, input =>{
  	  let vars = input.match(/^(.+)\?(.+)\:(.+)$/)
  	                  .map(e=> e.trim())
  	  
  	  vars[1] = vars[1].determineOperations()
  	  
  	  let operators = '==,!=,<=,>=,>,<,<>'
  	  
  	  operators.split(',').forEach(operador => {
  	    if (RegExp(operador).test(vars[1])){
  	      input =
  	        'if\n'+vars[1]+'\n'+
  	        'then\n'+vars[2].determineOperations()+'\n'+
  	        'else\n'+vars[3].determineOperations()+'\n'+
  	        'end\n'
  	    }
  	  })
  	  
  	  return input
  	})
  	// 0@ == 1 ? 0
  	.r(/^(.+) \? (.+)$/gm, input =>{
  	  let vars = input.match(/^(.+)\?(.+)$/)
  	                  .map(e=> e.trim())
  	  
  	  vars[1] = vars[1].determineOperations()
  	  
  	  let operators = '==,!=,<=,>=,>,<,<>'
  	  
  	  operators.split(',').forEach(operador => {
  	    if (RegExp(operador).test(vars[1])){
  	      input =
  	        'if\n'+vars[1]+'\n'+
  	        'then\n'+vars[2].determineOperations()+'\n'+
  	        'end\n'
  	    }
  	  })
  	  
  	  return input
  	})
  	
  	.r(/^([^\s]+) \? ([^\s]+)$/gm, (i, ...m) => {
  	  
  	  let r = 
  	    'if\n'+
  	    m[0].determineOperations()+
  	    '\nthen\n'+
  	    m[1].determineOperations()+
  	    '\nend\n'
  	    
  	  
  	  return r
  	})
  	.r(/^@(\w+)$/gm, 'goto @$1')
  	
  	
    .r(/^\w+ = \d+ [\*\/\+\-] \d+( [\*\/\+\-] \d+)+$/gim,  input =>{
      let i = input.split(' ')
      let code = i[0]+' '+i[1]+' '+i[2]
      let n = 0
      
      i.forEach((e, c) => {
        if (c > 2){
          n = !n
        }
        if (n){
          code+='\n'+i[0]+' '+i[c]+'= '+i[c+1]
        }
      })
      return code
    })
  	// bitExp
  	// a = b & c
  	.r(/^(.+) = (.+) (>>|<<|%|&|\^|\|\*|\/|\+|\-)\x20?(.+)$/m, (input, ...match) => {
  	  let [var1, var2, operador, var3] = match
  	  
  	  if ((var1.startsWith('f@') || var1.endsWith('@f'))
  	  || (var2.i('.') || var3.i('.'))){
  	    let res = `${var1} ${operador}= ${var2}\n`
  	      + `${var1} ${operador}= ${var3}`
  	      return res
  	  }
  	  
  	  let op = {
  	   "&": "0B10",
  	   "|": "0B11",
  	   "^":"0B12",
  	   "~":"0B13",
  	   "%":"0B14",
  	   ">>":"0B15",
  	   "<<":"0B16",
  	   "+":"0A8E",
  	   "-":"0A8F",
  	   "*":"0A90",
  	   "/":"0A91",
  	  }[operador];
  	  
  	  let res = op+": "+var2+' '+var3+' '+var1
  	  
  	  return res
  	})
  	//0B1A: ~ 0@
  	.r(/^~(.+)/m, '0B1A: $1')
    // 7@ = !!7@
    .r(/(.+) = !!(.+)$/gim,
`if
$2 == 0
then
$1 = 1
else
$1 = 0
end
`)
    // 7@ = !7@
    .r(/(.+) = !(.+)$/gim,
`if
$2 == 1
then
$1 = 0
else
$1 = 1
end
`)
    // 7@ ||= $8
    .r(/(.+) \|\|= (.+)$/gim,
`if or
$1 == null
$1 == undefined
$1 == false
$1 == 0.0
$1 == NaN
then
$1 = $2
end
`)
    // 7@ = 7@ || $8
    .r(/(.+) = (.+) \|\| (.+)$/gim,
`if and
$2 != null
$2 != undefined
$2 != false
$2 != 0.0
$2 != NaN
then
$1 = $2
else
$1 = $3
end
`)
    // 7@ = 7@ ?? $8
    .r(/(.+) = (.+) \?\? (.+)$/gim,
`if and
$2 != null
$2 != undefined
then
$1 = $2
else
$1 = $3
end
`)
    // [] : variable con limites maximos
    // () : variable con valor en bucle
    // [min..max]:0@
    // [min..]:0@
    // [..max]:0@
    
    // function(...) | CLEO_CALL
    .r(/^(\w+)\((.+)\)$/gmi, input=>{
      let vars = input.match(/([^\.\s\W]+)\((.+)\)$/m)
      
      let line = vars[2]
      let add = ''
      let inArray = false
      
      for (let i = 0; i < line.length; i++){
        if (line[i] == '(') inArray = true;
        if (line[i] == ')') inArray = false;
        
        add += inArray ? line[i].r(',', '\x01') : line[i].r(',', ' ')
      }
      
      const length = add.split(' ').clear().length
      
      input = 'cleo_call @'+vars[1]+' '+length+' '+add.rA('\x01', ',')+'\n'
      
      return input
    })
    // subrutine() | GOSUB
    .r(/^(\w+)\(\)$/gm, '\ngosub @$1\n')
    
    nString = nString.trim()
    if (nString.length != 0){
      nString = 'NOP\n'+ nString + '\nTERMINATE_THIS_SCRIPT';
    }
  
  	return nString
}

let registroTipos = {};

function registrarTipo(variable, tipo) {
  if (/[@$&]/.test(variable)) {
    if (Input.isArray(variable)) {
      let vars = variable.match(/(.+)\((.+),(.+)\)/)
      registrarTipo(vars[1],tipo)
      tipo = vars[2].i('@') ? 'LVAR_INT' : 'GVAR_INT'
      registrarTipo(vars[2],tipo)
      return
    }
    
    // Solo registrar si es una variable global o local
    variable = variable
      .r(/@[a-z]/i, '@')
      .r(/[a-z]$/i, '$')
      .r(/[a-z]&/i, '&')
        
    registroTipos[variable] = tipo;
  }
}

function obtenerTipo(variable) {
  if (!isNaN(variable)) {
    return variable.includes('.') ? 'FLOAT' : 'INT';
  } else if (
     /".*"/.test(variable)
  || /`.*`/.test(variable) 
  ) {
    return 'LONGSTRING'
  } else if (/'.*'/.test(variable)) {
    return 'SHORTSTRING'
  }

  // Verificar si el tipo de la variable ya está registrado
  if (registroTipos[variable]) {
    return registroTipos[variable];
  }


  if (/^\d+@/m.test(variable)){
    const matchLocal = 
    variable.match(/^(\d+@)([a-z])?(\(([^,]+),(\d+)(\w)?\))?/i)
    
    if (matchLocal) {
      const tipo = matchLocal[6] ?? matchLocal[2];
      switch (tipo) {
        case 'i': return 'LVAR_INT';
        case 'f': return 'LVAR_FLOAT';
        case 's': return 'LVAR_SHORTSTRING';
        case 'v': return 'LVAR_LONGSTRING';
        default: return 'LVAR_INT'; // Tipo no especificado para variable local
      }
    }
  }

  if (/^\w?\$\w+/m.test(variable)){
    const matchGlobal = variable.match(/^([a-z])?([&$]\w+)/i);
    if (matchGlobal) {
      const tipo = matchGlobal[1];
      switch (tipo) {
        case 'i': return 'GVAR_INT';
        case 'f': return 'GVAR_FLOAT';
        case 's': return 'GVAR_SHORTSTRING';
        case 'v': return 'GVAR_LONGSTRING';
        default: return 'GVAR_INT'; // Tipo no especificado para variable local
      }
    }
  }
}
function detectarOpcode(operacion, _lineaInvocada = 0) {
  const opcodes = {
    '=#': {
      'GVAR_INT-GVAR_FLOAT': '8C',
      'GVAR_FLOAT-GVAR_INT': '8D',
      'LVAR_INT-GVAR_FLOAT': '8E',
      'LVAR_FLOAT-GVAR_INT': '8F',
      'GVAR_INT-LVAR_FLOAT': '90',
      'GVAR_FLOAT-LVAR_INT': '91',
      'LVAR_INT-LVAR_FLOAT': '92',
      'LVAR_FLOAT-LVAR_INT': '93',
    },
    '+=@': {
      'GVAR_FLOAT-FLOAT': '78',
      'LVAR_FLOAT-FLOAT': '79',
      'GVAR_FLOAT-GVAR_FLOAT': '7A',
      'LVAR_FLOAT-LVAR_FLOAT': '7B',
      'LVAR_FLOAT-GVAR_FLOAT': '7C',
      'GVAR_FLOAT-LVAR_FLOAT': '7D',
    },
    '-=@': {
      'GVAR_FLOAT-FLOAT': '7E',
      'LVAR_FLOAT-FLOAT': '7F',
      'GVAR_FLOAT-GVAR_FLOAT': '80',
      'LVAR_FLOAT-LVAR_FLOAT': '81',
      'LVAR_FLOAT-GVAR_FLOAT': '82',
      'GVAR_FLOAT-LVAR_FLOAT': '83',
    },
    '+=': {
      'GVAR_INT-INT': '8',
      'GVAR_FLOAT-FLOAT': '9',
      'LVAR_INT-INT': 'A',
      'LVAR_FLOAT-FLOAT': 'B',
      
      'GVAR_INT-GVAR_INT': '58',
      'GVAR_FLOAT-GVAR_FLOAT': '59',
      'LVAR_INT-LVAR_INT': '5A',
      'LVAR_FLOAT-LVAR_FLOAT': '5B',
      'LVAR_INT-GVAR_INT': '5C',
      'LVAR_FLOAT-GVAR_FLOAT': '5D',
      'GVAR_INT-LVAR_INT': '5E',
      'GVAR_FLOAT-LVAR_FLOAT': '5F',
    },
    '-=': {
      'GVAR_INT-INT': 'C',
      'GVAR_FLOAT-FLOAT': 'D',
      'LVAR_INT-INT': 'E',
      'LVAR_FLOAT-FLOAT': 'F',
      
      'GVAR_INT-GVAR_INT': '60',
      'GVAR_FLOAT-GVAR_FLOAT': '61',
      'LVAR_INT-LVAR_INT': '62',
      'LVAR_FLOAT-LVAR_FLOAT': '63',
      'LVAR_INT-GVAR_INT': '64',
      'LVAR_FLOAT-GVAR_FLOAT': '65',
      'GVAR_INT-LVAR_INT': '66',
      'GVAR_FLOAT-LVAR_FLOAT': '67',
    },
    '*=': {
      'GVAR_INT-INT': '10',
      'GVAR_FLOAT-FLOAT': '11',
      'LVAR_INT-INT': '12',
      'LVAR_FLOAT-FLOAT': '13',
      
      'GVAR_INT-GVAR_INT': '68',
      'GVAR_FLOAT-GVAR_FLOAT': '69',
      'LVAR_INT-LVAR_INT': '6A',
      'LVAR_FLOAT-LVAR_FLOAT': '6B',
      'LVAR_INT-GVAR_INT': '6C',
      'LVAR_FLOAT-GVAR_FLOAT': '6D',
      'GVAR_INT-LVAR_INT': '6E',
      'GVAR_FLOAT-LVAR_FLOAT': '6F',
    },
    '/=': {
      'GVAR_INT-INT': '14',
      'GVAR_FLOAT-FLOAT': '15',
      'LVAR_INT-INT': '16',
      'LVAR_FLOAT-FLOAT': '17',
      
      'GVAR_INT-GVAR_INT': '70',
      'GVAR_FLOAT-GVAR_FLOAT': '71',
      'LVAR_INT-LVAR_INT': '72',
      'LVAR_FLOAT-LVAR_FLOAT': '73',
      'LVAR_INT-GVAR_INT': '74',
      'LVAR_FLOAT-GVAR_FLOAT': '75',
      'GVAR_INT-LVAR_INT': '76',
      'GVAR_FLOAT-LVAR_FLOAT': '77',
    },
    '>=': {
      'GVAR_INT-INT': '28',
      'LVAR_INT-INT': '29',
      'INT-GVAR_INT': '2A',
      'INT-LVAR_INT': '2B',
      'GVAR_INT-GVAR_INT': '2C',
      'LVAR_INT-LVAR_INT': '2D',
      'GVAR_INT-LVAR_INT': '2E',
      'LVAR_INT-GVAR_INT': '2F',
      'GVAR_FLOAT-FLOAT': '30',
      'LVAR_FLOAT': '31',
      'FLOAT-GVAR_FLOAT': '32',
      'FLOAT-LVAR_FLOAT': '33',
      'GVAR_FLOAT-GVAR_FLOAT': '34',
      'LVAR_FLOAT-LVAR_FLOAT': '35',
      'GVAR_FLOAT-LVAR_FLOAT': '36',
      'LVAR_FLOAT-GVAR_FLOAT': '37',
    },
    '==': {
      'INT-INT': 'XXX0',
      'FLOAT-FLOAT': 'XXX1',
      'GVAR_INT-INT': '38',
      'LVAR_INT-INT': '39',
      'GVAR_INT-GVAR_INT': '3A',
      'LVAR_INT-LVAR_INT': '3B',
      'GVAR_INT-LVAR_INT': '3C',
      
      'GVAR_FLOAT-FLOAT': '42',
      'LVAR_FLOAT-FLOAT': '43',
      'GVAR_FLOAT-GVAR_FLOAT': '44',
      'LVAR_FLOAT-LVAR_FLOAT': '45',
      'GVAR_FLOAT-LVAR_FLOAT': '46',
      
      'GVAR_SHORTSTRING-LVAR_SHORTSTRING': '5AD',
      'LVAR_SHORTSTRING-LVAR_SHORTSTRING': '5AE',
      
      'LVAR_INT-GVAR_INT': '7D6',
      'LVAR_INT-GVAR_FLOAT': '7D7',
    },
    '=': {
      'GVAR_INT-INT': '4',
      'GVAR_FLOAT-FLOAT': '5',
      'LVAR_INT-INT': '6',
      'LVAR_FLOAT-FLOAT': '7',
      'GVAR_INT-GVAR_INT': '84',
      'LVAR_INT-LVAR_INT': '85',
      'GVAR_FLOAT-GVAR_FLOAT': '86',
      'LVAR_FLOAT-LVAR_FLOAT': '87',
      'GVAR_INT-LVAR_INT': '88',
      'LVAR_INT-GVAR_INT': '89',
      'GVAR_FLOAT-LVAR_FLOAT': '8A',
      'LVAR_FLOAT-GVAR_FLOAT': '8B',
      
      'GVAR_SHORTSTRING-SHORTSTRING': '5A9',
      'LVAR_SHORTSTRING-SHORTSTRING': '5AA',
      'GVAR_LONGSTRING-LONGSTRING': '6D1',
      'LVAR_LONGSTRING-LONGSTRING': '6D2',

/*
05AA = @ SHORT LVAR_SHORTSTRING
05A9 = $ SHORT GVAR_SHORTSTRING

D206 = @ LONG LVAR_SHORTSTRING
D106 = $ LONG GVAR_LONGSTRING
*/
    },
    '>': {
      'GVAR_INT-INT': '18',
      'LVAR_INT-INT': '19',
      'INT-GVAR_INT': '1A',
      'INT-LVAR_INT': '1B',
      'GVAR_INT-GVAR_INT': '1C',
      'LVAR_INT-LVAR_INT': '1D',
      'GVAR_INT-LVAR_INT': '1E',
      'LVAR_INT-GVAR_INT': '1F',
      'GVAR_FLOAT-FLOAT': '20',
      'LVAR_FLOAT': '21',
      'FLOAT-GVAR_FLOAT': '22',
      'FLOAT-LVAR_FLOAT': '23',
      'GVAR_FLOAT-GVAR_FLOAT': '24',
      'LVAR_FLOAT-LVAR_FLOAT': '25',
      'GVAR_FLOAT-LVAR_FLOAT': '26',
      'LVAR_FLOAT-GVAR_FLOAT': '27',
    },
    '&=':'B17',
    '|=':'B18',
    '^=':'B19',
    '%=':'B1B',
    '>>=':'B1C',
    '<<=':'B1D',
    // Agrega otros operadores y sus combinaciones de opcodes
  };

  const simple = /^([a-z]?[$&]\w+|\d+@[a-z]?|-?\d+(\.\d+)?)\s*(=(#|&)|[+\-]=@|[\/\*\+\-\=\!><]*=|>|<)\s*([a-z]?[$&]\w+|\d+@[a-z]?|-?\d+(\.\d+)?|".*"|'.*')$/im
  
  function dividirOperacion(operacion) {
    const partes = operacion.dividirCadena()
    
    if (partes) {
      return partes
    } else {
      return new Error('La operación no es válida')
    }
  }

  let [
    variable1, operador, variable2
  ] = dividirOperacion(operacion)
  
  let esNegado = /\<=|<|<>|\!=/.test(operador)
  if (esNegado){
    operador = operador
    .replace('<=', '>')
    .replace('<', '>=')
    .replace(/\<>|\!=/, '==')
  }
  
  if (!(operador in opcodes)){
    throw new SyntaxError(
      'Operador undefined\n>>> '
      +operador+ '\n'
      +_lineaInvocada+':'
      +((variable1.length + operador.length + 1)+'')
      +' | >> '+operacion)
  }
  
  // Para saber el tipo de datos y prevenir que el tipo de dato cambie cuando se aplica a la misma variable.
  let tipoVariable1 = obtenerTipo(variable1);
  let tipoVariable2 = variable1 == variable2
    ? tipoVariable1
    : obtenerTipo(variable2)
  
  
  // Para establecer el tipo de variable, segun el tipo de dato primitivo INT o FLOAT.
  if (/INT/.test(tipoVariable1)
    && /FLOAT/.test(tipoVariable2)
  ){
    tipoVariable2 == "FLOAT"
    ? tipoVariable1 = tipoVariable1.replace("INT","FLOAT")
    : tipoVariable2 = tipoVariable2.replace("FLOAT","INT")
  }
  else if (/FLOAT/.test(tipoVariable1)
    && /INT/.test(tipoVariable2)
  ){
    tipoVariable2 == "INT"
    ? tipoVariable1 = tipoVariable1.replace("FLOAT","INT")
    : tipoVariable2 = tipoVariable2.replace("INT","FLOAT")
  }
  else if (!/SHORTSTRING/.test(tipoVariable1)
    && /SHORTSTRING/.test(tipoVariable2)
  ){
    tipoVariable1 = tipoVariable1.r(/INT|FLOAT|LONGSTRING/,"SHORTSTRING")
  }
  else if (!/LONGSTRING/.test(tipoVariable1)
    && /LONGSTRING/.test(tipoVariable2)
  ){
    tipoVariable1 = tipoVariable1.r(/INT|FLOAT|SHORTSTRING/,"LONGSTRING")
  }
  
  if (operador == '=#'){
    // Para convertir un tipo a otro, es necesacio que sean diferentes, y no queremos que se recambie el tipo de dato si usamos la misma variable. ¿Oh si?
    if (tipoVariable1 == tipoVariable2){
      if (/GVAR/.test(tipoVariable2)){
        tipoVariable2 = tipoVariable2 == "GVAR_FLOAT"
          ? "GVAR_INT"
          : "GVAR_FLOAT"
      } else {
        tipoVariable2 = tipoVariable2 == "LVAR_FLOAT"
          ? "LVAR_INT"
          : "LVAR_FLOAT"
      }
    }
  }
  
  if (operador.i('=@/')){
    tipoVariable1 = tipoVariable1.replace('INT', 'FLOAT')
    tipoVariable2 = tipoVariable2.replace('INT', 'FLOAT')
  }
  
  const combinacionTipos = `${tipoVariable1}-${tipoVariable2}`
  
  let opcode = opcodes[operador][combinacionTipos];

  if (!opcode) {
    throw new Error('Invalid operation\n>>> '+operacion);
  }

  // Registrar solo las variables, no los números literales
  registrarTipo(variable1, tipoVariable1);
  registrarTipo(variable2, tipoVariable2);
  
  if (variable1 != variable2){
    if (tipoVariable1 == tipoVariable2)
      registrarTipo(variable2, tipoVariable2);
    else
      registrarTipo(variable2, tipoVariable1);
  }
  
  if (esNegado){
    opcode = (parseInt(opcode, 16) | 1 << 15)
      .toString(16)
      .toUpperCase()
  }
  opcode = opcode.padStart(4,'0')
  
  //console.log({opcode, variable1, tipoVariable1, operador, variable2, tipoVariable2})
  
  return opcode;
}

SP.operationsToOpcodes = function () {
  const simple = /^([a-z]?[&$]\w+|\d+@[a-z]?|-?\d+(\.\d+)?)\s*(=(#|&)|[+\-]=@|[\/\*\+\-\=\!><]*=|>|<)\s*([a-z]?[$&]\w+|\d+@[a-z]?|-?\d+(\.\d+)?)$/im
  
  const addition = /^(\d+@\w?|\w?[$&]\w+|\w+)\s*(\+\+|--)$/
  
  const resultado = this.split('\n').map(linea => {
    linea = linea.trim()
    
    let parametros = linea.dividirCadena()
    
    
    if (parametros.length == 3
      && Input.isValueConstant(parametros[0])
      && Input.isOperation(parametros[1])
      && Input.isValueConstant(parametros[2])
    ) {
      // Procesar la línea con la operación
      const opcodeDetectado = detectarOpcode(linea)
      return `${opcodeDetectado}: ${linea}`
    }
    else if (addition.test(linea)) {
      const operation = linea.i('++') ? '+=' : '-='
      linea = linea.r(/\-\-|\+\+/)
      
      if (linea.toUpperCase() in CONSTANTS){
        linea = CONSTANTS[linea.toUpperCase()]
      }
      
      const tipo = obtenerTipo(linea).i('FLOAT') ?
        '1.0' :
        '1'
     
      linea = `${linea} ${operation} ${tipo}`
      const opcodeDetectado = detectarOpcode(linea)
      
      return `${opcodeDetectado}: ${linea}`
    }
    else {
      // Mantener la línea original si no es una operación
      return linea
    }
  }).join('\n')
  
  return resultado
}

const regexVAR_ARRAY =
  /([a-z]?(\$|\&)\w+|\d+@[a-z]?|\w+)\((\$\w+|\d+@|\w+)\s*([,\s]+\w+)?\)/gi;
  
SP.transformTypeData = function(){
  const nString = this.split('\n').map(line=>{
    
    line = line
      // NORMALIZADO DE ARRAYS
      .r(regexVAR_ARRAY, input =>{
        
        input = input.r(/\s/g,'')

        let arr = input.match(/(\$\w+|\d+@|\w+)/)[1]
        let index = input.match(/\((\$\w+|\d+@|\w+)/)[1]
        
        let output = ''
        if (!Input.isVariable(arr)
        || !Input.isVariable(index)){
          
          let size = input.match(/,\s*(\w+)\)/)
          size = size ? size[0] : ',20)'
          
          if (/^\w+$/m.test(index)) {
            if (Input.isConstant(index)){
              index = CONSTANTS[index.toUpperCase()]
            }
          }
          if (/^\w+$/m.test(arr)) {
            if (Input.isConstant(arr)) {
              arr = CONSTANTS[arr.toUpperCase()]
            }
          }
          if (Input.isVariable(arr)
          && Input.isVariable(index)){
            output = arr + '(' + index + size
          }else {
            throw new Error('>>> ILL-DEFINED ARRAY:\nYou misspelled some ARRAY constant you are trying to use.\n\t`' + input +'`')
          }
        }
        
        return output != '' ? output : input
      })
      
      
    line = line.dividirCadena()
    
    //log(line)
    // Este bloque autocompleta la información de los ARRAYS incompletos, como el tipo y el tamaño.
    if (line.length == 3){
      const typeDetected = Input.getTypeCompile(line[2])
      
      if (Input.isArray(line[0])
      && Input.isOperation(line[1])
      && typeDetected){
        const dataArray = line[0].split(',')
        if(/[a-z]/i.test(dataArray[1]) == false){
          line[0] = line[0]
          .r(')', type => {
            
            switch (typeDetected){
              case 'int': type = 'i'; break;
              case 'float': type = 'f'; break;
              case 'short': type = 's'; break;
              case 'long': type = 'v'; break;
              default: type = 'i';
            }
            
            return type + ')'
          })
        }
      }
    }
    
    //log(line)
    
    return line.map(param =>{
      let isN = param.i('-') ? '-' : ''
      
      if (Input.isAdmaVar(param)){
        return param.r('&','$')
      }
      if (Input.isNote(param)){
        return (+param)+""
      }
      
      param = param
      .r(/^-?\.?\d+(\.\d+)?(ms|[smh]|fps)$/mi, second => {
        second = second.toLowerCase().r('-')
        
        if (second.i('fps'))
          second = (~~(1000 / (+second.r('fps', ''))))+""
        if (second.i('ms'))
          second = second.r('ms')
        if (second.i('s'))
          second = (~~(+second.r('s', '') * 1_000))+""
        if (second.i('m'))
          second = (~~(+second.r('m', '') * 60_000))+""
        if (second.i('h'))
          second = (~~(+second.r('h', '') * 3_600_000))+""
        
        return isN+second
      })
      .r(/^-?\.?\d([\._\df]+)?(\.[_\df]+)?$/mi, num=>{
        return num
        .r(/_/g,'')
        .r(/(\.|f)$/mi,'.0')
        .r(/^\./m, '0.')
      })
      .r(/^-?0b\d+$/im, bin => {
        if (/^-?0b[01]+$/im.test(bin)){
          return isN+(+bin.r('-'))
        }
       	throw new SyntaxError("Secuencia BIN: Solo usar caracteres del rango 0-1")
      })
      .r(/^-?0o\d+$/im, oct => {
        if (/^-?0o[0-7]+$/im.test(oct)){
          return isN+(+oct.r('-'))
        }
       	throw new SyntaxError("Secuencia OCT: Solo usar caracteres del rango 0-7")
      })
      .r(/^(-?0x\w+)$/im, hex => {
        if (/^-?0x[0-9a-f]+$/im.test(hex)){
          return isN+(+hex.r('-'))
        }
        throw new SyntaxError("Secuencia HEX: Solo usar caracteres del rango 0-9 y del A-F.")
      })
      .r(/^c#\w+$/mi, color =>{
        color = color.slice(2)
        
        if (color.length == 1){
          color = ''+color+color+color
        }
        if (color.length == 2 || color.length >= 5){
          throw new Error("Interprete color:\n\tLas longitudes validas son; 1, 3, 4, 6 y 8.")
        }
        if (color.length <= 4){
          color = color
          .split('').map(x => x+x).join('')
        }
        
      	color = color.match(/.{1,2}/g).map(
      	  e => +('0x'+e)
      	).join(' ')

        return color
      })
      .r(/^#\w+$/mi, model =>{
      	model = model.r('#','').toUpperCase()
      	
      	if (model in MODELS) {
      	  model = MODELS[model]
      	} else {
      		throw new Error(`Model undefined: #${model}`);
        }
        return model
      })
      return param
    }).join(' ')
  }).join('\n')
  
  
  return nString
}

SP.constantsToValue = function(){
  const nString = this.split('\n').map(line=>{
    line = line.dividirCadena().map(param=>{
      let paramOriginal = param
      param = param.trim()
      
      let pref = ""
      if (param != ''){
        if (/^[\!\-\+]\w+$/m.test(param)){
          pref = param.match(/^\W/m)
          param = param.r(/^\W/m)
        }
        
        if (param.toUpperCase() in CONSTANTS){
          return pref + CONSTANTS[param.toUpperCase()]
        }
        else if (
          /^[a-z]\w+\.\w+$/im.test(param)
        ) {
          let [head, extend] = param.split('.').map(a => {
            return a.toUpperCase()
          })
          let ret = ''
          
          if (
            head in CUSTOM_ENUM 
            && extend in CUSTOM_ENUM[head]
          ){
            ret = CUSTOM_ENUM[head][extend]
          }else{
            ret = param
          }
          
          return pref + ret
        }else {
          return paramOriginal
        }
        //else if (/^[+\-=^&$*]/)
          
        return param
      }
      return param
    }).join(' ')
    
    return line
    
  }).join('\n')

  
	
  return nString
}

/*
CurrentWeapon(0@) = 23 // 01B9: 0@ 23
0@ = CurrentWeapon(1@) // 0470: 0@ 1@
CurrentWeapon(0@) == 34 //02D8: 0@ 34
CurrentWeapon(0@) > 34 //02D7: 0@ 34
*/

SP.classesToOpcodes = function(){
  //console.clear()
  const MATCH = {
    CLASSE_MEMBER: /(\w+)\.(\w+)\((.+)?\)/m,
    OPERATION: /(==|\+=|=|>)/,
    VARIABLE: "(\d+@(\w|(\([\(\)]+\)))?|\w?($|&)\w+(\([\(\)]+\)))?)",
    
    SIMPLE: /^(\w+)\.(\w+)\(([^\n]*)\)$/mi,
    CONTINUE: /^\.(\w+)\((.+)?\)$/mi,
    METHOD: /^(\w+)?\.(\w+)$/mi,
    
    SET: /\.[^(]+\(.+=/,
    GET: /=.+\.[^(]+\(/,
    IS: /\.[^=]+==/,
    UPPER: /\.[^>]+>/,
  }
  
  let ncode = ''
  let lastClass = ''
  
  this.split('\n').forEach(line =>{
    line = line.trim()
    
    let isClass = false
    if (/([a-z]\w+)?\.([a-z]\w+)/i.test(line)){
      line.match(/([a-z]\w+)?\.([a-z]\w+)/ig).forEach(c=>{
        c = c.match(/([a-z]\w+)?\.([a-z]\w+)/i)
        
        if (!isClass){
          if(c[1] == undefined){
            if (lastClass){
              c[1] = lastClass
            } else {
              throw new Error("CLASS UNDEFINED:\n>> "+line)
            }
          }else {
            lastClass = c[1]
          }
          isClass = Input.isClass(c[1]+'.'+c[2])
        }
      })
    }
    
    if (isClass){
    let isNegative = line.startsWith('!');
    if (isNegative) line = line.r('!');
    
    let opcode = null;
    
    let data = {}
    let h
    
    if (MATCH.METHOD.test(line)){
      let matching = [];
      
      [line, ...matching] = line.match(MATCH.METHOD)
      
      matching = matching.map(e=>{
        return e ? e.toUpperCase() : ""
      })
      
      if (matching[0] == ""){
        matching[0] = lastClass
      } else {
        lastClass = matching[0]
      }
      
      if (!(matching[0] in classes)) {
        throw new Error("CLASS UNDEFINED:\n>> " + matching[0])
      }
      if (!(matching[1] in classes[matching[0]])) {
        throw `MEMBER UNDEFINED:\n>> ${matching[0]}.${matching[1]}`
      }
      let opcode = classes[matching[0]][matching[1]]
      
      if (typeof opcode == "object") {
        if (Object.keys(opcode).length >= 2) {
          throw `METHOD NOT AVAILABLE:\nMethods must be written with their class.\n>> ${matching[1]}`
        }
        else {
          opcode = Object.values(opcode)[0]
        }
      }
      line = opcode+':'
    }
    
    if (MATCH.CONTINUE.test(line)){
      line = lastClass+line
    }
    
    if (MATCH.CLASSE_MEMBER.test(line)){
      [h,data.clase, data.miembro, data.resto] = line.match(MATCH.CLASSE_MEMBER)
      data.clase = data.clase.toUpperCase()
      data.miembro = data.miembro.toUpperCase()
      
      
      data.operador = "FUNC"
      let iset;
        if(MATCH.IS.test(line)) {
          iset = line.match(
            /\((.+)\)(.+)?[=!]=(.+)/
          )
          if (line.i('!=')){
            isNegative = true
          }
          
          data.paramFront = iset[1]
          data.paramRear = iset[3]
          data.operador = "IS"
        }
        else if(MATCH.UPPER.test(line)) {
          iset = line.match(
            /\((.+)\)(.+)?[><](.+)/
          )
          if (line.i('<')){
            isNegative = true
          }
          
          data.paramFront = iset[1]
          data.paramRear = iset[3]
          data.operador = "UPPER"
        }
        else if (MATCH.GET.test(line)) {
          iset = line.match(
            /(.+)=(.+)\((.*)\)/
          )
          
          data.paramFront = iset[3]
          data.paramRear = iset[1]
          data.operador = "GET"
        }
        else if(MATCH.SET.test(line)) {
          iset = line.match(
            /\((.+)\)(.+)?=(.+)/
          )
          
          data.paramFront = iset[1]
          data.paramRear = iset[3]
          data.operador = "SET"
        }
      
      
      if (!(data.clase in classes)) {
        throw new Error("CLASS UNDEFINED:\n>> " + matching[0])
      }
      lastClass = data.clase
      if (!(data.miembro in classes[data.clase])) {
        throw `MEMBER UNDEFINED:\n>> ${matching[0]}.${matching[1]}`
      }
      
      let queEs = classes[data.clase][data.miembro]
      
      if (data.operador == "FUNC"){
        if (typeof queEs == "object") {
          if (Object.keys(queEs).length >= 2) {
            throw `METHOD NOT AVAILABLE:\nMethods must be written with their class.\n>> ${data.miembro}`
          }
          else {
            queEs = Object.values(queEs)[0]
          }
        }
        line = queEs + ': ' + data.resto
      }
      else {
        if (typeof queEs == "object") {
          line = Object.values(queEs)[0]
        } else {
          line = queEs
        }
        line += ': ' + data.paramFront + " " + data.paramRear
      }
    }
    
    let depureLine = ''
    let inString = false
    for (let i = 0; i < line.length; i++){
      if (
        line[i] == '"'
        || line[i] == "'"
        || line[i] == '`'
        || line[i] == '('
        || line[i] == ')'
      ){
        inString = !inString
      }
      
      if (line[i] == ','){
        if (inString == true){
          depureLine += line[i]
        } else {
          depureLine += ' '
        }
      }else{
        depureLine += line[i]
      }
    }
    line = depureLine
    
    
    if (isNegative){
      line = line
      .r(/^([\w\d]+):/im, (input, mat)=>{
        let op = mat.setOpcodeNegative()
        return op+': '

      })
    }
    }
    
    ncode += line + '\n'
  })
  
  return ncode
}


SP.keywordsToOpcodes = function(){
  let nString = ''
  
  this.split('\n').forEach(line => {
    let isNegative = false
    let nLine = ''
    
    let params = line.dividirCadena()
    let ok = true
    let change = false
    // SCM_DB
    params.forEach((param, pos) => {
      if (ok == true 
      && (pos == 0 || pos == (params.length-1))
      && /^\!?[a-z]\w+/mi.test(param)){
          ok = false
          if (pos == (params.length-1)){
            change = true
          }
          
          let isNegative = param[0] == '!'
          let keyword = /^\!?(\w+)/m.exec(param)[1].toLowerCase()
            
          if (keyword in SCM_DB2){
            
            param = SCM_DB2[keyword].opcode ?? SCM_DB2[keyword].id ?? SCM_DB2[keyword]
            
            if (typeof SCM_DB2[keyword] == 'string'){
              
            }
            if (isNegative){
              param = param.setOpcodeNegative()
            }
            
            param = param +': '
          }
          
        
      }
      if (change)
        nLine = param +' '+ nLine
      else
        nLine += param +' '
    })
		
    nString += nLine.trim() + '\n'
  })
  
  return nString
}

SP.dividirCadena = function() {
    const resultado = [];
    let dentroComillas = false;
    let subcadenaActual = '';
    let comilla = 0

    for (let i = 0; i < this.length; i++) {
        const caracter = this[i];
        const caracterAnterior = this[i-1];

        if (caracter === '"' || caracter === "'" || caracter === "`"){
          if (caracterAnterior != '\\') {
             dentroComillas = !dentroComillas;
          }
          
          subcadenaActual += caracter;
        } else if (
          ( caracter === ' '
          || caracter === '\n'
          || caracter === '\t'
          ) && !dentroComillas) {
            // Si encontramos un espacio fuera de las comillas, guardamos la subcadena actual
            if (subcadenaActual.trim() !== '') {
                resultado.push(subcadenaActual);
            }
            subcadenaActual = '';
        } else {
            subcadenaActual += caracter;
        }
    }

    // Al final, si hay una subcadena no vacía, la agregamos al resultado
    if (subcadenaActual.trim() !== '') {
        resultado.push(subcadenaActual);
    }
    return resultado;
}

SP.autoAddCleoFunction = function(){
  let code = this
  if (CLEO_FUNCTIONS.MATH.INT_INT){
    code += `\n:MATH_INT_INT
    if 0@i == 1@i
    then ret 1 true
    else ret 1 false
    end
    ret 0\n`
  }
  if (CLEO_FUNCTIONS.MATH.FLOAT_FLOAT){
    code += `\n:MATH_FLOAT_FLOAT
    if 0@f == 1@f
    then ret 1 true
    else ret 1 false
    end
    ret 0\n`
  }
  return code.formatScript()
}
SP.fixOpcodes = function(){
  let tm = this.split('\n').map(line => {
    if (/^X\w+: /mi.test(line)){
     line = line.r(/^(X\w+):(.+)/, (...i ) => {
      if (i[1] == 'XXX0')i[1]= '0AB1: @MATH_INT_INT 2';
      if (i[1] == 'XXX1')i[1]= '0AB1: @MATH_FLOAT_FLOAT 2';
     
      return i[1] + i[2]
     })
     return line
    }
    else {
      let negado = false
      line = line.trim().dividirCadena()
      
      
      if (line.length >= 1){
        if (line[0].length < 5 && line[0].endsWith(':')){
          line[0] = line[0].r(/:$/m)
          if (line[0].startsWith('!')){
            line[0] = line[0].r(/^\!/m)
            .setOpcodeNegative()
          }
          line[0] = (line[0]+'').padStart(4, '0') + ':'
        }
        
      }
      
      line = line.join(' ')
      return line
    }
  }).join('\n')
  
  return tm
}

SP.determineOperations = function(){
  let h = this.split('\n')
  let n = ''
    
  h.forEach(s => {
    let o = s
    s = s.trim()
    
    let negado = /^\!/m.test(s) ? 0 : 1
    s = s.r(/^\!/m)
    
    if (Input.isVariable(s)) {
      s = s +' == '+ negado
    }else{
      s = o
    }
    
    n += s + '\n'
  })
  return n
}

let Input = {
  isLong: x => /^".*"$/m.test(x),
  isShort: x => /^'.*'$/m.test(x),
  isFormat: x => /^`.*`$/m.test(x),
  isString : x => {
    return (Input.isLong(x)
    || Input.isShort(x)
    || Input.isFormat(x))
  },
  isInt : x => /^[+-]?\d[\d_]*$/m.test(x),
  isFloat : x => /^[+-]?(\.\d[\d_]*|\d[\d_]*[f\.][\d_]*)$/mi.test(x),
  isNote: x => /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)$/m.test(x),
  isTime: x => /^[+-]?(\d+\.\d+|\.?\d+)(fps|[smh])$/.test(x),
  isHexInt: x => /^0x[\da-f]+$/im.test(x),
  isHexFloat: x => /^0x[\da-f]+(\.[\da-f]*)?p[+-]?\d+$/im.test(x),
  isHex: x => Input.isHexInt(x) ?? Input.isHexFloat(x),
  isBin: x => /^0b[01]+$/im.test(x),
  isOct: x => /^0o[0-7]+$/im.test(x),
  isModel: x => /^#\w+$/m.test(x),
  isNumber: x => {
    return (Input.isTime(x)
    || Input.isNote(x)
    || Input.isFloat(x)
    || Input.isInt(x)
    || Input.isBin(x)
    || Input.isOct(x)
    || Input.isHex(x))
  },
  isOpcode: x => /^[a-f\d]+:$/mi.test(x),
  isKeyword: x => {
    if (/^[a-z]\w*$/mi.test(x)){
      let keys = `while,end,if,then,else,repeat,until,for,int,float,string,short,long`.split(',')
      
      if (keys.i(x)){
        return true
      }
      
      return SCM_DB2[x]
    }
    return false
  },
  isClass: x => {
    x = x.toUpperCase()
    let m =
      x.match(/^([a-z]\w*)\.([a-z]\w*)\(([^\n]*)\)$/mi)
      || x.match(/^([a-z]\w*)\.([a-z]\w*)$/mi)
    if (m){
      return (m[1] in classes && m[2] in classes[m[1]])
    }
    return false
  },
  isCommand: x => {
    return (Input.isOpcode(x)
    || Input.isKeyword(x)
    || Input.isClass(x))
  },
  isConstant: x => {
    if (/^\w+$/mi.test(x)){
      x = x.toUpperCase()
      
      return x in CONSTANTS
    }
    return false
  },
  isEnum: x => {
    x = x.toUpperCase()
    let m = x.match(/^([a-z]\w*)\.(\w*)$/mi)
    
    if (m){
      return (m[1] in CUSTOM_ENUM && m[2] in CUSTOM_ENUM[m[1]])
    }
    return false
  },
  isValueSimple: x => {
    return (Input.isConstant(x)
    || Input.isEnum(x))
  },
  isLocalVar: x => {
    return /^\d+@[a-z]?$/im.test(x)
  },
  isGlobalVar: x => {
    return /^[a-z]?\$\w+$/im.test(x)
  },
  isAdmaVar: x => {
    return /^[a-z]?&\d+$/im.test(x)
  },
  isLocalVarArray: x => /^\d+@[a-z]?(\(.+(,\d+[a-z]?)?\))$/im.test(x),
  isGlobalVarArray: x => /^[a-z]?\$\w+(\(.+(,\d+[a-z]?)?\))$/im.test(x),
  isAdmaVarArray: x => /^[a-z]?&\d+(\(.+(,\d+[a-z]?)?\))$/im.test(x),
  isNegate: x => /^\!.+/m.test(x),
  isNegative: x => /^\-.+/m.test(x),
  isPositive: x => /^\+.+/m.test(x),
  isOperation: x => /^([\!=^~<>%+*/-]+|=#|[+-]=@|=&)$/.test(x),
  isVariable : x => {
    return (Input.isLocalVar(x)
    || Input.isGlobalVar(x)
    || Input.isAdmaVar(x)
    || Input.isLocalVarArray(x)
    || Input.isGlobalVarArray(x)
    || Input.isAdmaVarArray(x))
  },
  isArray : x => {
    return (Input.isLocalVarArray(x)
    || Input.isGlobalVarArray(x)
    || Input.isAdmaVarArray(x))
  },
  isLabel : x => /^[:@]\w+$/m.test(x),
  isValueConstant : x => {
    return (Input.isValueSimple(x)
    || Input.isNumber(x)
    || Input.isString(x)
    || Input.isVariable(x))
  },
  isValid: x => {
    return (Input.isCommand(x)
    || Input.isNumber(x)
    || Input.isString(x)
    || Input.isVariable(x)
    || Input.isValueSimple(x)
    || Input.isLabel(x))
  },
  getTypeData: x => {
    if (Input.isLabel(x)) return 'label';
    if (Input.isCommand(x)) return 'command';
    if (Input.isNumber(x)) return 'number';
    if (Input.isString(x)) return 'string';
    if (Input.isVariable(x)) return 'variable';
    if (Input.isValueSimple(x)) return 'constant';
    if (Input.isOperation(x)) return 'operation';
    else return undefined
  },
  getTypeCompile: x => {
    if (Input.isLabel(x)) return 'label';
    if (Input.isInt(x)) return 'int';
    if (Input.isFloat(x)) return 'float';
    if (Input.isShort(x)) return 'short';
    if (Input.isLong(x)) return 'long';
    if (Input.isFormat(x)) return 'long';
    if (Input.isLocalVar(x)) return 'lvar';
    if (Input.isGlobalVar(x)) return 'gvar';
    if (Input.isAdmaVar(x)) return 'avar';
    if (Input.isLocalVarArray(x)) return 'lvararray';
    if (Input.isGlobalVarArray(x)) return 'gvararray';
    if (Input.isAdmaVarArray(x)) return 'avararray';
    else return undefined
  }
}

SP.removeTrash = function(){
  let nCode = ''
  let code = this.split('\n')
  code.forEach((line, ln) => {
    
    let nLine = ''
    let params = line.dividirCadena()
    
    
    params.forEach((param, pr) =>{
      if (params.length > 1){
      if (/^[=\-\+\/~^*!?%&|]+$/mi.test(param)) {
			  param = ''
		  }
		  else if (/^[a-z]\w+$/mi.test(param)) {
			  if (!Input.isConstant(param)){
			    param = ''
			  }
			}
      }
			nLine += param + ' '
      
    })
    
    nCode += nLine.r(/\x20+/g, ' ').trim() + '\n'
  })
  
  return nCode
}

SP.parseHexEnd = function(){
  let inHex = false
  let inStart = false
  
  let resultv2 = this.split('\n').map((line, lineNumber)=>{
    line = line.trim()
    if (/hex/i.test(line)){
      if (inHex) {
        throw new HexError('Re-declared hexadecimal sequence\n\t>>> '+lineNumber)
      }
      else {
        inHex = true
        line = ''
      }
    }
    if (/end/i.test(line)){
      if (inHex){
        inHex = false
        inStart=false
        line = ''
      }
      
    }
    if (inHex){
      inStart = true
      line = line.dividirCadena().map(e => {
        let multiplicado = 1
        let addNull
        if (/\(.+\)/.test(e)){
          multiplicado = e.match(/\((.+)\)/)[1]
          
          function evaluaAritmetica(expresion) {
            return new Function('return ' + expresion)();
          }
          
          multiplicado = Math.round(evaluaAritmetica(multiplicado))
          
          e = e.r(/\(.+\)/, '')
        }
        else if (/^['"`].+['"`]$/m.test(e)){
          addNull = e.i("'") ? true : false;
          
          e = e.r(/^['"`](.+)['"`]$/m, '$1')
          .parseCharScape()
          .toUnicode()
          .r(/-/g)
        }
        
        if (e.length % 2 != 0) {
          e = '0' + e
        }
        
        if (multiplicado > 1){
          e = e.repeat(+multiplicado)
        }
        
        if (addNull) e += '00';
        
        return e
      }).join('')
    }
    if (inStart && line != ''){
      line = '['+line+']'
      inStart = false
    }
    return line
  }).clear().join('\n')
  
  return resultv2
}

SP.adaptarCodigo = function(){
  registroTipos = {}
  let result = this
    .removeComments()
    .transformTypeData()
    .parseHexEnd()
    .preProcesar()
    .formatScript()
    .autoAddCleoFunction()
    .parseHigthLevelLoops()
    .addBreaksToLoops()
    .addNumbersToIfs()
    .removeComments()
    .r(/^not /gm, '!')
    .classesToOpcodes()
    .constantsToValue()
    .transformTypeData()
    .determineOperations()
    .operationsToOpcodes()
    .keywordsToOpcodes()
    .fixOpcodes()
    .removeTrash()

   return result
}

SP.Translate = function(_SepareWithComes = false, _addJumpLine = false){
	let LineComand = this

	const come = a => {
		if (_SepareWithComes){
			return a + ','
		}
		return a
	}

	let codeDepurated = []
	
	// Para registrar los bites que se escribieron y
	//   para guardar las etiquetas para los controles
	//   de saltos.
	let registeredBites = []
	// Si se escribe 0xFF00 entonces va el 2
	//   registeredBites.push(2)
	// Si es una etiqueta, solo se le quitan los 2 puntos
	//   y se manda push() a lo que sea.
	
	
	function translateLvar(dataInput){
  	dataInput = 
  		Number(dataInput.r(/@[a-z]?/i,''))
  		.toString(16)
  		.padStart(4,'0')
  		.toBigEndian();
  
  	return dataInput
  }
  function translateAvar(dataInput) {
    let tempNumber = dataInput
    dataInput = Number(dataInput.r(/[a-z]?\&/i, ''))
  
    if (isNaN(dataInput)) throw new SyntaxError(`NAN parameter\n\tparameter ${tempNumber}\n\tat line ${numLine}\n\t\topcode ${setOp == '0000' ? 'autodefined' : setOp} ${command.toUpperCase()}`);
    
    dataInput = dataInput.toString(16)
      .substring(0, 4)
      .padStart(4, '0')
      .toBigEndian()
    
    return dataInput
  }
  function translateGvar(dataInput) {
    dataInput = dataInput.r(/[a-z]?\$/i, '')
  
    if (/[a-z]/i.test(dataInput)) {
      let coincide = false
  
      if (CUSTOM_VARIABLES[dataInput.toUpperCase()] != undefined) {
        coincide = CUSTOM_VARIABLES[dataInput.toUpperCase()] * 4
      }
  
      if (!coincide) {
        dataInput = parseInt(Number(String(parseInt(dataInput, 35)).substring(0, 4) / 2))
        if (dataInput > 1000) dataInput /= 5
        if (dataInput > 500) dataInput /= 2
        dataInput = parseInt(dataInput)
      }
      else {
        dataInput = coincide
      }
    }
    else {
      dataInput = dataInput * 4
    }
  
    dataInput = dataInput.toString(16)
      .substring(0, 4)
      .padStart(4, '0')
      .toBigEndian()
  
    return dataInput
  }

  LineComand = LineComand
  .adaptarCodigo()
	.split('\n')
	.clear()
  
	LineComand.forEach((Line, numLine) => {
	  Line = Line.trim()
	  
	  let lineDepurated = []
	  let setOp = ''
	  let isNegative = false
	  let command = ''
	  let typeData = ''
	  let currentOpcode = ''
	  
	  let charsCounter = 0
		if (Line.match(/^:/)) {
		  // si es una etiqueta
			registeredBites.push(Line.r(':','').toUpperCase())
		}
		else if(Line.match(/^\[.*\]$/)){
		  // si es un hexadecimal
		  Line = Line.r(/^\[(.*)\]$/, '$1')
		  
		  if (/([g-z]|\W)/i.test(Line)){
        throw new SyntaxError(`Just input hexadecimal\n\tPosible line: ${numLine}`)
      }
		  if (Line.length != 0){
		    registeredBites.push(Line.length / 2)
		    codeDepurated.push(come(Line))
		  }
		}
		else {
			LineComand[numLine] = Line.dividirCadena()
			.map(data => {
			  data = data.trim()
			  if (/^[=!\-+*\/%\^#@<>&$\\]+$/mi.test(data)) {
			       data = ''
			  }
			  return data
			})
			LineComand[numLine].forEach((Argument, numArgument) => {
			  
				if (numArgument >= 1) {
					if (/^[=!\-+*\/%\^#@<>&$]+$/mi.test(Argument)) {
						LineComand[numLine][numArgument] = ''
					}
				}
			})
			LineComand[numLine] = LineComand[numLine].clear()
			
			LineComand[numLine].forEach((Argument, numArgument) => {
			  charsCounter += Argument.length
			  
				if (numArgument == 0) { // command
					Argument = Argument.toLowerCase()
					if (/:/.test(Argument)){
						Argument = Argument.padStart(6,'0')
					}
					
					if ( // is opcode
						/[a-f\d]+:$/im.test(Argument)
						&& Argument.length <= 6
					){
						// is opcode
						Argument = Argument.r(':','').r('!', '8').padStart(4,'0')
						Argument = Argument.length > 4 ? Argument.r(/^./m,'') : Argument
						setOp = Argument

						if(/^[8-9A-F]/mi.test(Argument)){
							isNegative = true
							setOp = setOp.setOpcodePositive()
						}


						Object.entries(SCM_DB).every(([key, value]) => {
						  if (value.opcode == setOp) {
							Argument = key
							return false
						  }
						  return true
						})
						
            currentOpcode = setOp
						if (isNegative){
						  
							setOp = setOp.setOpcodeNegative()
						}

					}else{ // is keyword
						// is keyword
						if(Argument[0] == '!'){ // is negative
							Argument = Argument.r('!','')
							isNegative = true
						}

						if (x[Argument]){
							setOp = SCM_DB2[Argument]
						}else{
							
							if (Line.endsWith('=')){
							  throw new SyntaxError(`missing parameter\n\tin line ${numLine} the trigger ${Argument}\n\t${setOp == '0000' ? 'XXXX' : setOp} >> ${Line}`)
							}
							else if (Line === 'hex'){
							  throw new SyntaxError(`missing closure\n\t>>> hex[...]end\n${charsCounter} | ${numLine}`)
						  }
						  else {
							  throw new SyntaxError(`opcode undefined\n>>> ${Argument}\n${numLine}:${charsCounter} | ${setOp == '0000' ? 'XXXX' : setOp} >> ${Line}`)
							};
						}
            
            currentOpcode = setOp
						if (isNegative){
							setOp = setOp.setOpcodeNegative()
						}
					}
					lineDepurated.push((_addJumpLine ? '\n' : '') + setOp.toBigEndian())
					
					command = Argument
					
					registeredBites.push(2)
					currentOpcode = currentOpcode.toUpperCase()
					
					// Este ultimo bloque es para saber
					//   si faltan parametros o hay de más 
					let tempOp = currentOpcode.toLowerCase()
					
					
					if (SCM_DB2[currentOpcode.toLowerCase()] == undefined){
					  
					  SCM_DB2[currentOpcode.toLowerCase()] = {
					    num_params: Line.dividirCadena().length-1
					  }
					}
					
					if (!
					  SCM_DB2[currentOpcode.toLowerCase()].variable
					){
					if (LineComand[numLine].length-1 < SCM_DB2[tempOp].num_params) {
					  // si faltan parametros, se muestra un error
					  throw new Error(`missing parameters\n>>> ${Argument}\n${numLine}:${charsCounter} | ${setOp == '0000' ? 'XXXX' : setOp} >> ${Line}`)
					}
					if (
					  LineComand[numLine].length-1
					  > SCM_DB2[tempOp].num_params
					) {
					  // si hay parametros de mas, se borran
  			    LineComand[numLine].splice( 
  					  SCM_DB2[tempOp].num_params+1,
  					  LineComand[numLine].length
  	  		  )
					}
					}
				}
				else { // is Argument
					registeredBites.push(1)

          if (Input.isValid(Argument)){
            typeData = Input.getTypeCompile(Argument)
          }
          else {
            throw new SyntaxError(`directive undefined\n>>> ${Argument}\n${numLine}:${charsCounter-1} | ${Line}`)
          }
          
					switch (typeData) {
						case 'short':
							registeredBites.push(8)
							
							Argument = Argument
							.r(/^'(.*)'$/m, '$1')
							.parseCharScape()
							
							if (Argument.length == 0) Argument = '\x00'
							Argument = Argument.substring(0,7)

							Argument = (come(TYPE_CODE.STRING8) + (Argument.toUnicode() + '00').padEnd(16,'00'))
						break;

						case 'long':
						  if (/^".*"$/m.test(Argument)){
						    Argument = Argument
  							.r(/^"(.*)"$/m, '$1')
						  }
						  else {
						    Argument = Argument
  							.r(/^`(.*)`$/m, '$1')
						  }
							
							switch (currentOpcode){
								case '05B6' :
									Argument = Argument.substring(0,128)
								break;
								case '0674':
								case '09E2':
									Argument = Argument.substring(0,8)
								break;
							  case '038F':
							  case '09A9':
									Argument = Argument.substring(0,14)
							  break;
								case '06D1':
								case '087B':
								case '075D':
								case '075E':
								  Argument = Argument.substring(0,15)
								break;
								//case '0662':
								default:
    							Argument = Argument.substring(0,255)
    						break;
							}
							
							Argument = Argument.parseCharScape()
							
              if (Argument.length == 0) Argument = '\x00'
              
              registeredBites.push(1)
              registeredBites.push(Argument.length)
              
    					Argument = (come(TYPE_CODE.STRING_VARIABLE)
    					  + come(Argument.length.toString(16).padStart(2, '0'))
    					  + Argument.toUnicode())
						break;

						case 'int':
							if (Math.abs(Argument) > 0x7FFFFFFF)
							  throw new Error('Numero fuera de rango')

							let byte1   = 0x7F       // 127
							let byte1R  = 0xFF
							let byte2   = 0x7FFF     // 32767
							let byte2R  = 0xFFFF
							let byte4   = 0x7FFFFFFF // 2147483647
							let byte4R  = 0xFFFFFFFF

							let dataType;
              
							if (0 <= Argument) {
								if (Argument <= byte4)
								  dataType = come(TYPE_CODE.INT32);
								if (Argument <= byte2)
								  dataType = come(TYPE_CODE.INT16);
								if (Argument <= byte1)
								  dataType = come(TYPE_CODE.INT8);
							}
							else {
								if (IsInRange(Argument, -(byte1+=2), 0)) {
									dataType = come(TYPE_CODE.INT8);
								}
								if (IsInRange(Argument, -(byte2+=2), -byte1)) {
									dataType = come(TYPE_CODE.INT16);
								}
								if (IsInRange(Argument, -(byte4+=2), -byte2)) {
									dataType = come(TYPE_CODE.INT32);
								}

								Argument *= -1
								switch (dataType){
									case come(TYPE_CODE.INT8) :
										Argument -= byte1R;
										break;

									case come(TYPE_CODE.INT16) :
										Argument -= byte2R;
										break;

									case come(TYPE_CODE.INT32) :
										Argument -= byte4R;
										break;

									default: break;
								}
								Argument *= -1
								Argument++;
							}
							
							Argument = Number(Argument).toString(16).padStart((()=>{
								let temp
								switch (dataType){
									case come(TYPE_CODE.INT8) :
										temp = 2
										registeredBites.push(1)
										break;

									case come(TYPE_CODE.INT16) :
										temp = 4
										registeredBites.push(2)
										break;

									case come(TYPE_CODE.INT32) :
										temp = 8
										registeredBites.push(4)
										break;

									default: break;
								}
								return temp
							})(), '0')

							Argument = dataType + Argument.toBigEndian()
						break;

						case 'float':
							registeredBites.push(4)
							
              if(Input.isNote(Argument)){
                Argument = (+Argument)
              }
              else {
							  Argument = Argument.r('f','')
              }
              
              Argument = come(TYPE_CODE.FLOAT32) + Number(Argument).toHex()
              
						break;

						case 'lvar':
					  	registeredBites.push(2)

							Argument = 
								come(TYPE_CODE.LVAR) 
								+ translateLvar(Argument)
								
						break;
						
						case 'lvararray':
						  registeredBites.push(6)
              /*  STRUCT ARRAY
                       0006: 1@(2@, 123i) = 1
                  ____/   ___/  \__  | \     \
                  0600 08 0100 0200 7B 00 04 01
                  \__/  | \__/ \__/  |  |  \   \
                 opcode |  id   id   | lint \   \
                   lvar_array      lenght  int8  num
              */
						  let LVAR = Argument.match(
						    /(\d+)@(\w)?(\(.+\))?/i
						  )
						  let Slvar = {
						    variable: LVAR[1],
						    type: LVAR[2],
						    extend: LVAR[3]
						  }
						  if (Slvar.extend){
						    let ARRAY = LVAR[3].match(/\((.+),(\d+)(\w)?\)/i)
						    Slvar.extend = {
						      index : ARRAY[1],
						      size : ARRAY[2],
						      subtype : ARRAY[3]
						    }
						  }
						  
						  
						  let typeArray = 
						    (Slvar.type ?? Slvar.extend.subtype ?? 'i')
						  
						  let typeSet = typeArray
						  
						  //let var1 = 
						  switch (typeArray){
						    case 's':
						      typeArray = TYPE_CODE.LVAR_ARRAY_STRING8
						    break;
						    case 'v':
						      typeArray = TYPE_CODE.LVAR_ARRAY_STRING16
						    break;
						    default:
						      typeArray = TYPE_CODE.LVAR_ARRAY
						    break;
						  }
						  
						  let index = Slvar.extend.index
						  index = {
						   id: index.includes('@')
						    ? translateLvar(index.match(/(\d+)@/)[1])
						    : index.includes('&')
						    ? translateAvar(index.match(/\&(\d+)/)[1])
						    : translateGvar(index.match(/\$(\w+)/)[1]),
						   global: !index.includes('@')
						  }
						  
						  if (index.global){
						    switch (typeSet){
  						    case 's': typeSet=ELEMENT_TYPE.GSTRING8
  						    break;
  						    case 'v': typeSet=ELEMENT_TYPE.GSTRING16
  						    break;
  						    case 'i': typeSet=ELEMENT_TYPE.GINT
  						    break;
  						    case 'f': typeSet=ELEMENT_TYPE.GFLOAT
  						    break;
  						  }
						  }else{
						    switch (typeSet){
  						    case 's': typeSet=ELEMENT_TYPE.LSTRING8
  						    break;
  						    case 'v': typeSet=ELEMENT_TYPE.LSTRING16
  						    break;
  						    case 'i': typeSet=ELEMENT_TYPE.LINT
  						    break;
  						    case 'f': typeSet=ELEMENT_TYPE.LFLOAT
  						    break;
  						  }
						  }
						  
						  Argument = (
						    '['+typeArray + ','+
						    translateLvar(Slvar.variable) + ','+
						    index.id + ','+
						    Number(Slvar.extend.size)
									.toString(16)
									.padStart(2,'0') + ','+
						    typeSet + '],'
						  )
						break;

						case 'gvar':
								registeredBites.push(2)
								
								if(/\$/.test(Argument)){
									Argument = translateGvar(Argument)
								}
								else {
									Argument = translateAvar(Argument)
								}
								
                Argument = Argument.toString(16)
									.substring(0, 4)
									.padStart(4,'0')
									.toBigEndian()
						    
								Argument = come(TYPE_CODE.GVAR) + Argument
						break;
						
						case 'gvararray':
								registeredBites.push(6)
              /*  STRUCT ARRAY
                       0006: 1@(2@, 123i) = 1
                  ____/   ___/  \__  | \     \
                  0600 08 0100 0200 7B 00 04 01
                  \__/  | \__/ \__/  |  |  \   \
                 opcode |  id   id   | lint \   \
                   lvar_array      lenght  int8  num
              */
						  let GVAR = Argument.match(
						    /(\w)?\$(\w+)(\(.+\))?/i
						  )
						  let Sgvar = {
						    variable: GVAR[2],
						    type: GVAR[1],
						    extend: GVAR[3]
						  }
						  if (Sgvar.extend){
						    let ARRAY = GVAR[3].match(/\((.+),(\d+)(\w)?\)/i)
						    Sgvar.extend = {
						      index : ARRAY[1],
						      size : ARRAY[2],
						      subtype : ARRAY[3]
						    }
						  }
						  
						  
						  let typeArrayG = 
						    (Sgvar.type ?? Sgvar.extend.subtype ?? 'i')
						  
						  let typeSetG = typeArrayG
						  
						  //let var1 = 
						  switch (typeArrayG){
						    case 's':
						      typeArrayG = TYPE_CODE.GVAR_ARRAY_STRING8
						    break;
						    case 'v':
						      typeArrayG = TYPE_CODE.GVAR_ARRAY_STRING16
						    break;
						    default:
						      typeArrayG = TYPE_CODE.GVAR_ARRAY
						    break;
						  }
						  
						  let indexG = Sgvar.extend.index
						  indexG = {
						   id: indexG.includes('@')
						    ? translateLvar(indexG.match(/(\d+)@/)[1])
						    : indexG.includes('&')
						    ? translateAvar(indexG.match(/\&(\d+)/)[1])
						    : translateGvar(indexG.match(/\$(\w+)/)[1])
						   ,
						   global: !indexG.includes('@')
						  }
						  
						  if (indexG.global){
						    switch (typeSetG){
  						    case 's': typeSetG=ELEMENT_TYPE.GSTRING8
  						    break;
  						    case 'v': typeSetG=ELEMENT_TYPE.GSTRING16
  						    break;
  						    case 'i': typeSetG=ELEMENT_TYPE.GINT
  						    break;
  						    case 'f': typeSetG=ELEMENT_TYPE.GFLOAT
  						    break;
  						  }
						  }else{
						    switch (typeSetG){
  						    case 's': typeSetG=ELEMENT_TYPE.LSTRING8
  						    break;
  						    case 'v': typeSetG=ELEMENT_TYPE.LSTRING16
  						    break;
  						    case 'i': typeSetG=ELEMENT_TYPE.LINT
  						    break;
  						    case 'f': typeSetG=ELEMENT_TYPE.LFLOAT
  						    break;
  						  }
						  }
						  
						  Argument = (
						    '['+typeArrayG + ','+
						    translateGvar(Sgvar.variable) + ','+
						    indexG.id + ','+
						    Number(Sgvar.extend.size)
									.toString(16)
									.padStart(2,'0') + ','+
						    typeSetG + '],'
						  )
						break;

						case 'label':
							registeredBites.push(4)
							Argument = Argument.toUpperCase()

							Argument = come(TYPE_CODE.INT32) + `<${Argument}>`
						break;

						default:
							Argument = ''
						break;
					}

					lineDepurated.push(Argument)
				}
			})
			
			// Si un opcode es de parametros numero de opcode
			//   indefinido, se agrega un terminal-nulo
			//   para indicar el final de los parametros que
			//   se le pasan al opcode.
			if (SCM_DB2[currentOpcode.toLowerCase()].variable){
			  registeredBites.push(1)
			  lineDepurated.push(come(TYPE_CODE.TERMINAL_NULL))
			}

			codeDepurated.push(lineDepurated)
		}
	})

	let codeOfFinal = (_SepareWithComes
						  ? codeDepurated.toString().r(/,,+/g,',')
						  : codeDepurated.toString()
						    .r(/,|\-|\[|\]/g,'')
					  )
					  .r(/\./g,'').toUpperCase().trim()

	let codeOfFinalDepurated = codeOfFinal.r(/<@([^<>]+)>/g, input => {
		let found = false
		let jump = 0
		let label = input.substring(2, input.length-1)

		registeredBites.forEach(element => {
			if (!found){
				switch (typeof element){
					case 'number':
						jump += element
					break;
					case 'string':
						if (element == label){
							found = true
							jump = (0xFFFFFFFF - jump + 1).toString(16).padStart(4, 0).toUpperCase()
						}
					break;
				}
			}
		})
		if (!found) {
			throw new Error(`label not found "${label}"`)
			return "<@"+label+">"
		}

		return jump.toBigEndian()
	})
	
	return codeOfFinalDepurated
}

/** Compile and save code SCM of GTA SA
 * @param: String - Source code.
 * @param: String - Name file for can save.
 * @return: String - Preview of output code compiled.
*/
String.prototype.toCompileSCM = function(Name_File = ''){
/*
	if (Name_File.length == 0){
		throw new Error("E-00: Añada un nombre al archivo.");
		return
	}

	if(!Name_File.match(/\./)){
		throw new Error("E-01: Añada una extencion al archivo.");
		return
	}
*/
	if (this.length == 0){
		throw new Error("Add instructions to the file to be able to compile.");
		return
	}

	let code_hex = this.Translate();

	if (code_hex.length % 2 != 0) {
		throw new Error("The length of the hexadecimal string is odd.");
		return;
	}
	if (/[^0-9A-F]/i.test(code_hex)){
	  throw new Error("A non-hexadecimal character was found.")
	  return;
	}

	let binary = new Array();
	for (let i=0; i<code_hex.length/2; i++) {
		let h = code_hex.substr(i*2, 2);
		binary[i] = parseInt(h,16);
	}

	let byteArray = new Uint8Array(binary);
	let a = window.document.createElement('a');

	a.href = window.URL.createObjectURL(new Blob([byteArray], { type: 'application/octet-stream' }));
	a.download = Name_File.r('.txt','.csi');

	// Append anchor to body.
	document.body.appendChild(a)
	a.click();

	// Remove anchor from body
	document.body.removeChild(a)

	return code_hex
}



  // Escuchar el evento 'click' en todos los elementos <details>
$('details').forEach((elem) => {
  elem.addEventListener('click', function() {
    // Cerrar todos los elementos <details> excepto el que se acaba de hacer clic
    $('details').forEach((openElem) => {
      if (openElem !== this) {
        openElem.removeAttribute('open');
      }
    })
  });
});



$("details pre").forEach(e => {
  e.innerHTML = syntaxHighlight(e.innerText, e)
})