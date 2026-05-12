export function fetchPercentece(response, background,elementMirror = $('#state.loading')){
  const contentLength = response.headers.get('Content-Length');
  // Gets length in bytes (must be provided by server)
  let loaded = 0;
  // Will be used to track loading
  return new Response(
	new ReadableStream({
	// Creates new readable stream on the new response object
	  start(controller) {
	  // Controller has methods on that allow the new stream to be constructed
		const reader = response.body.getReader();
		// Creates a new reader to read the body of the fetched resources
		read();
		// Fires function below that starts reading
		function read() {
		  reader.read()
		  .then((progressEvent) => {
		  // Starts reading, when there is progress this function will fire
			if (progressEvent.done) {
			  controller.close();
			  return; 
			  // Will finish constructing new stream if reading fetched of resource is complete
			}
			loaded += progressEvent.value.byteLength;
			// Increase value of 'loaded' by latest reading of fetched resource
			const percentace = Math.round((loaded/contentLength)/120*1000)+'%'
			
			if (elementMirror)
			elementMirror.style = `background: linear-gradient(90deg, ${background} ${percentace}, transparent ${percentace});font-size:1.5rem;`;
			
			// Displays progress via console log as %
			controller.enqueue(progressEvent.value);
			// Add newly read data to the new readable stream
			read();
			// Runs function again to continue reading and creating new stream
		  })
		}
	  }
	})
  );
}

/** Smart selector for elements of the DOM
 * @param {DOMString}
 * @param {Element|Function} optional
 * @return {Element}
*/
export function $(element, _parent = document){
	const callback = _parent
	if (typeof _parent == 'function'){
		_parent = document
	}
	const xElements = _parent.querySelectorAll(element)
	const length = xElements.length

	element = element.charAt(0) === '#' && !/\s/.test(element) || length === 1
		? _parent.querySelector(element)
		: length === 0
			? undefined
			: xElements

	if (typeof callback == 'function'){
		if(element){
			if('' + element == '[object NodeList]'){ 
				element.forEach(function(e,i){
					callback(e,i)
				})
			}else{  
				callback(element)
			}
		}
	}else{
		return element
	}
}

/** Smart selector for elements of the DOM
 * @param {DOMString}
 * @return {Element}
*/
const new$ = (element, parent = 'body') => {
	let $temp = D.createElement(element)
	$(parent).appendChild($temp)
	return $temp
}

export function setCursor(element, atPosition){
  element.setSelectionRange(atPosition, atPosition);
  element.focus();
}

export function setCursorFull(element, linea, columna) {
  linea<1?linea=1:linea
  // Obtenemos el contenido del TextArea
  const contenido = element.value;

  // Calculamos la posición del cursor en función de la línea y columna
  let posicionCursor = 0;
  let lineas = contenido.split("\n");
  for (let i = 0; i < Math.min(linea - 1, lineas.length); i++) {
      posicionCursor += lineas[i].length + 1; // Sumamos 1 para el salto de línea
  }
  posicionCursor += Math.min(columna, lineas[linea - 1].length);

  // Establecemos la posición del cursor
  element.selectionStart = posicionCursor;
  element.selectionEnd = posicionCursor;
  
  updateDataLine()
}


export function getCursor(element){
	return [element.selectionStart, element.selectionEnd]
}


export function getCursorValues(element){
	let t = getCursor(element)
	
	let posicionCursor = t[0] != t[1] ? t[0] - t[1] : t[0];
	let stringRequerido = element.value.substr(0, posicionCursor)
	let lineaCursor = stringRequerido.split("\n").length;
	let posicionLinea = stringRequerido.lastIndexOf("\n") + 1;
	const textLine = element.value.split("\n")[lineaCursor-1].trim()
	let primerPalabra = textLine.split(' ')[0]
	
	const columnaCursor = posicionCursor-posicionLinea
	
	let tempA = (str) =>{
	  let palabra = ''
	  let corta = " ,<>{}()[]\t\n"
	  for (let i = columnaCursor; i < str.length; i++){
	    if (corta.includes(str[i])) break;
	    palabra += str[i]
	  }
	  for (let i = columnaCursor-1; i >= 0; i--){
	    if (corta.includes(str[i])) break;
	    palabra = str[i] + palabra
	  }
	  return palabra
	}
	const inSelection = posicionCursor < 0
	
	let mediaPalabra = ''
	if (!inSelection) {
	  mediaPalabra = tempA(element.value.split("\n")[lineaCursor - 1])
	}
	
	const charsSelected = inSelection ? posicionCursor*-1 : 0
	const textSelected = element.value.substr(
	  getCursor(element)[0],
	  getCursor(element)[1]
	)
	
	const output = {
		lineaCursor, columnaCursor,
		inSelection, charsSelected,
		textSelected, primerPalabra,
		mediaPalabra, textLine
	}
	return output
}