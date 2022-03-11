const FPS = 24

function start(){
	console.log("Inicio")
}
var n = 0
function update(){
	console.log("Actualizacion " + n)
	n++
}


















function main(){
	start();
	setInterval(
		update,
		1000 / FPS
	)
}
main()