'use strict';
import { log, LS, LSget} from './utils/utils.js'
import { fetchPercentece } from './utils/dom.js'
import { STRING } from './utils/string.js'

$('#navbar_pc').innerHTML = (await LSget(
  './view/navbar_pc.html',
  'lime',
))

$('#assistance_android').innerHTML = (await LSget(
  './view/assistance_android.html',
  'lime',
))

let $textarea = $('#HEX')
const KEYS_MOBILE = ["\t","&","@","$","#","=","_",'""',"''",'()','{}','[]']
$('#keys-mobile key', (e, i)=> {
  e.onclick = ()=>{
    $textarea.focus();
      document.execCommand("insertText",false,KEYS_MOBILE[i])
      if (i > 6) {
        $textarea.selectionStart--
        $textarea.selectionEnd--
      }
  }
  //log(i)
})

let clipPaste = ""

$("[cmd]", e => {
  let x = e.gAttr("cmd")
  e.title=x
  if (x == "paste") {
    e.onclick = () =>{
      $textarea.focus();
      document.execCommand("insertText",false,clipPaste);
    }
  } else if (x == "copy" || x == "cut") {
    e.onclick = (y,z)=>{
      $textarea.focus();
      clipPaste = $textarea.getTextSelected()
      document.execCommand(x);
    }
  } else {
    const f = ()=>{
      $textarea.focus();
      document.execCommand(x);
    }
    e.onclick = f
  }
})

let ctrlPressed = false
$("key[key]", e => {
  let x = e.gAttr("key")
  e.title=x
  if (x == "all") {
    e.onclick = () =>{
      $textarea.focus();
      $textarea.selectionStart = 0
      $textarea.selectionEnd = $textarea.value.length
      
    }
  }
  if (x == "left") {
    e.onclick = () =>{
      $textarea.focus();
      $textarea.selectionStart--
      $textarea.selectionEnd--
      
    }
  }
  if (x == "right") {
    e.onclick = () =>{
      $textarea.focus();
      $textarea.selectionEnd++
      $textarea.selectionStart++
      
    }
  }
  if (x == "up") {
    e.onclick = () =>{
      $textarea.focus();
      let {columnaCursor, lineaCursor} = $textarea.getLine()
      $textarea.setCursorFull(lineaCursor-1,columnaCursor)
    }
  }
  if (x == "down") {
    e.onclick = () =>{
      $textarea.focus();
      let {columnaCursor, lineaCursor} = $textarea.getLine()
      $textarea.setCursorFull(lineaCursor+1,columnaCursor)
    }
  }
  if (x == "ctrl") {
    e.onclick = () =>{
      $textarea.focus();
      ctrlPressed = !ctrlPressed
    }
  }
})

$('#documentation').innerHTML = (await LSget(
  './view/documentation.html',
  'green',
))

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
