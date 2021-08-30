window.onload = highlight();

// Get Element By Class
function GEBClass (a){return document.getElementsByClassName(a)}

function highlight() {
	sb3();
	scm();
	fxt();

	function sb3 () {
		for (let i = 0;i < GEBClass("sb3").length;i++){ 
			element = GEBClass("sb3")[i];
			text = element.innerHTML;

			comments1 = text.replace(
				/(\/\/.+)/gm,
				`<hlC>$1</hlC>`
			);
			comments2 = comments1.replace(
				/(\/\*[\x09-.0-■]*\*\/)/gmi,
				`<hlC>$1</hlC>`
			);
			comments3 = comments2.replace(
				/(\{[\x09-z\|~-■]*\})/gmi,
				`<hlC>$1</hlC>`
			);

			strings1 = comments3.replace(
				/\"([\x09-\!#-■]*)\"/gmi,
				`<hlS>\"$1\"<\/hlS>`
			);
			strings2 = strings1.replace(
				/\'([!-&(-■]+)\'/gmi,
				`<hlS>\'$1\'<\/hlS>`
			);

			keywords1 = strings2.replace(
				/\b(longstring|shortstring|integer|jump_if_false|thread|create_thread|create_custom_thread|end_thread|name_thread|end_thread_named|if|then|else|hex|end|else_jump|jump|jf|print|const|while|not|wait|repeat|until|break|continue|for|gosub|goto|var|array|of|and|or|to|downto|step|call|return_true|return_false|return|ret|rf|tr|Inc|Dec|Mul|Div|Alloc|Sqr|Random|int|string|float|bool|fade|DEFINE|select_interior|set_weather|set_wb_check_to|nop)\b/gmi,
				`<b>$1<\/b>`
			);

			labels1 = keywords1.replace(
				/(\s+\@+\w+|\:+\w+)/gm,
				`<hlL>$1<\/hlL>`
			);
			labels2 = labels1.replace(
				/(\s[A-Za-z0-9_]+\(\))/gm,
				`<hlM>$1<\/hlM>`
			);
			
			arrays1 = labels2.replace(
				/(\[)([\d+]*)(\])/gmi,
				`$1<hlN>$2<\/hlN>$3`
			);
			
			opcode1 = arrays1.replace(
				/^(\s*)([a-fA-F0-9]{4}\:)/gmi,
				`$1<spa'uppercase'>$2<\/span>`
			);
			
			numbers1 = opcode1.replace(
				/\b(\d+)(x|\.)(\w+)\b/gmi,
				`<hlN>$1$2$3<\/hlN>`
			);
			numbers2 = numbers1.replace(
				/\b(true|false)\b/gmi,
				`<hlN>$1<\/hlN>`
			);
			numbers3 = numbers2.replace(
				/(\s|\-|\,|\()(?!\$)(\d+)(?!\:|\@)(i)?\b/gmi,
				`$1<hlN>$2$3<\/hlN>`
			);
			
			models1 = numbers3.replace(
				/(\#+\w+)/gm,
				`<hlN>$1<\/hlN>`
			);
			
			class1 = models1.replace(
				/(Actor|Animation|Attractor|Audio|AudioStream|Blip|Boat|Button|Camera|Car|CarGenerator|CardDecks|Checkpoint|Clock|Component|Credits|Cutscene|Debugger|DecisionMaker|DecisionMakerActor|DecisionMakerGroup|DynamicLibrary|File|Fs|Fx|Game|Gang|Garage|Group|Heli|Hid|ImGui|IniFile|Input|Interior|Key|Marker|Math|Memory|Menu|Model|Mouse|Multiplayer|List|Object|ObjectGroup|Particle|Path|Pickup|Plane|Player|Rampage|Rc|Render|Restart|Screen|ScriptEvent|ScriptFire|Searchlight|Sequence|Shopping|Skip|Sound|Soundtrack|SpecialActor|Sphere|Sprite|Stat|StreamedScript|Streaming|String|StuckCarCheck|Task|Text|Texture|Trailer|Train|Txd|WeaponInfo|Weather|Widget|World|Zone)(\.)(\w+)/gmi,
				`<hlX>$1<\/hlX>$2<hlM>$3</hlM>`
			);
			class2 = class1.replace(
				/(\$\w+|\d+\@)\.([0-9A-Z_a-z]+)/gm,
				`$1.<hlM>$2</hlM>`
			);

			directive1 = class2.replace(
				/(\{\$)(CLEO|OPCODE|NOSOURCE)(\s\w+\}|\})/gmi,
				`<hlV>$1$2$3<\/hlV>`
			);

			variables0 = directive1.replace(
				/\b(timera|timerb)\b/gmi,
				`<hlV>$1<\/hlV>`
			);
			variables1 = variables0.replace(
				/(\d+)(\@s|\@v|\@)(\:|\s|\n|\]|\.|\,||\))/gm,
				`<hlV>$1$2<\/hlV>$3`
			);
			variables2 = variables1.replace(
				/(\&amp;\d+)/gim,
				`<hlV>$1<\/hlV>`
			);
			variables3 = variables2.replace(
				/(\x{00}|s|v)(\$[0-9A-Z_a-z]+)/gm,
				`<hlV>$1$2<\/hlV>`
			);

			symbol1 = variables3.replace(
				/(\t)/gmi,
				`    `
			);
			symbol2 = symbol1.replace(
				/^(\w|\W)/gmi,
				`<c></c>$1`
			);
			/*
			symbol3 = symbol2.replace(
				/\s(\=|\+|\-|\*|\/|\%|\=\=|\+\=|\-\=|\*\=|\/\=|\%\=|\+\+|\-\-|\<|\>|\<\=|\>\=)\s/gmi,
				" <font class=operador>$1<\/font> "
			);
			*/
			element.innerHTML = symbol2;
			GEBClass("sb3")[i].setAttribute(
				"title",
				"Código de Sanny Builder 3\nResaltado por MatiDragon"
			);
		}
	}
	function scm () {
		for (let i = 0; i < GEBClass("scm").length; i++) { 
			element = GEBClass("scm")[i];
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
			GEBClass("scm")[i].setAttribute(
				"title",
				"Config. de opcodes.\nResaltado por MatiDragon"
			);
		}
	}
	function fxt () {
		for (let i = 0; i < GEBClass("fxt").length; i++) { 
			element = GEBClass("fxt")[i];
			text = element.innerHTML;

			gh = text.replace(/^([0-9@-Za-z_]+)/gm, "<b class=\"green-text text-accent-3\">$1<\/b>");

			element.innerHTML = gh;
			GEBClass("fxt")[i].setAttribute(
				"title",
				"Mensajes GXT.\nResaltado por MatiDragon"
			);
		}
	}
	$('code').addClass('bg-dark text-white rounded darken-4 p-1');
	$('.bd').addClass('green btn-large waves-effect waves-light black-text');
}
