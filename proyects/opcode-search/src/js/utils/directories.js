const
	A = origin,
	B = location

export const local = () =>
	A == 'https://matidragon-yt.github.io'
		? A + '/page/beta/opcode-search/'
		: A + '/beta/opcode-search/'

export const hash = {
	get : () => B.hash,
	set : VALUE => B.hash = VALUE,
	clear : () => {
		history.pushState('', document.title, B.pathname)
	}
}