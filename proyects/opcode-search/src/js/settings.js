import { $, css, keyPressed, log } from './utils/dom.js'
import { load, start }  from './search.js'
import { fileServer }  from './utils/files.js'
import { hash } from './utils/directories.js'
import { local } from './utils/directories.js'

const $input = $('#myInput'),
	  $list = $('#list'),
	  $showed = $('#showed')

export const settings = () => {
	const ITEMS = [
		[
			'settings-limit-h', 'text', 'ground', 'opcode', 'operator',
			'number', 'string', 'variable', 'comment', 'label'
		], 
		[
			['size', 'ground', 'size'],
			['nav', 'bars', 'list', 'scroll']
		]
	]

	const display = (ELEMENT, MODE) => 
		css([$('#' + ELEMENT), JSON.parse(`{"display": "${MODE}"}`)])

	const save = {
		show : () => display('modal-save', 'initial'),
		hide : () => display('modal-save', 'none')
	}

	const _ = localStorage
	const _get = KEY => _.getItem(KEY)
	const _set = (KEY, VALUE) => _.setItem(KEY, VALUE)

	const VK_ENTER = 13
	$input.onkeydown = () => {
		keyPressed($input, VK_ENTER, () => {
			start()

			$input.value == ''
				? hash.clear()
				: hash.set($input.value)
		})
	}

	$('#file-load').onclick = () => load()
	$('#file-clear').onclick = () => {
		$list.innerHTML = ''
		$showed.innerHTML = ''
		css([$('#sms'), {display : ''}])
		found(0)
	}
	$('#pref-settings').onclick = () => {
		display('modal', 'grid')
		$('#body').style = 'filter: blur(3px)'
	}
	$('#modal-close').onclick = () => {
		display('modal', 'none')
		$('#body').style = ''
	}
	$('#modal-save').onclick = () => {
		//get set
		ITEMS[0].forEach(KEY => {
			const ELEMENT = $('#' + KEY).value
			if(_get('OpSearch/'+KEY) != ELEMENT){
				_set('OpSearch/'+KEY, ELEMENT)
			}
		})

		save.hide()
		start()
	}
	$('#reverse').onclick = () => {
		if ($('#reverse').checked) {
			css([$showed, {"flex-direction" : 'column-reverse'}])
			$showed.scrollTop = $showed.scrollHeight * -1
		} else {
			css([$showed, {"flex-direction" : 'column'}])
		}
	}

	const PREFIX = '--op-'

	ITEMS[0].forEach((ELEMENT, index) => {
		$('#' + ELEMENT).oninput = () => {
			save.show()

			if(index > 0) {
				$(':root').style.setProperty(PREFIX + ELEMENT, $('#' + ELEMENT).value)
			}
		}
	})

	onload = () => {
		save.hide()

		ITEMS[0].forEach((ELEMENT, index) => {
			if(index > 0) {
				const SAVED =
					_get('OpSearch/'+ELEMENT)
					|| css([$(':root'), PREFIX + ELEMENT])

				$('#' + ELEMENT).value = SAVED
					
				$(':root').style.setProperty(PREFIX + ELEMENT, $('#' + ELEMENT).value)
			}

		})
		
		$('#' + ITEMS[0][0]).value = _get('OpSearch/'+ITEMS[0][0]) || 50

		const _h = location.hash.replace('%20', ' ').replace('#', '')
		
		if (_h) {
			$input.value = _h
			start()
		}

		translate()

		$('#lang').onchange = () => {
			_set('OpSearch/set-lang-at', $('#lang').value)
			translate()
		}
		function translate () {
			let n = navigator.language,
				m = n[0] + n[1],
				k = () =>{
					switch (m) {
						case 'es': return 'es'; break;
						case 'pt': return 'pt'; break;
						default:   return 'en'; break;
					}
				}

			$(`#lang`).value = _get('OpSearch/'+'set-lang-at') || k()
			
			fileServer.get(
				local() + `assets/lang/${_get('OpSearch/'+'set-lang-at')
				|| $('#lang').value}.json`,

				json => {
					Object.keys(json).forEach((a) => {
						$(`[key="${a}"]`).innerText = json[a]
					})
				}
			)

		}
	}
}