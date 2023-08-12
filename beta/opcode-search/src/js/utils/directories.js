const
	A = origin,
	B = location

export const local = () =>
	A == 'https://matidragon-yt.github.io/page/beta'
		? A + '/opcode-search/'
		: A + '/beta/opcode-search/'

export const hash = {
	get : () => B.hash,
	set : VALUE => B.hash = VALUE,
	clear : () => {
		history.pushState('', document.title, B.pathname)
	}
}