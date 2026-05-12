import { $, log, css } from './dom.js'
import { found } from '../search.js'
export const fileServer = {
	get : async function (URL, CALLBACK) {
		const TYPE = URL.replace(/(.*\.)/, '')

		return await fetch(URL)
		 .then(RES => TYPE == 'json' ? RES.json() : RES.text())
		 .then(DATA => CALLBACK(DATA))
		 .catch(ERROR => log(ERROR))
	},

	write : (MESSAGE = '') => {
		css([$('#sms'), {display : 'none'}])
		$('#list').innerHTML = MESSAGE
	},

	format : (OPCODES) => {
		OPCODES.innerHTML =
		OPCODES.innerHTML
		.replace(/^(.+)/gim, '<li style><pre>$1</pre></li>')
	}
}