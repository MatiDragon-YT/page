function txt () {
	for (let i = 0;i < $(".txt").length;i++){ 
		let element = $(".txt")[i];
		element.innerHTML = element.innerHTML
			/*** COMMENTS ***/
			.replaceAll('\t', `    `)
			.replace(/^(\w|\W)/gmi, `<c></c>$1`)
		;
	}
}
export default txt();