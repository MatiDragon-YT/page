const
	A = origin,
	B = location

export const local = () =>
	A == 'https://matidragon-yt.github.io'
		? A + '/opcode-search/'
		: A + '/'

export const hash = {
	get : () => B.hash,
	set : VALUE => B.hash = VALUE,
	clear : () => {
		history.pushState('', document.title, B.pathname)
	}
}