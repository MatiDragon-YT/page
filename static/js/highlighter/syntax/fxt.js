function fxt () {
	for (let i = 0; i < class$("fxt").length; i++) { 
		element = class$("fxt")[i];
		text = element.innerHTML;

		gh = text.replace(/^([0-9@-Za-z_]+)/gm, "<b class=\"green-text text-accent-3\">$1<\/b>");

		element.innerHTML = gh;
	}
}
export default fxt();