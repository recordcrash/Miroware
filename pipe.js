'use strict';
console.log('< Pipe >')
const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const { S3 } = require('@aws-sdk/client-s3');
const archiver = require('archiver');
const youKnow = require('./secret/youknow.js');
const axios = require('axios');
let b2Authorization;
const authorizeB2 = async () => {
	const { data } = await axios.get('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
		auth: {
			username: youKnow.b2.accessKeyId,
			password: youKnow.b2.secretAccessKey
		}
	});

	b2Authorization = data.authorizationToken;
};
const b2 = new S3({
	credentials: youKnow.b2,
	sslEnabled: true,
	endpoint: 'https://s3.us-west-004.backblazeb2.com',
	region: 'us-west-004'
});
const encodeForPipe = name => encodeURIComponent(name).replace(/%2f/gi, '/').replace(/%40/g, '@');
(async () => {
	require('replthis')(v => eval(v));
	const db = (await MongoClient.connect(youKnow.db, {
		useUnifiedTopology: true
	})).db('web');
	const users = db.collection('users');
	await authorizeB2();
	const app = express();
	app.disable('X-Powered-By');
	const request = path => new Promise(resolve => {
		https.get({
			hostname: 'b2.filegarden.com',
			path,
			headers: {
				Authorization: b2Authorization
			}
		}, resolve);
	});
	app.get('*', async (req, res) => {
		let path = req.path;
		if (path === '/') {
			res.redirect(302, 'https://miroware.io/pipe/');
			return;
		}
		res.set('Access-Control-Allow-Origin', '*').set('Content-Security-Policy', 'default-src file.garden pipe.miroware.io miro.gg data: mediastream: blob: \'unsafe-inline\' \'unsafe-eval\'');
		if (req.hostname === 'pipe.miroware.io') {
			const referrer = req.get('Referer');
			if (referrer) {
				console.log(referrer, req.url);
			}
			let url = req.url.slice(1);
			url = url.replace(/^[0-9a-f]{24}/, hex => Buffer.from(hex, 'hex').toString('base64url'));
			res.redirect(301, `https://file.garden/${url}`);
		} else {
			path = path.slice(1);
			try {
				path = decodeURIComponent(path);
			} catch (err) {
				res.header('Content-Type', 'text/plain').status(400).send(err.message);
				return;
			}
			const slashIndex = path.indexOf('/');
			let userID;
			try {
				if (slashIndex === -1) {
					throw 404;
				}
				userID = new ObjectId(
					Buffer.from(path.slice(0, slashIndex), 'base64url')
				);
			} catch {
				res.sendStatus(404);
				return;
			}
			const user = await users.findOne({
				_id: userID
			});
			if (user) {
				path = path.slice(slashIndex + 1);
				if (path.startsWith(`${user.pipe.find(item => item.id === 'trash').path}/`)) {
					res.sendStatus(404);
					return;
				}
				const item = user.pipe.find(item => item.path === path && item.privacy !== 2);
				if (item) {
					const userIDString = user._id.toString('base64url')
					if (item.type === '/') {
						res.set('Content-Type', 'application/zip');
						const archive = archiver('zip');
						archive.on('error', err => {
							throw err;
						});
						archive.pipe(res);
						const sliceStart = path.length + 1; // Change `path.length` to `path.lastIndexOf('/')` to put the folder inside of the ZIP instead of having the ZIP be the folder itself.
						const promises = [];
						const scan = parent => {
							for (const item of user.pipe) {
								if (item.parent === parent && item.privacy === 0) {
									if (item.type === '/') {
										scan(item.id);
									} else {
										promises.push(request(`/${userIDString}/${encodeForPipe(item.path)}`).then(response => {
											archive.append(response, {
												name: item.path.slice(sliceStart)
											});
										}));
									}
								}
							}
						};
						scan(item.id);
						Promise.all(promises).then(() => {
							archive.finalize();
						});
					} else {
						b2.getObject({
							Bucket: 'file-garden',
							Key: `${userIDString}/${item.id}`
						}, (err, data) => {
							if (err) {
								console.error(err);
								res.status(err.statusCode).send(err.message);
							} else {
								res.set('Content-Type', 'download' in req.query ? 'application/octet-stream' : item.type);
								res.set('Content-Length', data.ContentLength);
								data.Body.pipe(res);
							}
						});
					}
				} else {
					res.sendStatus(404);
					return;
				}
			} else {
				res.sendStatus(404);
				return;
			}
		}
	});
	http.createServer(app).listen(8082);
})();
fs.watch(__filename, () => {
	process.exit();
});
