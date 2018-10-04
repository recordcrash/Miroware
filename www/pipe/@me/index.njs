if(!this.user) {
	this.redirect = "/pipe/";
	this.done();
	return;
}
this.title = `Pipe / ${this.user.name}`;
this.value = (await load("load/head", this)).value;
this.value += html`
		<link rel="stylesheet" href="style.css">`;
this.value += (await load("load/body", this)).value;
this.value += (await load("load/pagehead", this)).value;
this.value += html`
				<div id="banner"></div>
				<a id="go" class="mdc-button mdc-button--raised mdc-ripple" href="@me/">Go to Your Pipe</a>`;
this.value += (await load("load/pagefoot", this)).value;
this.value += (await load("load/belt", this)).value;
this.value += html`
		<script src="script.js"></script>`;
this.value += (await load("load/foot", this)).value;
this.done();
