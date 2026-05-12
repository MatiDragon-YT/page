import { $, css, log } from './utils/dom.js'
import { local } from './utils/directories.js'
import { fileServer }  from './utils/files.js'
import { sanny } from './utils/highlighter.js'

const $input = $('#myInput'),
	  $list = $('#list'),
	  $showed = $('#showed')

export function found(COUNTER = $showed.childElementCount) {
	$('#found').innerHTML =
		COUNTER + '/' + ($showed.childElementCount + $list.childElementCount)
}

export function load (FILELIST = local() + 'assets/opcodes/sa.txt'){
	const _ = localStorage
	const _get = _.getItem('OPs')
	
	if (_get) {
		fileServer.write(_get)
		fileServer.format($list)
		found()
		start()
	} else {
		fileServer.get(FILELIST, Data => {
			_.setItem('OPs', Data)
			load()
		})
	}
}

export function restarRenderNav() {
	const ITEM = $('item')[0];

	css([ITEM, {display: 'none'}])

	setTimeout(() =>{ 

		css([ITEM, {display: 'block'}])

	}, 0)					
}

export function start(){
	const $filter = $('#myInput').value.toUpperCase().replaceAll(' ', '_')
	const $invisibles = $('li', $list)
	const $visibles = $('li', $showed)

	if ($visibles.length > 0) {
		$visibles.forEach(e => {
			$list.appendChild(e)
		})
	}

	if ($invisibles.length == 0 && $filter != ''){
		load()
	}

	$invisibles.forEach($selected => {
		const $element = $selected.getElementsByTagName('pre')[0]
		const TEXTVALUE = $element.textContent || $element.innerText

		if (TEXTVALUE.toUpperCase().indexOf($filter) > -1) {
			$showed.appendChild($selected)
		}
	}) 
	
	const MAX_COUNT_LI = $('#settings-limit-h').value

	if (MAX_COUNT_LI == -1 || $('li[style=""]', $showed).length < MAX_COUNT_LI){
		sanny()
	}

	found()
}
