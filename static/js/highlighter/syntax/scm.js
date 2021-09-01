function scm () {
	for (let i = 0; i < class$("scm").length; i++) { 
		element = class$("scm")[i];
		text = element.innerHTML;

		comments = text.replace(/(\B\;|\s\/\/)(.*)(\n)/gm, "<i class=grey-text>$1$2$3<\/i>");
		keywords = comments.replace(/(PUBLISHER\=|DATE\=)/gmi, "<b>$1<\/b>");
		links = keywords.replace(/(http\:\/\/|https\:\/\/)(.*)/gmi, "(<a href='$1$2''>$1$2<\/a>)");
		opcodes = links.replace(/(0[A-Ga-g0-9]{3})/gmi, "<a href='https://library.sannybuilder.com/#/sa/default/$1/' title='Ver en Sanny Builder Library'>$1<\/a>");

		params = opcodes.replace(/(\=\d+|\=\-\d+|\=n)(\,|\s)/gmi, "<span class='pink-text' title='Numero de parametros'>$1<\/span><span class='grey-text text-darken-2'>$2<\/span>");
		any = params.replace(/(\%)(\d+|\~)(d\%)/gmi, "<b class='blue-text' title='Cualquier tipo de valor'>$1$2$3<\/b>");
		label = any.replace(/(\%)(\d+|\~)(p\%)/gmi, "<b class='cyan-text' title='Salto a una etiqueta (Label)'>$1$2$3<\/b>");
		model = label.replace(/(\%)(\d+|\~)(o\%)/gmi, "<b class='teal-text' title='Cualquier tipo de modelo'>$1$2$3<\/b>");
		ide = model.replace(/(\%)(\d+|\~)(m\%)/gmi, "<b class=''green-text'' title='Modelo registrado en .ide'>$1$2$3<\/b>");
		gxt = ide.replace(/(\%)(\d+|\~)(g\%)/gmi, "<b class='yellow-text' title='Entrada de textos (GXT)'>$1$2$3<\/b>");
		script = gxt.replace(/(\%)(\d+|\~)(x\%)/gmi, "<b class='amber-text' title='Guion externo (Script)'>$1$2$3<\/b>");
		strings = script.replace(/(\%)(\d+|\~)(s\%)/gmi, "<b class='orange-text' title='Cadena literaria (String)'>$1$2$3<\/b>");
		unk = strings.replace(/(\%)(\d+|\~)(h\%)/gmi, "<b class='red-text' title='Indefinido/Desconocido'>$1$2$3<\/b>");

		element.innerHTML = unk;
	}
}
export default scm();