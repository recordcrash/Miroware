"use strict";
document.title += ` / ${Miro.data.user.name}`;
const getDateString = date => String(date).split(" ").slice(1, 5).join(" ");
const BYTE_SCALE = 1024;
const getSizeString = size => {
	if (size < BYTE_SCALE) {
		return `${size} B`;
	}
	size /= BYTE_SCALE;
	if (size < BYTE_SCALE) {
		return `${Math.round(10 * size) / 10} KiB`;
	}
	size /= BYTE_SCALE;
	if (size < BYTE_SCALE) {
		return `${Math.round(10 * size) / 10} MiB`;
	}
	size /= BYTE_SCALE;
	if (size < BYTE_SCALE) {
		return `${Math.round(10 * size) / 10} GiB`;
	}
	size /= BYTE_SCALE;
	if (size < BYTE_SCALE) {
		return `${Math.round(10 * size) / 10} TiB`;
	}
	size /= BYTE_SCALE;
	if (size < BYTE_SCALE) {
		return `${Math.round(10 * size) / 10} PiB`;
	}
	size /= BYTE_SCALE;
	if (size < BYTE_SCALE) {
		return `${Math.round(10 * size) / 10} EiB`;
	}
	size /= BYTE_SCALE;
	if (size < BYTE_SCALE) {
		return `${Math.round(10 * size) / 10} ZiB`;
	}
	size /= BYTE_SCALE;
	return `${Math.round(10 * size) / 10} YiB`;
};
const container = document.body.querySelector("#container");
const targetIndicator = document.body.querySelector("#targetIndicator");
let indicatedTarget;
const indicateTarget = target => {
	indicatedTarget = target;
	if (target) {
		const rect = target.getBoundingClientRect();
		targetIndicator.style.transform = `translate(${rect.left + rect.width / 2 - 0.5}px, ${rect.top + rect.height / 2 - 0.5}px) scale(${rect.width}, ${rect.height})`;
		targetIndicator.classList.add("visible");
	} else if (targetIndicator.classList.contains("visible")) {
		targetIndicator.style.transform = "";
		targetIndicator.classList.remove("visible");
	}
};
let queryParent = null;
const getTargetID = () => indicatedTarget._item ? indicatedTarget._item.id : (indicatedTarget instanceof HTMLAnchorElement ? decodeURI(indicatedTarget.href.slice(indicatedTarget.href.indexOf("#") + 1)) || null : queryParent);
const titleBar = document.body.querySelector(".mdc-top-app-bar__title");
const ancestors = document.body.querySelector("#ancestors");
titleBar.appendChild(ancestors);
const encodedSlashes = /%2F/g;
const encodedAts = /%40/g;
const encodeForPipe = path => encodeURIComponent(path).replace(encodedSlashes, "/").replace(encodedAts, "@");
const quotationMarks = /\"/g;
const apostrophes = /\'/g;
const openingParentheses = /\(/g;
const closingParentheses = /\)/g;
const pipe = [];
const cachedParents = [];
const getItemByID = id => pipe.find(item => item.id === id);
const getItemByName = (name, parent = queryParent) => pipe.find(item => item.name === name && item.parent === parent);
const setItem = item => {
	const itemIndex = pipe.findIndex(({id}) => id === item.id);
	if (itemIndex === -1) {
		pipe.push(item);
	} else {
		pipe.splice(itemIndex, 1, item);
	}
	return item;
};
const currentItems = item => queryParent === item.parent;
const sort = {
	name: (a, b) => b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1,
	size: (a, b) => b.size - a.size || b.date - a.date,
	type: (a, b) => b.type < a.type ? 1 : (b.type > a.type ? -1 : b.date - a.date),
	date: (a, b) => b.date - a.date
};
const SORT_DEFAULT = "date";
let sortValue = localStorage.pipe_sortItems in sort ? localStorage.pipe_sortItems : SORT_DEFAULT;
let reverseValue = +localStorage.pipe_reverseItems;
const header = document.body.querySelector("#header");
const sortButtons = header.querySelectorAll(".cell.sort > button");
const clickSort = evt => {
	if (evt.target.classList.contains("sorting")) {
		reverseValue = +!reverseValue;
	} else {
		for (const sortButton of sortButtons) {
			const target = sortButton === evt.target;
			sortButton.classList[target ? "add" : "remove"]("sorting");
			sortButton.textContent = target ? "arrow_downward" : "sort";
		}
	}
	localStorage.pipe_sortItems = sortValue = evt.target._sort;
	evt.target.classList[(localStorage.pipe_reverseItems = reverseValue) ? "add" : "remove"]("reverse");
	render();
};
for (const sortButton of sortButtons) {
	if (sortValue === (sortButton._sort = sortButton.getAttribute("data-sort"))) {
		sortButton.classList.add("sorting");
		sortButton.textContent = "arrow_downward";
		if (reverseValue) {
			sortButton.classList.add("reverse");
		}
	}
	sortButton.addEventListener("click", clickSort);
}
const items = container.querySelector("#items");
const _type = Symbol("type");
const _parent = Symbol("parent");
const _name = Symbol("name");
const _path = Symbol("path");
const _size = Symbol("size");
const _date = Symbol("date");
const PipeItem = class PipeItem {
	constructor(item) {
		this.id = item.id;
		(this.element = html`
			<a class="item" draggable="false" ondragstart="return false;">
				<div class="cell thumbnail material-icons"></div>
				<div class="cell icon">
					<button class="mdc-icon-button material-icons"></button>
				</div>
				<div class="cell name"></div>
				<div class="cell size"></div>
				<div class="cell type"></div>
				<div class="cell date"></div>
			</a>
		`)._item = this;
		if (this.id === "trash") {
			this.element.id = "item_trash";
		}
		this.element.removeChild(this.thumbnailElement = this.element.querySelector(".cell.thumbnail"));
		this.thumbnailHidden = true;
		this.iconElement = this.element.querySelector(".cell.icon > button");
		this.nameElement = this.element.querySelector(".cell.name");
		this.sizeElement = this.element.querySelector(".cell.size");
		this.typeElement = this.element.querySelector(".cell.type");
		this.dateElement = this.element.querySelector(".cell.date");
		this.type = item.type;
		if ((this.parent = item.parent) === "trash") {
			this.trashed = item.trashed;
			this.restore = item.restore;
		}
		this.name = item.name;
		this.path = item.path;
		if (this.type === "/") {
			this.element.href = this.url = `#${this.id}`;
		}
		this.size = item.size;
		this.privacy = item.privacy;
		this.date = new Date(item.date);
		this.element.addEventListener("click", evt => {
			this.click(evt);
		});
	}
	get type() {
		return this[_type];
	}
	set type(value) {
		const typeDir = (this[_type] = value) === "/";
		this.typeElement.textContent = this.typeElement.title = typeDir ? "" : value;
		this.iconElement.textContent = this.id === "trash" ? "delete" : (typeDir ? "folder" : (value.startsWith("image/") ? "image" : (value.startsWith("audio/") ? "audiotrack" : (value.startsWith("video/") ? "movie" : (value === "text/html" ? "web" : "insert_drive_file")))));
		this.element.classList[typeDir ? "add" : "remove"]("typeDir");
		this.element.classList[typeDir ? "remove" : "add"]("typeFile");
		setTimeout(() => {
			this.updateThumbnail();
		});
	}
	get parent() {
		return this[_parent];
	}
	set parent(value) {
		if (this.path) {
			let parent = this;
			while (parent = getItemByID(parent.parent)) {
				parent.size -= this.size;
			}
		}
		this[_parent] = value;
		if (this.path) {
			this.path = this.parent ? `${this.parent === "trash" ? Miro.data.trashName : getItemByID(this.parent).path}/${this.name}` : this.name;
			let parent = this;
			while (parent = getItemByID(parent.parent)) {
				parent.size += this.size;
			}
		}
	}
	get name() {
		return this[_name];
	}
	set name(value) {
		this.nameElement.textContent = this.nameElement.title = this[_name] = value;
		if (this.path) {
			const nameIndex = this.path.lastIndexOf("/") + 1;
			this.path = (nameIndex ? this.path.slice(0, nameIndex) : "") + value;
		}
		if(this.id === "trash") {
			Miro.data.trashName = value;
		}
	}
	get path() {
		return this[_path];
	}
	set path(value) {
		const typeDir = this.type === "/";
		if (typeDir && this.path) {
			const prefix = `${this.path}/`;
			for (const item of pipe) {
				if (item.path.startsWith(prefix)) {
					item.path = `${value}/${item.name}`;
				}
			}
		}
		this[_path] = value;
		if (!typeDir) {
			if (!(this.element.href = this.url = this.isPrivate() ? "" : `https://file.garden/${getBase64ID(Miro.data.user.id)}/${encodeForPipe(value)}`)) {
				this.element.removeAttribute("href");
			}
		}
	}
	updateThumbnail() {
		if (this.type.startsWith("image/")) {
			this.thumbnailElement.style.backgroundImage = `url(${(this.isPrivate() ? `https://api.filegarden.com/users/${Miro.data.user.id}/pipe/${this.id}/content` : this.url).replace(quotationMarks, "%22").replace(apostrophes, "%27").replace(openingParentheses, "%28").replace(closingParentheses, "%29")}?v=${Date.now()})`;
		} else {
			this.thumbnailElement.style.backgroundImage = "";
			this.thumbnailElement.textContent = this.iconElement.textContent;
		}
	}
	get size() {
		return this[_size];
	}
	set size(value) {
		this.sizeElement.textContent = getSizeString(this[_size] = value);
		this.sizeElement.title = `${value} B`;
		if (this.element.classList.contains("selected")) {
			updateProperties();
		}
	}
	get date() {
		return this[_date];
	}
	set date(value) {
		this.dateElement.textContent = getDateString(this.dateElement.title = this[_date] = value);
	}
	click(evt) {
		evt.preventDefault();
	}
	delete() {
		if (selectedItem === this.element) {
			selectedItem = null;
		}
		if (focusedItem === this.element) {
			focusedItem = null;
		}
		if (this.type === "/") {
			const cachedParentIndex = cachedParents.indexOf(this.id);
			if (cachedParentIndex !== -1) {
				cachedParents.splice(cachedParentIndex, 1);
			}
			for (const item of pipe) {
				if (item.parent === this.id) {
					item.delete();
				} else if (item.restore === this.id) {
					item.restore = null;
				}
			}
		}
		let parent = this;
		while (parent = getItemByID(parent.parent)) {
			parent.size -= this.size;
		}
		pipe.splice(pipe.indexOf(this), 1);
	}
	open() {
		if (this.type === "/") {
			location.href = this.element.href;
		} else if (this.parent === "trash") {
			if (Miro.data.isMe) {
				restoreItems();
			}
		} else {
			open(this.element.href);
		}
	}
	isPrivate() {
		return this.privacy === 2 || this.path.startsWith(`${Miro.data.trashName}/`);
	}
};
const removeItem = itemElement => {
	itemElement.classList.remove("selected");
	itemElement.classList.add("loading");
	if (itemElement._item.parent === "trash") {
		Miro.request("DELETE", `/users/${Miro.data.user.id}/pipe/${itemElement._item.id}`).then(Miro.response(() => {
			itemElement._item.delete();
			render();
		}, () => {
			itemElement.classList.remove("loading");
			itemElement.classList.add("selected");
		}));
	} else {
		const sourceParent = itemElement._item.parent;
		Miro.request("PUT", `/users/${Miro.data.user.id}/pipe/${itemElement._item.id}`, {}, {
			parent: "trash"
		}).then(Miro.response(xhr => {
			itemElement._item.parent = xhr.response.parent;
			itemElement._item.trashed = xhr.response.trashed;
			itemElement._item.restore = xhr.response.restore;
			itemElement.classList.remove("loading");
			if (queryParent === sourceParent || queryParent === "trash") {
				render();
			}
		}, () => {
			itemElement.classList.remove("loading");
			itemElement.classList.add("selected");
		}));
	}
};
const restoreItem = itemElement => {
	itemElement.classList.remove("selected");
	itemElement.classList.add("loading");
	const targetParent = itemElement._item.restore;
	Miro.request("PUT", `/users/${Miro.data.user.id}/pipe/${itemElement._item.id}`, {}, {
		parent: targetParent
	}).then(Miro.response(xhr => {
		itemElement._item.parent = xhr.response.parent;
		delete itemElement._item.trashed;
		delete itemElement._item.restore;
		itemElement.classList.remove("loading");
		if (queryParent === "trash" || queryParent === targetParent) {
			render();
		}
	}, () => {
		itemElement.classList.remove("loading");
		itemElement.classList.add("selected");
	}));
};
const restoreItems = () => {
	const itemElements = items.querySelectorAll(".item.selected");
	if (itemElements.length) {
		if (itemElements.length === 1) {
			const itemElement = itemElements[0];
			new Miro.Dialog("Restore Item", html`
				Are you sure you want to restore <b>$${itemElement._item.name}</b>?
			`, ["Yes", "No"]).then(value => {
				if (value === 0) {
					restoreItem(itemElement);
				}
			});
		} else {
			new Miro.Dialog("Restore Items", "Are you sure you want to restore the selected items?", ["Yes", "No"]).then(value => {
				if (value === 0) {
					itemElements.forEach(restoreItem);
				}
			});
		}
	}
};
const removeItems = () => {
	const itemElements = items.querySelectorAll(".item.selected");
	if (itemElements.length) {
		const inTrash = queryParent === "trash";
		if (itemElements.length === 1) {
			const itemElement = itemElements[0];
			new Miro.Dialog("Remove Item", html`
				Are you sure you want to ${inTrash ? "permanently delete" : "move"} <b>$${itemElement._item.name}</b>${inTrash ? "" : " to the trash"}?${inTrash && itemElement._item.type === "/" ? `<br>
				Items inside deleted directories will also be deleted.` : ""}
			`, ["Yes", "No"]).then(value => {
				if (value === 0) {
					removeItem(itemElement);
				}
			});
		} else {
			new Miro.Dialog("Remove Items", html`
				Are you sure you want to ${inTrash ? "permanently delete the selected items" : "move the selected items to the trash"}?${inTrash && items.querySelector(".item.typeDir.selected") ? `<br>
				Items inside deleted directories will also be deleted.` : ""}
			`, ["Yes", "No"]).then(value => {
				if (value === 0) {
					itemElements.forEach(removeItem);
				}
			});
		}
	}
};
const render = () => {
	while (ancestors.lastChild) {
		ancestors.removeChild(ancestors.lastChild);
	}
	if (queryParent) {
		let parent = getItemByID(queryParent);
		do {
			ancestors.insertBefore(html`
				<span>
					<span class="separator">/</span>
					<a class="ancestor" href="#$${parent.id}">$${parent.name}</a>
				</span>
			`, ancestors.firstChild);
		} while (parent = getItemByID(parent.parent));
	}
	ancestors.insertBefore(html`
		<span>
			<span class="separator">/</span>
			<a class="ancestor" href="#">$${Miro.data.user.name}</a>
		</span>
	`, ancestors.firstChild);
	const ancestorLinks = ancestors.querySelectorAll(".ancestor");
	ancestorLinks[ancestorLinks.length - 1].removeAttribute("href");
	while (items.lastChild) {
		items.removeChild(items.lastChild);
	}
	if (!(sortValue in sort)) {
		sortValue = SORT_DEFAULT;
	}
	const sortedItems = pipe.filter(currentItems).sort(sort[sortValue]);
	for (const item of reverseValue ? sortedItems.reverse() : sortedItems) {
		items.appendChild(item.element);
	}
	updateProperties();
	resize();
};
const goHome = () => {
	location.hash = "#";
};
const cacheItem = id => new Promise((resolve, reject) => {
	if (cachedParents.includes(id)) {
		resolve();
	} else {
		Miro.request("GET", `/users/${Miro.data.user.id}/pipe?parent=${id ? encodeForPipe(id) : ""}`).then(Miro.response(xhr => {
			for (const item of xhr.response.ancestors.concat(xhr.response.items)) {
				if (!getItemByID(item.id)) {
					setItem(new PipeItem(item));
				}
			}
			cachedParents.push(id);
			resolve();
		}, reject));
	}
});
const hashChange = () => {
	cacheItem(queryParent = location.hash.slice(1) || null).then(render).catch(goHome);
};
hashChange();
window.addEventListener("hashchange", hashChange);
let selectedItem = null;
let focusedItem = null;
const selectItem = (target, evt, button) => {
	const apparentTop = target.offsetTop - header.offsetHeight;
	if (apparentTop < items.parentNode.scrollTop) {
		items.parentNode.scrollTop = apparentTop;
	} else if (target.offsetTop + target.offsetHeight > items.parentNode.scrollTop + items.parentNode.offsetHeight) {
		items.parentNode.scrollTop = target.offsetTop + target.offsetHeight - items.parentNode.offsetHeight;
	}
	const superKey = evt.ctrlKey || evt.metaKey;
	if (button === 2 && !(superKey || evt.shiftKey)) {
		if (!target.classList.contains("selected")) {
			for (const item of items.querySelectorAll(".item.selected")) {
				item.classList.remove("selected");
			}
			target.classList.add("selected");
			selectedItem = focusedItem = target;
		}
	} else if (evt.shiftKey) {
		let selecting = !selectedItem;
		const classListMethod = superKey && selectedItem && !selectedItem.classList.contains("selected") ? "remove" : "add";
		for (const itemElement of items.querySelectorAll(".item")) {
			if (itemElement === selectedItem || itemElement === target) {
				if (selecting) {
					itemElement.classList[classListMethod]("selected");
					selecting = false;
					continue;
				} else {
					itemElement.classList[classListMethod]("selected");
					if (selectedItem !== target) {
						selecting = true;
					}
				}
			} else if (selecting) {
				itemElement.classList[classListMethod]("selected");
			} else if (!superKey) {
				itemElement.classList.remove("selected");
			}
		}
	} else {
		selectedItem = target;
		focusedItem = target;
		if (superKey) {
			target.classList.toggle("selected");
		} else {
			let othersSelected = false;
			for (const itemElement of items.querySelectorAll(".item.selected")) {
				if (itemElement !== target) {
					othersSelected = true;
					itemElement.classList.remove("selected");
				}
			}
			if (target.classList[othersSelected ? "add" : "toggle"]("selected") === false) {
				selectedItem = null;
			}
		}
	}
	updateProperties();
};
const deselectItems = () => {
	for (const item of items.querySelectorAll(".item.selected")) {
		item.classList.remove("selected");
	}
	selectedItem = focusedItem = null;
	updateProperties();
};
let mouseX = 0;
let mouseY = 0;
let mouseTarget;
let mouseDown = -1;
let mouseMoved = false;
document.addEventListener("mousedown", evt => {
	mouseMoved = false;
	mouseX = evt.clientX;
	mouseY = evt.clientY;
	indicateTarget();
	if (evt.button !== 0 && evt.button !== 2) {
		return;
	}
	mouseTarget = evt.target;
	mouseDown = evt.button;
	if (evt.target.parentNode._item) {
		focusedItem = evt.target.parentNode;
	} else if (evt.target._item) {
		focusedItem = evt.target;
	}
	indicateTarget();
}, {
	capture: true,
	passive: true
});
document.addEventListener("mouseup", evt => {
	if (mouseDown !== -1 && items.contains(mouseTarget)) {
		if (mouseTarget.parentNode._item || mouseTarget._item) {
			if (mouseMoved) {
				if (indicatedTarget) {
					const sourceParent = queryParent;
					for (const itemElement of items.querySelectorAll(".item.selected")) {
						itemElement.classList.remove("selected");
						itemElement.classList.add("loading");
						const targetID = getTargetID();
						Miro.request("PUT", `/users/${Miro.data.user.id}/pipe/${itemElement._item.id}`, {}, {
							parent: targetID
						}).then(Miro.response(xhr => {
							if ((itemElement._item.parent = xhr.response.parent) === "trash") {
								itemElement._item.trashed = xhr.response.trashed;
								itemElement._item.restore = xhr.response.restore;
							} else {
								delete itemElement._item.trashed;
								delete itemElement._item.restore;
							}
							itemElement.classList.remove("loading");
							if (queryParent === sourceParent || queryParent === targetID) {
								render();
							}
						}, () => {
							itemElement.classList.remove("loading");
							if (queryParent === sourceParent) {
								updateProperties();
							}
						}));
					}
					indicateTarget();
				}
			} else {
				selectItem(mouseTarget.parentNode._item ? mouseTarget.parentNode : mouseTarget, evt, evt.button);
			}
		} else if (mouseTarget.parentNode.parentNode._item) {
			selectItem(mouseTarget.parentNode.parentNode, {
				ctrlKey: true
			});
		} else {
			deselectItems();
		}
	}
	mouseTarget = null;
	mouseDown = -1;
}, {
	capture: true,
	passive: true
});
document.addEventListener("dblclick", evt => {
	if (!mouseMoved && evt.target.parentNode._item) {
		selectItem(evt.target.parentNode, evt, 2);
		evt.target.parentNode._item.open();
	}
}, {
	capture: true,
	passive: true
});
document.addEventListener("mousemove", evt => {
	if (evt.clientX === mouseX && evt.clientY === mouseY) {
		return;
	}
	mouseX = evt.clientX;
	mouseY = evt.clientY;
	if (mouseDown !== -1 && mouseTarget && (mouseTarget.parentNode._item || mouseTarget._item)) {
		if (!mouseMoved) {
			selectItem(mouseTarget.parentNode._item ? mouseTarget.parentNode : mouseTarget, evt, 2);
		}
		if (Miro.data.isMe) {
			indicateTarget(evt.target.classList.contains("ancestor") && evt.target.href ? evt.target : evt.target.parentNode._item && evt.target.parentNode._item.type === "/" && !evt.target.parentNode.classList.contains("selected") && !evt.target.parentNode.classList.contains("loading") && evt.target.parentNode);
		}
	}
	mouseMoved = true;
}, {
	capture: true,
	passive: true
});
const properties = document.body.querySelector("#properties");
const property = {};
for (const propertyElement of properties.querySelectorAll("[data-key]")) {
	(property[propertyElement.getAttribute("data-key")] = propertyElement)._label = propertyElement.querySelector("label");
}
const selectionInfo = properties.querySelector("#selectionInfo");
const trashInfo = properties.querySelector("#trashInfo");
const linkPreview = property.url.querySelector("#linkPreview");
const applyToDescendants = property.privacy.querySelector("#applyToDescendants");
const actionSave = property.actions.querySelector("#save");
const actionDownload = property.actions.querySelector("#download");
const actionEmbed = property.actions.querySelector("#embed");
const actionRestore = property.actions.querySelector("#restore");
const actionDelete = property.actions.querySelector("#delete");
const previewImage = properties.querySelector("#previewImage");
const previewAudio = properties.querySelector("#previewAudio");
const previewVideo = properties.querySelector("#previewVideo");
const showProperty = key => {
	property[key].classList.remove("hidden");
	const input = properties.elements[key];
	input.type = input._type;
};
const sizeReducer = (size, itemElement) => size + itemElement._item.size;
const getBase64ID = hex => (
	btoa(
		hex.match(/\w{2}/g).map(
			byte => String.fromCharCode(parseInt(byte, 16))
		).join("")
	).replace(/\+/g, "-").replace(/\//g, "_")
);
const updateProperties = () => {
	trashInfo.classList.add("hidden");
	for (const propertyElement of Object.values(property)) {
		propertyElement.classList.add("hidden");
	}
	for (const input of properties.elements) {
		if (input._type) {
			input.type = "hidden";
		}
	}
	applyToDescendants.classList.add("hidden");
	actionSave.classList.add("hidden");
	actionDownload.classList.add("hidden");
	actionEmbed.classList.add("hidden");
	actionRestore.classList.add("hidden");
	actionDelete.classList.add("hidden");
	previewImage.src = "";
	previewAudio.src = "";
	previewVideo.src = "";
	const selected = items.querySelectorAll(".item.selected");
	if (selected.length) {
		selectionInfo.textContent = `${selected.length} selected item${selected.length === 1 ? "" : "s"} (${getSizeString(Array.prototype.reduce.call(selected, sizeReducer, 0))})`;
		property.actions.classList.remove("hidden");
		const trashDeselected = !items.querySelector("#item_trash.selected");
		const oneSelected = selected.length === 1;
		if (oneSelected) {
			const item = selected[0]._item;
			const notPrivate = !item.isPrivate();
			properties.elements.name._prev = properties.elements.name.value = item.name;
			showProperty("name");
			properties.elements.name.parentNode.classList.remove("mdc-text-field--invalid");
			property.name._label.classList.add("mdc-floating-label--float-above");
			if (trashDeselected) {
				const url = item.type === "/" ? `https://file.garden/${getBase64ID(Miro.data.user.id)}/${encodeForPipe(item.path)}` : item.url;
				if (notPrivate) {
					properties.elements.url._prev = properties.elements.url.value = linkPreview.href = url;
					property.url.classList.remove("hidden");
					properties.elements.url.parentNode.classList.remove("mdc-text-field--invalid");
					property.url._label.classList.add("mdc-floating-label--float-above");
				} else if (item.parent === "trash") {
					const daysUntilDeletion = Math.ceil(30 - Math.max(0, Date.now() - item.trashed) / (1000 * 60 * 60 * 24));
					trashInfo.textContent = `${daysUntilDeletion} day${daysUntilDeletion === 1 ? "" : "s"} until deletion`;
					trashInfo.classList.remove("hidden");
				}
				actionDownload.href = `https://api.filegarden.com/users/${Miro.data.user.id}/pipe/${item.id}/download/${encodeForPipe(item.name)}`;
				actionDownload.classList.remove("hidden");
				if (item.type !== "/") {
					properties.elements.type._prev = properties.elements.type.value = item.type;
					showProperty("type");
					properties.elements.type.parentNode.classList.remove("mdc-text-field--invalid");
					property.type._label.classList.add("mdc-floating-label--float-above");
					let showEmbedAction = notPrivate;
					if (item.type.startsWith("image/")) {
						previewImage.src = `${notPrivate ? item.url : `https://api.filegarden.com/users/${Miro.data.user.id}/pipe/${item.id}/content`}?v=${Date.now()}`;
						previewImage.classList.remove("hidden");
						previewAudio.classList.add("hidden");
						previewVideo.classList.add("hidden");
						property.preview.classList.remove("hidden");
					} else if (item.type.startsWith("audio/")) {
						previewImage.classList.add("hidden");
						previewAudio.src = `${notPrivate ? item.url : `https://api.filegarden.com/users/${Miro.data.user.id}/pipe/${item.id}/content`}?v=${Date.now()}`;
						previewAudio.classList.remove("hidden");
						previewVideo.classList.add("hidden");
						property.preview.classList.remove("hidden");
					} else if (item.type.startsWith("video/")) {
						previewImage.classList.add("hidden");
						previewAudio.classList.add("hidden");
						previewVideo.src = `${notPrivate ? item.url : `https://api.filegarden.com/users/${Miro.data.user.id}/pipe/${item.id}/content`}?v=${Date.now()}`;
						previewVideo.classList.remove("hidden");
						property.preview.classList.remove("hidden");
					} else if (item.type !== "text/html") {
						showEmbedAction = false;
					}
					if (showEmbedAction) {
						actionEmbed.classList.remove("hidden");
					}
				}
			}
		} else if (trashDeselected) {
			actionDownload.href = `https://api.filegarden.com/users/${Miro.data.user.id}/pipe/download?items=${Array.prototype.map.call(selected, itemElement => itemElement._item.id).join(",")}`;
			actionDownload.classList.remove("hidden");
		}
		if (Miro.data.isMe) {
			if (trashDeselected) {
				const privacy = selected[0]._item.privacy;
				properties.elements.privacy._prev = properties.elements.privacy.value = Array.prototype.every.call(selected, itemElement => privacy === itemElement._item.privacy) ? String(privacy) : "";
				property.privacy.classList.remove("hidden");
				const inTrash = queryParent === "trash";
				if (inTrash) {
					actionRestore.classList.remove("hidden");
				}
				actionDelete.title = inTrash ? "Delete" : "Move to trash";
				actionDelete.textContent = inTrash ? "delete_forever" : "delete";
				actionDelete.classList.remove("hidden");
				if (items.querySelector(".item.typeDir.selected")) {
					applyToDescendants.classList.remove("hidden");
					applyToDescendants.disabled = !properties.elements.privacy.value;
				}
			}
			if (trashDeselected || oneSelected) {
				actionSave.disabled = true;
				actionSave.classList.remove("hidden");
			}
		}
	} else {
		selectionInfo.textContent = "No selected items";
	}
};
property.url.querySelector("#copyURL").addEventListener("click", () => {
	properties.elements.url.select();
	document.execCommand("copy");
	Miro.snackbar("URL copied to clipboard");
});
applyToDescendants.addEventListener("click", () => {
	const itemElements = items.querySelectorAll(".item.typeDir.selected")
	const privacyText = properties.elements.privacy.options[properties.elements.privacy.selectedIndex].textContent;
	new Miro.Dialog("Privacy", itemElements.length === 1 ? html`
		Are you sure you want to apply the privacy <b>$${privacyText}</b> to all of the descendants of <b>$${itemElements[0]._item.name}</b>?
	` : html`
		Are you sure you want to apply the privacy <b>$${privacyText}</b> to all of the descendants of the selected directories?
	`, ["Yes", "No"]).then(value => {
		if (value === 0) {
			const privacy = +properties.elements.privacy.value;
			for (const itemElement of itemElements) {
				const wasSelected = itemElement.classList.contains("selected");
				itemElement.classList.remove("selected");
				itemElement.classList.add("loading");
				Miro.request("PUT", `/users/${Miro.data.user.id}/pipe/${itemElement._item.id}/children`, {}, {
					privacy
				}).then(Miro.response(() => {
					const prefix = `${itemElement._item.path}/`;
					for (const item of pipe) {
						if (item.path.startsWith(prefix)) {
							item.privacy = privacy;
							if (queryParent === item.parent) {
								render();
							}
						}
					}
				})).finally(() => {
					itemElement.classList.remove("loading");
					itemElement.classList.add("selected");
				});
			}
		}
	});
});
actionEmbed.addEventListener("click", () => {
	const item = items.querySelector(".item.selected")._item;
	const embedPreview = html`<div id="embedPreview"></div>`;
	const embedProperties = html`<div id="embedProperties"></div>`;
	let embed;
	const typeAudio = item.type.startsWith("audio/");
	const typeVideo = item.type.startsWith("video/");
	const typeMedia = typeAudio || typeVideo;
	if (typeMedia) {
		embedProperties.appendChild(html`
			<div class="mdc-form-field margined">
				<div class="mdc-checkbox">
					<input id="controls" class="mdc-checkbox__native-control" type="checkbox" checked>
					<div class="mdc-checkbox__background"></div>
				</div>
				<label for="controls">Controls</label>
			</div><br>
			<div id="controlsList">
				<div class="mdc-form-field">
					<div class="mdc-checkbox">
						<input id="nodownload" class="mdc-checkbox__native-control" type="checkbox">
						<div class="mdc-checkbox__background"></div>
					</div>
					<label for="nodownload">Disable download</label>
				</div><br>
				<div class="mdc-form-field">
					<div class="mdc-checkbox">
						<input id="noremoteplayback" class="mdc-checkbox__native-control" type="checkbox">
						<div class="mdc-checkbox__background"></div>
					</div>
					<label for="noremoteplayback">Disable remote playback</label>
				</div><br>
			</div>
			<div class="mdc-form-field">
				<div class="mdc-checkbox">
					<input id="loop" class="mdc-checkbox__native-control" type="checkbox">
					<div class="mdc-checkbox__background"></div>
				</div>
				<label for="loop">Loop</label>
			</div><br>
			<div class="mdc-form-field" title="Some browsers may not autoplay media unless it is also muted.">
				<div class="mdc-checkbox">
					<input id="autoplay" class="mdc-checkbox__native-control" type="checkbox">
					<div class="mdc-checkbox__background"></div>
				</div>
				<label for="autoplay">Autoplay</label>
			</div><br>
			<div class="mdc-form-field">
				<div class="mdc-checkbox">
					<input id="muted" class="mdc-checkbox__native-control" type="checkbox">
					<div class="mdc-checkbox__background"></div>
				</div>
				<label for="muted">Muted</label>
			</div><br>
		`);
		const input = evt => {
			if (embed[evt.target.id] = evt.target.checked) {
				embed.setAttribute(evt.target.id, "");
			} else {
				embed.removeAttribute(evt.target.id);
			}
			updateCode();
		};
		const controlsList = embedProperties.querySelector("#controlsList");
		const noDownload = controlsList.querySelector("#nodownload");
		const noRemotePlayback = controlsList.querySelector("#noremoteplayback");
		let noFullscreen;
		embedProperties.querySelector("#controls").addEventListener("input", evt => {
			if (evt.target.checked) {
				controlsList.classList.remove("hidden");
				if (noDownload.checked) {
					try {
						embed.controlsList.add("nodownload");
					} catch {
						noDownload.checked = false;
					}
				}
				if (noRemotePlayback.checked) {
					try {
						embed.controlsList.add("noremoteplayback");
					} catch {
						noRemotePlayback.checked = false;
					}
				}
				if (noFullscreen && noFullscreen.checked) {
					try {
						embed.controlsList.add("nofullscreen");
					} catch {
						noFullscreen.checked = false;
					}
				}
			} else {
				controlsList.classList.add("hidden");
				embed.removeAttribute("controlslist");
			}
			input(evt);
		});
		embedProperties.querySelector("#loop").addEventListener("input", input);
		embedProperties.querySelector("#autoplay").addEventListener("input", input);
		embedProperties.querySelector("#muted").addEventListener("input", input);
		const inputControls = evt => {
			if (evt.target.checked) {
				try {
					embed.controlsList.add(evt.target.id);
				} catch {
					new Miro.Dialog("Error", "That option is not supported by your browser.");
					evt.target.checked = false;
				}
			} else {
				try {
					embed.controlsList.remove(evt.target.id);
					if (!embed.controlsList.length) {
						embed.removeAttribute("controlslist");
					}
				} catch {}
			}
			updateCode();
		};
		noDownload.addEventListener("input", inputControls);
		noRemotePlayback.addEventListener("input", inputControls);
		if (typeAudio) {
			embed = document.createElement("audio");
		} else {
			embed = document.createElement("video");
			controlsList.appendChild(html`
				<div class="mdc-form-field">
					<div class="mdc-checkbox">
						<input id="nofullscreen" class="mdc-checkbox__native-control" type="checkbox">
						<div class="mdc-checkbox__background"></div>
					</div>
					<label for="nofullscreen">Disable fullscreen</label>
				</div><br>
			`);
			(noFullscreen = controlsList.querySelector("#nofullscreen")).addEventListener("input", inputControls);
		}
		embed.controls = true;
		if (embed.controlsList) {
			embed.controlsList.add("nodownload");
			noDownload.checked = true;
		}
	}
	if (!typeAudio) {
		embedProperties.insertBefore(html`
			<div class="mdc-text-field margined">
				<input id="width" class="mdc-text-field__input" type="number" min="0">
				<label class="mdc-floating-label" for="width">Width</label>
				<div class="mdc-line-ripple"></div>
			</div><br>
			<div class="mdc-text-field">
				<input id="height" class="mdc-text-field__input" type="number" min="0">
				<label class="mdc-floating-label" for="height">Height</label>
				<div class="mdc-line-ripple"></div>
			</div><br>
		`, embedProperties.firstChild);
		const input = evt => {
			if (evt.target.checkValidity()) {
				if (evt.target.value) {
					embed[evt.target.id] = evt.target.value;
				} else {
					embed.removeAttribute(evt.target.id);
				}
				updateCode();
			}
		};
		embedProperties.querySelector("#width").addEventListener("input", input);
		embedProperties.querySelector("#height").addEventListener("input", input);
		if (item.type.startsWith("image/")) {
			embed = document.createElement("img");
		} else if (item.type === "text/html") {
			embed = html`<iframe style="border: 0;"></iframe>`;
		}
	}
	embed.src = item.url;
	const codeField = html`
		<div class="mdc-text-field mdc-text-field--textarea">
			<textarea id="code" class="mdc-text-field__input" title="Click to copy" rows="4" cols="64" readonly></textarea>
			<label class="mdc-floating-label" for="code">HTML Code</label>
		</div>
	`;
	const code = codeField.querySelector("#code");
	code.addEventListener("click", () => {
		code.select();
		document.execCommand("copy");
		Miro.snackbar("Copied code to clipboard");
	});
	const emptyValues = /=""/g;
	const updateCode = () => {
		code.value = embed.outerHTML.replace(emptyValues, "");
	};
	updateCode();
	embedPreview.appendChild(embed);
	new Miro.Dialog("Embed", embedPreview).element.classList.add("embedDialog");
	embedPreview.parentNode.appendChild(embedProperties);
	embedProperties.insertBefore(codeField, embedProperties.firstChild);
});
updateProperties();
if (Miro.data.isMe) {
	const checkName = async (name, parent = queryParent) => {
		if (parent !== "trash") {
			await cacheItem(parent);
			let takenItem;
			while (takenItem = getItemByName(name, parent)) {
				const value = await new Miro.Dialog("Error", html`
					<b>$${takenItem.path}</b> already exists.
				`, ["Replace", "Rename", "Cancel"]);
				if (value === 0) {
					if (await new Miro.Dialog("Replace", html`
						Are you sure you want to replace <b>$${takenItem.name}</b>?
					`, ["Yes", "No"]) === 0) {
						Miro.response(() => {
							takenItem.delete();
							render();
						})(await Miro.request("DELETE", `/users/${Miro.data.user.id}/pipe/${takenItem.id}`));
					}
				} else if (value === 1) {
					const dialog = new Miro.Dialog("Rename", html`
						Enter a new name for <b>$${name}</b>.<br>
						<div class="mdc-text-field">
							<input name="name" class="mdc-text-field__input" type="text" value="$${name}" maxlength="255" size="24" pattern="^[^/]+$" autocomplete="off" spellcheck="false" required>
							<div class="mdc-line-ripple"></div>
						</div>
					`, [{
						text: "Okay",
						type: "submit"
					}, "Cancel"]);
					await Miro.wait();
					dialog.form.elements.name.focus();
					const extensionIndex = dialog.form.elements.name.value.lastIndexOf(".");
					dialog.form.elements.name.setSelectionRange(0, extensionIndex > 0 ? extensionIndex : dialog.form.elements.name.value.length);
					if (await dialog === 0) {
						name = dialog.form.elements.name.value;
					}
				} else {
					return false;
				}
			}
		}
		return name;
	};
	const creation = container.querySelector("#creation");
	const queuedItems = container.querySelector("#queuedItems");
	const queue = [];
	const failedQueue = [];
	const updateQueue = () => {
		if (!queue.length) {
			creation.classList.remove("loading");
			return;
		}
		let loaded = 0;
		let total = 0;
		let done = true;
		for (const item of queue) {
			loaded += item.loaded;
			total += item.file.size;
			if (!item.item) {
				done = false;
			}
		}
		if (done) {
			creation.classList.remove("loading");
			queue.length = 0;
		} else {
			creation.classList.add("loading");
			creation.style.backgroundSize = `${100 * (done ? 1 : loaded / total)}%`;
		}
	};
	const belowQueue = document.getElementById('belowQueue');
	const updateBelowQueue = () => {
		if (failedQueue.length) {
			belowQueue.classList.remove("hidden");
		} else {
			belowQueue.classList.add("hidden");
		}
	};
	window.onbeforeunload = () => container.querySelector(".loading") || !actionSave.disabled || undefined;
	const PipeFile = class PipeFile {
		constructor(file, name, parent = queryParent) {
			this.file = file;
			const data = {
				parent: this.parent = parent,
				name: this.name = name || file.name
			};
			if (typeof this.file === "string") {
				data.url = this.file;
			}
			this.path = this.parent ? `${getItemByID(this.parent).path}/${this.name}` : this.name;
			this.element = html`
				<a class="item loading" draggable="false" ondragstart="return false;">
					<div class="label">
						<div class="title" title="$${this.name}">$${this.name}</div>
						<div class="subtitle" title="$${data.url || `0 B / ${this.file.size} B`}">$${data.url || `0% (0 B / ${this.size = getSizeString(this.file.size)}`})</div>
					</div>
					<button class="close mdc-icon-button material-icons">close</button>
				</a>
			`;
			(this.closeElement = this.element.querySelector(".close")).addEventListener("click", evt => {
				this.close(evt);
			});
			this.subtitleElement = this.element.querySelector(".subtitle");
			this.request = Miro.request("POST", `/users/${Miro.data.user.id}/pipe`, {
				"Content-Type": "application/octet-stream",
				"X-Data": encodeURI(JSON.stringify(data))
			}, this.file, xhr => {
				this.xhr = xhr;
				if (!data.url) {
					this.loaded = 0;
					this.xhr.upload.addEventListener("progress", evt => {
						if (this.xhr.readyState !== XMLHttpRequest.DONE) {
							const percentage = 100 * ((this.loaded = evt.loaded) / this.file.size || 1);
							this.element.style.backgroundSize = `${percentage}%`;
							this.subtitleElement.title = `${this.loaded} B / ${this.file.size} B`;
							this.subtitleElement.textContent = (
								percentage === 100
									? 'Processing...'
									: `${Math.floor(10 * percentage) / 10}% (${getSizeString(this.loaded)} / ${this.size})`
							);
							updateQueue();
						}
					});
					queue.push(this);
					updateQueue();
				}
			}, true).then(Miro.response(xhr => {
				if (this.cancelDialog) {
					this.cancelDialog.close();
				}
				this.element.classList.remove("loading");
				this.element.href = `#${this.parent || ""}`;
				this.subtitleElement.title = `${xhr.response.size} B`;
				this.subtitleElement.textContent = getSizeString(xhr.response.size);
				this.closeElement.textContent = "done";
				const item = setItem(this.item = new PipeItem(xhr.response));
				updateQueue();
				let parent = this;
				while (parent = getItemByID(parent.parent)) {
					parent.size += item.size;
				}
				if (queryParent === this.parent) {
					selectItem(item.element, {
						ctrlKey: true
					});
					render();
				}
			}, (xhr, error) => {
				this.fail();
				this.element.classList.remove("loading");
				this.element.classList.add("error");
				this.subtitleElement.title = error;
				this.subtitleElement.textContent = "An error occurred. Click to retry.";
				this.element.addEventListener("click", evt => {
					if (this.closeElement.contains(evt.target)) {
						return;
					}
					this.retry(evt);
				});
				if (this.dequeue()) {
					updateQueue();
				}
			}));
		}
		dequeue() {
			const queueIndex = queue.indexOf(this);
			if (queueIndex === -1) {
				return false;
			} else {
				queue.splice(queueIndex, 1);
				return true;
			}
		}
		async close(evt) {
			if (evt instanceof Event) {
				evt.preventDefault();
			}
			if (this.element.classList.contains("loading") && await (this.cancelDialog = new Miro.Dialog("Cancel", html`
				Are you sure you want to cancel uploading <b>$${this.name}</b>?
			`, ["Yes", "No"])) !== 0) {
				delete this.cancelDialog;
				return;
			}
			this.unfail();
			delete this.cancelDialog;
			if (this.element.parentNode) {
				this.xhr.abort();
				this.element.parentNode.removeChild(this.element);
				if (this.dequeue()) {
					updateQueue();
				}
			}
		}
		retry() {
			this.unfail();
			this.element.parentNode.replaceChild(new PipeFile(this.file, this.name, this.parent).element, this.element);
			this.dequeue();
		}
		fail() {
			if (failedQueue.includes(this)) {
				return;
			}
			failedQueue.push(this);
			updateBelowQueue();
		}
		unfail() {
			const failedQueueIndex = failedQueue.indexOf(this);
			if (failedQueueIndex === -1) {
				return;
			}
			failedQueue.splice(failedQueueIndex, 1)
			updateBelowQueue();
		}
	};
	const addFile = async (file, parent, name) => {
		if (file.size > 100 * 1024 * 1024 /* 100 MiB */) {
			new Miro.Dialog("Error", "Currently, we don't support uploading files above 100 MiB.");
			return;
		}
		if (!(name = await checkName(typeof name === "string" ? name : file.name, parent))) {
			return;
		}
		queuedItems.insertBefore(new PipeFile(file, name, parent).element, queuedItems.firstChild);
	};
	const addURL = async (url, parent) => {
		let name = decodeURIComponent(url);
		name = name.slice(name.lastIndexOf("/") + 1);
		const queryIndex = name.indexOf("?");
		if (queryIndex !== -1) {
			name = name.slice(0, queryIndex);
		}
		if (!(name = await checkName(await enterFileName("URL Upload", name, url), parent))) {
			return;
		}
		queuedItems.insertBefore(new PipeFile(url, name, parent).element, queuedItems.firstChild);
	};
	const fileInput = document.createElement("input");
	fileInput.type = "file";
	fileInput.multiple = true;
	fileInput.addEventListener("change", () => {
		for (const file of fileInput.files) {
			addFile(file);
		}
		fileInput.value = null;
	});
	creation.querySelector("#addFiles").addEventListener("click", () => {
		fileInput.click();
	});
	const PipeDirectory = class PipeDirectory {
		constructor(name, parent = queryParent) {
			this.parent = parent;
			this.name = name;
			this.request = Miro.request("POST", `/users/${Miro.data.user.id}/pipe`, {
				"X-Data": encodeURI(JSON.stringify({
					parent: this.parent,
					name: this.name,
					type: "/"
				}))
			}).then(Miro.response(xhr => {
				cachedParents.push(setItem(this.item = new PipeItem(xhr.response)).id);
				if (queryParent === this.parent) {
					selectItem(this.item.element, {
						ctrlKey: true
					});
					render();
				}
			}));
		}
	};
	creation.querySelector("#addDirectory").addEventListener("click", () => {
		const dialog = new Miro.Dialog("Directory", html`
			Enter a directory name.<br>
			<div class="mdc-text-field">
				<input name="name" class="mdc-text-field__input" type="text" maxlength="255" size="24" pattern="^[^/]+$" autocomplete="off" spellcheck="false" required>
				<div class="mdc-line-ripple"></div>
			</div>
		`, [{
			text: "Okay",
			type: "submit"
		}, "Cancel"]).then(async value => {
			if (value === 0) {
				const name = await checkName(dialog.form.elements.name.value);
				if (name) {
					new PipeDirectory(name);
				}
			}
		});
	});
	creation.querySelector("#addURL").addEventListener("click", () => {
		const dialog = new Miro.Dialog("URL Upload", html`
			Enter a URL to upload from.<br>
			<div class="mdc-text-field">
				<input name="url" class="mdc-text-field__input" type="url" maxlength="2047" size="24" autocomplete="off" spellcheck="false" required>
				<div class="mdc-line-ripple"></div>
			</div>
		`, [{
			text: "Okay",
			type: "submit"
		}, "Cancel"]).then(async value => {
			if (value === 0) {
				addURL(dialog.form.elements.url.value);
			}
		});
	});
	const enterFileName = async (title, name, label) => await new Promise(async resolve => {
		const dialog = new Miro.Dialog(title, html`
			Enter a file name${label ? ` for <b>${html.escape(label)}</b>` : ""}.<br>
			<div class="mdc-text-field">
				<input name="name" class="mdc-text-field__input" type="text" value="$${name}" maxlength="255" size="24" pattern="^[^/]+$" autocomplete="off" spellcheck="false" required>
				<div class="mdc-line-ripple"></div>
			</div>
		`, [{
			text: "Okay",
			type: "submit"
		}, "Cancel"]);
		await Miro.wait();
		dialog.form.elements.name.focus();
		const extensionIndex = dialog.form.elements.name.value.lastIndexOf(".");
		dialog.form.elements.name.setSelectionRange(0, extensionIndex > 0 ? extensionIndex : dialog.form.elements.name.value.length);
		if (await dialog === 0) {
			name = dialog.form.elements.name.value;
		} else {
			return;
		}
		resolve(name);
	});
	const htmlFilenameTest = /\/([^\/]+?)"/;
	document.addEventListener("paste", async evt => {
		if (Miro.focused() && !Miro.typing() && evt.clipboardData.items.length) {
			let file;
			let htmlString;
			let string;
			for (const dataTransferItem of evt.clipboardData.items) {
				if (dataTransferItem.kind === "file") {
					file = dataTransferItem;
				} else if (dataTransferItem.kind === "string") {
					if (dataTransferItem.type === "text/html") {
						htmlString = dataTransferItem;
					} else if (dataTransferItem.type === "text/plain") {
						string = dataTransferItem;
					}
				}
			}
			if (file) {
				let name = (file = file.getAsFile()).name;
				if (htmlString) {
					const htmlFilename = (await new Promise(htmlString.getAsString.bind(htmlString))).match(htmlFilenameTest);
					name = htmlFilename ? htmlFilename[1] : "file";
				}
				addFile(file, undefined, await enterFileName("Paste", name));
			} else if (string && (string = await new Promise(string.getAsString.bind(string))).includes("://")) {
				try {
					decodeURIComponent(string);
					addURL(string);
				} catch {}
			}
		}
	}, {
		capture: true,
		passive: true
	});
	let allowDrop = true;
	document.addEventListener("dragstart", evt => {
		allowDrop = false; // This prevents things on the page from being dropped to the same page.
	}, {
		capture: true,
		passive: true
	});
	document.addEventListener("dragend", () => {
		allowDrop = true;
	}, {
		capture: true,
		passive: true
	});
	let dragLeaveTimeout;
	document.addEventListener("dragover", evt => {
		evt.preventDefault();
		if (dragLeaveTimeout) {
			clearTimeout(dragLeaveTimeout);
			dragLeaveTimeout = null;
		}
		if (allowDrop && Miro.focused() && (evt.dataTransfer.types.includes("Files") || evt.dataTransfer.types.includes("text/uri-list"))) {
			if (items.contains(evt.target)) {
				for (const itemElement of items.querySelectorAll(".item.typeDir")) {
					if (itemElement.contains(evt.target)) {
						indicateTarget(itemElement);
						return;
					}
				}
			} else if (evt.target.classList.contains("ancestor")) {
				indicateTarget(evt.target);
				return;
			}
			indicateTarget(container);
		}
	}, true);
	document.addEventListener("dragleave", () => {
		if (dragLeaveTimeout) {
			clearTimeout(dragLeaveTimeout);
		}
		dragLeaveTimeout = setTimeout(indicateTarget, 100);
	}, {
		capture: true,
		passive: true
	});
	document.addEventListener("drop", evt => {
		evt.preventDefault();
		if (allowDrop && Miro.focused() && indicatedTarget) {
			const targetID = getTargetID();
			indicateTarget();
			if (evt.dataTransfer.files.length) {
				const traverseEntries = async (entries, parent) => {
					Miro.startLoading();
					await cacheItem(parent);
					for (const entry of entries) {
						if (entry.isDirectory) {
							let item = getItemByName(entry.name, parent);
							if (!item) {
								const directory = new PipeDirectory(entry.name, parent);
								await directory.request;
								({item} = directory);
							}
							const reader = entry.createReader();
							let entries;
							while ((entries = await new Promise(reader.readEntries.bind(reader))).length) {
								traverseEntries(entries, item.id);
							}
						} else {
							entry.file(file => {
								addFile(file, parent);
							});
						}
					}
					Miro.endLoading();
				};
				const rootEntries = [];
				for (const item of evt.dataTransfer.items) {
					const entry = item.webkitGetAsEntry?.();
					if (entry) {
						rootEntries.push(entry);
					} else {
						const file = item.getAsFile();
						if (file) {
							addFile(file, targetID);
						}
					}
				}
				if (rootEntries.length) {
					traverseEntries(rootEntries, targetID);
				}
			} else if (evt.dataTransfer.types.includes("text/uri-list")) {
				addURL(evt.dataTransfer.getData("text/uri-list"), targetID);
			}
		}
	}, true);
	actionRestore.addEventListener("click", restoreItems);
	actionDelete.addEventListener("click", removeItems);
	for (const input of properties.elements) {
		const instanceInput = input instanceof HTMLInputElement;
		input._input = instanceInput || input instanceof HTMLSelectElement;
		if (instanceInput && !input.readOnly) {
			input._type = input.type;
		}
	}
	const changed = [];
	const onInput = evt => {
		applyToDescendants.disabled = !properties.elements.privacy.value;
		changed.length = 0;
		for (const input of properties.elements) {
			if (input._input && input.type !== "hidden") {
				if (input.checkValidity()) {
					if (input._prev !== Miro.value(input)) {
						changed.push(input);
					}
				} else {
					changed.length = 0;
					break;
				}
			}
		}
		actionSave.disabled = !changed.length;
	};
	properties.addEventListener("input", onInput);
	properties.addEventListener("change", onInput);
	properties.addEventListener("submit", async evt => {
		evt.preventDefault();
		Miro.formState(properties, false);
		const changedName = changed.includes(properties.elements.name);
		if (changedName) {
			let name = await checkName(properties.elements.name.value);
			if (!name) {
				Miro.formState(properties, true);
				return;
			}
			properties.elements.name.value = name;
		}
		const changedType = changed.includes(properties.elements.type);
		const changedPrivacy = changed.includes(properties.elements.privacy);
		const selected = items.querySelectorAll(".item.selected");
		const sourceParent = queryParent;
		let notUpdatedFormState = true;
		for (const itemElement of selected) {
			itemElement.classList.remove("selected");
			itemElement.classList.add("loading");
			const data = {};
			if (changedName) {
				data.name = properties.elements.name.value;
			}
			if (changedType) {
				data.type = properties.elements.type.value;
			}
			if (changedPrivacy) {
				data.privacy = +properties.elements.privacy.value;
			}
			Miro.request("PUT", `/users/${Miro.data.user.id}/pipe/${itemElement._item.id}`, {}, data).then(Miro.response(async xhr => {
				if (changedName) {
					itemElement._item.name = xhr.response.name;
				}
				if (changedType) {
					itemElement._item.type = xhr.response.type;
				}
				if (changedPrivacy) {
					itemElement._item.privacy = xhr.response.privacy;
				}
				itemElement.classList.remove("loading");
				itemElement.classList.add("selected");
				await Miro.wait();
				if (queryParent === sourceParent) {
					render();
					if (notUpdatedFormState) {
						Miro.formState(properties, true);
						actionSave.disabled = true;
						notUpdatedFormState = false;
					}
				}
			}, () => {
				itemElement.classList.remove("loading");
				itemElement.classList.add("selected");
				if (queryParent === sourceParent) {
					updateProperties();
					if (notUpdatedFormState) {
						Miro.formState(properties, true);
						actionSave.disabled = true;
						notUpdatedFormState = false;
					}
				}
			}));
		}
	});
	document.getElementById('retryAll').addEventListener('click', () => {
		for (const item of failedQueue.slice()) {
			item.retry();
		}
	});
}
document.addEventListener("keydown", evt => {
	if (!Miro.typing() && Miro.focused()) {
		const superKey = evt.ctrlKey || evt.metaKey;
		if (evt.keyCode === 8 || evt.keyCode === 46) { // `backspace` || `delete`
			if (Miro.data.isMe) {
				removeItems();
			}
		} else if (evt.keyCode === 13) { // `enter`
			evt.preventDefault();
			const itemElement = items.querySelector(".item.selected");
			if (itemElement) {
				itemElement._item.open();
			}
		} else if (evt.keyCode === 27) { // `esc`
			deselectItems();
		} else if (evt.keyCode === 35) { // `end`
			evt.preventDefault();
			if (items.lastChild) {
				focusedItem = items.lastChild;
				if (evt.shiftKey || !superKey) {
					selectItem(items.lastChild, evt);
				}
			}
		} else if (evt.keyCode === 36) { // `home`
			evt.preventDefault();
			if (items.firstChild) {
				focusedItem = items.firstChild;
				if (evt.shiftKey || !superKey) {
					selectItem(items.firstChild, evt);
				}
			}
		} else if (evt.keyCode === 37 || evt.keyCode === 38) { // `left` || `up`
			evt.preventDefault();
			const item = focusedItem ? focusedItem.previousSibling || items.lastChild : items.firstChild;
			if (item) {
				focusedItem = item;
				if (evt.shiftKey || !superKey) {
					selectItem(item, evt);
				}
			}
		} else if (evt.keyCode === 39 || evt.keyCode === 40) { // `right` || `down`
			evt.preventDefault();
			const item = focusedItem ? focusedItem.nextSibling || items.firstChild : items.firstChild;
			if (item) {
				focusedItem = item;
				if (evt.shiftKey || !superKey) {
					selectItem(item, evt);
				}
			}
		} else if (superKey && evt.keyCode === 65) { // ^`A`
			evt.preventDefault();
			for (const item of items.querySelectorAll(".item:not(.selected)")) {
				item.classList.add("selected");
			}
			updateProperties();
		}
	}
}, true);
const viewMode = header.querySelector("#viewMode");
let viewValue = +localStorage.pipe_viewMode || 0;
const updateViewMode = () => {
	if (viewValue) {
		items.classList.add("tiles");
		viewMode.title = "List view";
		viewMode.textContent = "view_list";
	} else {
		items.classList.remove("tiles");
		viewMode.title = "Tile view";
		viewMode.textContent = "view_module";
	}
	resize();
};
viewMode.addEventListener("click", () => {
	localStorage.pipe_viewMode = viewValue = (viewValue + 1) % 2;
	updateViewMode();
});
const resize = () => {
	indicateTarget();
	if (viewValue) {
		for (const itemElement of items.querySelectorAll(".item")) {
			if (itemElement._item.thumbnailHidden && itemElement.offsetTop + itemElement.offsetHeight > items.parentNode.scrollTop + header.offsetHeight && itemElement.offsetTop - items.parentNode.scrollTop < items.parentNode.offsetHeight) {
				itemElement.insertBefore(itemElement._item.thumbnailElement, itemElement.firstChild);
				itemElement._item.thumbnailHidden = false;
			}
		}
	}
};
items.parentNode.addEventListener("scroll", resize, {
	passive: true
});
window.addEventListener("resize", resize);
updateViewMode();
if (!Miro.in) {
	new Miro.Dialog('Warning', 'You aren\'t signed in, so not all items may be visible.')
}
