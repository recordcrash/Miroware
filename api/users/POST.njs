if(testEmail(this.req.body.email)) {
	if(await users.findOne({
		email: this.req.body.email
	})) {
		this.value = {
			error: "That email is already in use."
		};
		this.status = 422;
		this.done();
	} else {
		authenticate(this).then(async data => {
			const login = [{
				service: this.req.body.service,
				id: data.id
			}];
			if(await users.findOne({
				login
			})) {
				this.value = {
					error: "That login method is already in use."
				};
				this.status = 422;
			} else {
				const now = Date.now();
				this.value = {
					id: this.req.session.id = (await users.insertOne({
						created: now,
						updated: now,
						login,
						email: this.req.body.email,
						verified: this.req.body.email === data.email && data.verified,
						publicEmail: false,
						name: data.name,
						desc: "",
						icon: ""
					})).ops[0]._id
				};
				this.status = 201;
			}
			this.done();
		});
	}
} else {
	this.value = {
		error: "That is not a valid email."
	};
	this.status = 422;
	this.done();
}
