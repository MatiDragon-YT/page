import { fetchPercentece } from './dom.js'

const DEBUG = true

export const log = x => DEBUG ? console.log(x) : 0
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

export const LS = {
	t : localStorage,
	get : (x) => LS.t.getItem(x),
	set : (x,y) => LS.t.setItem(x, y)
}


/**
 * Almacena archivo de texto en el localStore, y las recupera para impedir descargas innecesarias.
 * @param {string} url - direccion de descarga.
 * @param {string} color - representar el nivel de carga.
 * @param {string} _saveAt - direccion de almacenaje (opcional).
 * @returns {string} - texto recuperado
*/
export async function LSget(url, color, _saveAt) {
  _saveAt = _saveAt ?? url
  
  let text = LS.get(_saveAt)
  
  if (text == undefined){
    text = await fetch(url)
    .then(response => {
 	    return fetchPercentece(response, color)
    })
    
    text = await text.text()
    LS.set(_saveAt, text)
  }

  return text
}