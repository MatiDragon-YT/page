document.write(`
<section id="modal">
<element id="modal-window">
<div id="modal-header">
	<h1 key="t-settings" id="modal-title"></h1>
	<span>
		<i id="modal-save" class="icon">save</i>
		<i id="modal-close" class="icon">close</i>
	</span>
</div>
<div id="modal-container">
	<span key="with"></span>
	<br><br>

	<b key="highl"></b>
	<blockquote>
		<span key="highe"></span> <input type="number" id="settings-limit-h">
		<div class="info"><i class="icon">info</i><p key="highi" class="comment"></p></div>
	</blockquote>
	
	<!--
	<b key="theme"></b>
	<blockquote>
		<div class="table">
			<div class="row"><b key="themee">Element</b>
				<span key="themees"></span>
			</div>
			<div class="row"><b key="themec"></b>
				<input type="text" disabled id="color-nav">
				<input type="text" disabled id="color-bar">
				<input type="text" disabled id="color-list">
				<input type="text" disabled id="color-scroll">
			</div>
			<div class="row"><b key="themeg"></b>
				<input type="text" disabled id="ground-nav">
				<input type="text" disabled id="ground-bar">
				<input type="text" disabled id="ground-list">
				<input type="text" disabled id="ground-scroll">
			</div>
			<div class="row"><b key="themes"></b>
				<input type="text" disabled id="size-nav">
				<input type="text" disabled id="size-bar">
				<input type="text" disabled id="size-list">
				<input type="text" disabled id="size-scroll">
			</div>
		</div>
		<div class="info">
			<i class="icon">info</i><p key="themei" class="comment"></p>	
		</div>
	</blockquote>
	-->

	<b key="scheme"></b>
	<blockquote>
		<div class="table">
			<div class="row"><b key="schemee"></b>
				<span key="schemees"></span>
			</div>
			<div class="row"><b key="schemec"></b>
				<input type="text" id="text">
				<input type="text" id="ground">
				<input type="text" id="opcode">
				<input type="text" id="operator">
				<input type="text" id="number">
				<input type="text" id="string">
				<input type="text" id="variable">
				<input type="text" id="comment">
				<input type="text" id="label">
			</div>
			<div class="row"><b key="schemev"></b>
				<pre>text_example_xd\n\n00AD:\n== += -= < <= * => > - +\nfalse 10 0xFF 0.0 #FAM1\n'short' "long string"\n412@ $variable_example\n{comment} // example\n@example_0AF023</pre>
			</div>
		</div>
		<div class="info">
			<i class="icon">info</i><p key="schemei" class="comment"></p>	
		</div>
	</blockquote>

	<!--
	<b>Danger Zone</b>
	<blockquote style="
	    text-align: center;
	">
	<button style="
	    background: #f4432b;
	    color: black;
	    font-weight: bold;
	    font-size: 1rem;
	    text-transform: uppercase;
	    padding: 1rem 3rem;
	">Reset settings</button>
	</blockquote>
	-->
</div>
</element>
</section>
`)