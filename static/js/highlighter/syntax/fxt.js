function fxt () {
	for (let i = 0;i < class$("fxt").length;i++){ 
		let element = class$("fxt")[i];
		element.innerHTML = element.innerHTML
			/*** KEY OF TEXT ***/
			.replace(/^([0-9@-Za-z_]+)/gm, "<b class=\"green-text text-accent-3\">$1<\/b>")
		;
	}
}
export default fxt();