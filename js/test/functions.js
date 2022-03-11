const h = new Function(`
let x = () => console.log("hola")

x()

`
.replace(/(\w+|\([^\(\)]+\)) => (.+)/g, "function$1{$2};")
.replaceAll("let ", "var ")
)


h()