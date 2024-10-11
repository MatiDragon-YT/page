const DEBUG = true

export const log = x => DEBUG ? console.log(x) : 0
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

export const LS = {
	t : localStorage,
	get : (x) => LS.t.getItem(x),
	set : (x,y) => LS.t.setItem(x, y)
}
