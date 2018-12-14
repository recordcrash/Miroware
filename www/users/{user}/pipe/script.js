"use strict";
const getSize = size => {
	if(size < 1000) {
		return `${size} B`;
	}
	size /= 1000;
	if(size < 1000) {
		return `${Math.round(10 * size) / 10} kB`;
	}
	size /= 1000;
	if(size < 1000) {
		return `${Math.round(10 * size) / 10} MB`;
	}
	size /= 1000;
	if(size < 1000) {
		return `${Math.round(10 * size) / 10} GB`;
	}
	size /= 1000;
	if(size < 1000) {
		return `${Math.round(10 * size) / 10} TB`;
	}
	size /= 1000;
	if(size < 1000) {
		return `${Math.round(10 * size) / 10} PB`;
	}
	size /= 1000;
	if(size < 1000) {
		return `${Math.round(10 * size) / 10} EB`;
	}
	size /= 1000;
	if(size < 1000) {
		return `${Math.round(10 * size) / 10} ZB`;
	}
	size /= 1000;
	return `${Math.round(10 * size) / 10} YB`;
};
const getDate = date => String(new Date(date)).split(" ").slice(1, 5).join(" ");
const creation = document.body.querySelector("#creation");
const queuedItems = document.body.querySelector("#queuedItems");
const queue = [];
const queueReducer = (progress, item) => {
	progress.loaded += item.loaded;
	progress.total += item.file.size;
	return progress;
};
const updateQueue = () => {
	if(!queue.length) {
		creation.classList.remove("loading");
		return;
	}
	const {loaded, total} = queue.reduce(queueReducer, {
		loaded: 0,
		total: 0
	});
	const done = loaded === total;
	if(done) {
		creation.classList.remove("loading");
		queue.length = 0;
	} else {
		creation.classList.add("loading");
		creation.style.backgroundSize = `${100 * (done ? 1 : loaded / total)}%`;
	}
};
class PipeQueuedItem {
	constructor(file) {
		this.file = file;
		(this.element = html`
			<div class="item loading">
				<div class="label">
					<div class="title" title="$${this.file.name}">$${this.file.name}</div>
					<div class="subtitle" title="0 / ${this.file.size}">0% (${getSize(0)} / ${getSize(this.file.size)})</div>
				</div>
				<button class="close mdc-icon-button material-icons">close</button>
			</div>
		`)._item = this;
		(this.closeElement = this.element.querySelector(".close")).addEventListener("click", this.close.bind(this));
		this.subtitleElement = this.element.querySelector(".subtitle");
		Miro.request("POST", "/users/@me/pipe", {
			"Content-Type": "application/octet-stream",
			"X-Data": JSON.stringify({
				name: name // TODO: apply parent
			})
		}, this.file, xhr => {
			this.xhr = xhr;
			this.loaded = 0;
			this.xhr.upload.addEventListener("progress", evt => {
				const percentage = 100 * (this.loaded = evt.loaded) / this.file.size;
				this.element.style.backgroundSize = `${percentage}%`;
				this.subtitleElement.title = `${this.loaded} / ${this.file.size}`;
				this.subtitleElement.textContent = `${Math.floor(10 * percentage) / 10}% (${getSize(this.loaded)} / ${getSize(this.file.size)})`;
				updateQueue();
			});
			queue.push(this);
			updateQueue();
		}, true).then(Miro.response(xhr => {
			this.element.classList.remove("loading");
			this.closeElement.textContent = "done";
		}, () => {
			this.element.classList.remove("loading");
			this.element.classList.add("error");
			this.subtitleElement.textContent = "An error occurred. Click to retry.";
			this.element.addEventListener("click", this.retry.bind(this));
			if(this.dequeue()) {
				updateQueue();
			}
		}));
	}
	dequeue() {
		const queueIndex = queue.indexOf(this);
		if(queueIndex === -1) {
			return false;
		} else {
			queue.splice(queueIndex, 1);
			return true;
		}
	}
	async close() {
		if(this.element.classList.contains("loading") && await new Miro.Dialog("Cancel", html`
			Are you sure you want to cancel uploading <b>$${this.file.name}</b>?
		`, ["Yes", "No"]) !== 0) {
			return;
		}
		this.xhr.abort();
		this.element.parentNode.removeChild(this.element);
		if(this.dequeue()) {
			updateQueue();
		}
	}
	retry(evt) {
		if(!this.closeElement.contains(evt.target)) {
			this.element.parentNode.replaceChild(new PipeQueuedItem(this.file).element, this.element);
			this.dequeue();
		}
	}
}
const addFile = file => {
	// TODO: check names
	queuedItems.appendChild(new PipeQueuedItem(file).element);
};
const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.multiple = true;
fileInput.addEventListener("change", () => {
	Array.prototype.forEach.call(fileInput.files, addFile);
	fileInput.value = null;
});
const addFiles = creation.querySelector("#addFiles");
addFiles.addEventListener("click", fileInput.click.bind(fileInput));
const htmlFilenameTest = /\/([^\/]+?)"/;
document.addEventListener("paste", async evt => {
	if(Miro.focused() && !Miro.typing() && evt.clipboardData.items.length) {
		let file;
		let string;
		for(const dataTransferItem of evt.clipboardData.items) {
			if(dataTransferItem.kind === "file") {
				file = dataTransferItem;
			} else if(dataTransferItem.kind === "string") {
				string = dataTransferItem;
			}
		}
		if(file) {
			file = file.getAsFile();
			if(string) {
				const htmlFilename = (await new Promise(string.getAsString.bind(string))).match(htmlFilenameTest);
				Object.defineProperty(file, "name", {
					value: htmlFilename ? htmlFilename[1] : "file"
				});
			}
			addFile(file);
		}
	}
}, {
	capture: true,
	passive: true
});
window.onbeforeunload = () => queue.length || undefined;
