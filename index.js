const mysql = require('mysql');
const jwt = require("jsonwebtoken");
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
var cors = require('cors');
const app = express();
const port = process.env.PORT || 3013;
const { urlencoded } = require('express');
const server = require('http').createServer(app);
const fflate = require('fflate');

// Thiết lập request
app.use(cors({
	origin: true,
	credentials: true,
	optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}));
// app.use(function (req, res, next) {
// 	res.header("Access-Control-Allow-Origin", "*");
// 	res.header("Access-Control-Allow-Credentials", true);
// 	next();
// });
// app.use(function (req, res, next) {
// 	// res.header("Access-Control-Allow-Origin", ['https://localhost']);
// 	var allowedOrigins = ['http://127.0.0.1', 'http://localhost'];
// 	var origin = req.headers.origin;
// 	// if (allowedOrigins.includes(origin)) { res.setHeader('Access-Control-Allow-Origin', origin); }
// 	res.setHeader('Access-Control-Allow-Origin', origin);
// 	res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
// 	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS, DELETE, PATCH');
// 	res.setHeader('Access-Control-Allow-Credentials', true);
// 	next();
// });
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
// app.disable('x-powered-by');
app.use(function (req, res, next) {
	res.removeHeader("x-powered-by");
	res.setHeader("Server", 'from phimlau wit luv');
	res.setHeader('X-PhimLau', 'bar');
	next();
});

// Thiết lập csdl
var conn = require('./config');
// Kiểm tra kết nối
conn.connect(function (err) { if (err) throw err; console.log("Connected!"); });
var func = require('./function');
var f1 = new func(conn);

// Đăng nhập
app.post("/signIn", async (request, response) => {
	var body = request.body;
	var a = { error: true, message: 'Thông tin yêu cầu bị thiếu!' };
	if ((body.username || body.email) && body.password) a = await f1.signIn(body.username || body.email, body.password);
	response.send(a);
});
// Đăng ký
app.post("/signUp", async (request, response) => {
	var body = request.body;
	var a = { error: true, message: 'Thông tin yêu cầu bị thiếu!' };
	if (body.fullname && body.username && body.email && body.password) a = await f1.signUp(body.fullname, body.username, body.email, body.password);
	response.send(a);
});
// Kiểm tra phiên đăng nhập, token
app.post("/checkSession", async (request, response) => {
	var body = request.body;
	var a = { error: true, message: 'Thông tin yêu cầu bị thiếu!' };
	if (body.user_id && body.token) a = await f1.checkSession(body.user_id, body.token);
	response.send(a);
});
// Lấy thông tin user
// app.get("/me", async (request, response) => {
// 	var query = request.query;
// 	var user_id = query.user_id, token = query.token;
// 	var a = { error: true, message: 'Thông tin yêu cầu bị thiếu!' };
// 	if (user_id && token) a = await f1.checkSession(user_id, token);
// 	if (a.error == false) { a = await f1.getProfileById(user_id); a = a[0]; delete a.password; }
// 	response.send(a);
// });
// // Cập nhật thông tin user // Query nào được truyền sẽ update thông tin đó
// app.post("/me", async (request, response) => {
// 	var body = request.body, query = request.query;
// 	var user_id = body.user_id, token = body.token;
// 	// console.log(body.fullname);
// 	var a = { error: true, message: 'Thông tin yêu cầu bị thiếu!' }, b;
// 	if (user_id && token) {
// 		b = await f1.checkSession(user_id, token);
// 		if (b.error == false) a = await f1.updateProfile(user_id, body.fullname, body.avatar, body.date_of_birth, body.location);
// 	}
// 	response.send(a);
// });
app.get('/countries', async (req, res) => {
	res.send(await f1.getCountries());
});
app.get('/categories', async (req, res) => {
	res.send(await f1.getCategories());
});
// Lấy thông tin gerne bởi category_id
app.get("/category/:cid", async (request, response) => {
	var query = request.query, params = request.params;
	var user_id = query.user_id, token = query.token, cid = params.cid;
	var a = { error: true, message: 'Thông tin yêu cầu bị thiếu!' }, b;
	if (user_id && token && cid) {
		b = await f1.checkSession(user_id, token);
		if (b.error == false) { b = await f1.getCategoryById(cid); if (b.length > 0) a = b[0]; else a.message = 'Category ID không tồn tại!'; }
	}
	response.send(a);
});
// Cập nhật thông tin category bởi category_id
app.post("/category/:cid", async (request, response) => {
	var query = request.query, params = request.params, body = request.body;
	var user_id = body.user_id, token = body.token, cid = params.cid, name = body.name, icon = body.icon;
	var a = { error: true, message: 'Thông tin yêu cầu bị thiếu!' }, b;
	if (user_id && token && cid) {
		b = await f1.checkSession(user_id, token);
		if (b.error == false) { a = await f1.updateCategory(cid, name, icon); }
	}
	response.send(a);
});
app.get('/films', async (req, res) => {
	var q = req.query, p = req.params, b = req.body;
	res.send(await f1.getFilms(q.country, q.category, q.search, q.page));
});
app.route('/film/:fid/episodes')
	.get(async (req, res) => {
		var q = req.query, p = req.params, b = req.body;
		var film_id = p.fid;
		var a = { error: true, message: 'Thông tin yêu cầu bị thiếu!' };
		if (film_id) a = await f1.getEpByFilmId(film_id);
		res.send(a);
	})
	.post(async (req, res) => {
		var q = req.query, p = req.params, b = req.body;
		var user_id = b.user_id, token = b.token, film_id = p.fid, ep_name = b.ep_name, ep_url = b.ep_url;
		var a = { error: true, message: 'Thông tin yêu cầu bị thiếu!' };
		if (film_id && ep_name && ep_url) {
			a = await f1.checkSession(user_id, token);
			if (a.error == false) a = await f1.postEp(film_id, ep_name, ep_url);
		}
		res.send(a);
	});
app.post('/film/:fid/views', async (req, res) => {
	var q = req.query, p = req.params, b = req.body;
	var film_id = p.fid;
	var a = { error: true, message: 'Thông tin yêu cầu bị thiếu!' };
	if (film_id) a = await f1.postView(film_id);
	res.send(a);
});
app.route('/film/:fid')
	.get(async (req, res) => {
		var q = req.query, p = req.params, b = req.body;
		var film_id = p.fid;
		var a = { error: true, message: 'Thông tin yêu cầu bị thiếu!' };
		if (film_id) a = await f1.getFilm(film_id);
		res.send(a);
	})
	.put(async (req, res) => {
		var q = req.query, p = req.params, b = req.body;
		var film_id = p.fid;
		var user_id = b.user_id, token = b.token, film_name = b.film_name, film_name_en = b.film_name_en, film_director = b.film_director, film_actors = b.film_actors, film_poster = b.film_poster, film_trailer = b.film_trailer, film_content = b.film_content, film_summary = b.film_summary, film_duration = b.film_duration, film_series = b.film_series, film_release_year = b.film_release_year, film_country = b.film_country, film_categories = b.film_categories;
		var a = { error: true, message: 'Thông tin yêu cầu bị thiếu!' }, b;
		if (film_id && film_name) {
			a = await f1.checkSession(user_id, token);
			if (a.error == false) a = await f1.updateFilm(film_id, film_name, film_name_en || '', film_director || '', film_actors || '', film_poster || '', film_trailer || '', film_content || '', film_summary || '', film_duration || 0, film_series || 0, film_release_year || '', (film_country ? film_country.join(',') : ''), (film_categories ? film_categories.join(',') : ''));
		}
		res.send(a);
	});
app.post('/film', async (req, res) => {
	var q = req.query, p = req.params, b = req.body;
	var user_id = b.user_id, token = b.token, film_name = b.film_name, film_name_en = b.film_name_en, film_director = b.film_director, film_actors = b.film_actors, film_poster = b.film_poster, film_trailer = b.film_trailer, film_content = b.film_content, film_summary = b.film_summary, film_duration = b.film_duration, film_series = b.film_series, film_release_year = b.film_release_year, film_country = b.film_country, film_categories = b.film_categories;
	var a = { error: true, message: 'Thông tin yêu cầu bị thiếu!' };
	if (film_name) {
		a = await f1.checkSession(user_id, token);
		console.log(b);
		if (a.error == false) a = await f1.postFilm(film_name, film_name_en || '', film_director || '', film_actors || '', film_poster || '', film_trailer || '', film_content || '', film_summary || '', film_duration || 0, film_series || 0, film_release_year || '', (film_country ? film_country.join(',') : ''), (film_categories ? film_categories.join(',') : ''));
	}
	res.send(a);
});
app.get('/servers', async (req, res) => {
	res.send(await f1.getServers());
});
app.get('/hls/:sid/:eid.json', async (req, res) => {
	// res.send(req.params);
	var q = req.query, p = req.params, b = req.body;
	var ep_id = p.eid, server_id = p.sid;
	var a = { error: true, message: 'Thông tin yêu cầu bị thiếu!' }, b;
	if (ep_id && server_id) {
		a = await f1.getESV(ep_id, server_id);
		// console.log(Buffer.from("Hello World").toString('base64'));
		// a = await new Promise(resolve => {
		// 	zlib.deflate(JSON.stringify(a), (err, buffer) => {
		// 		if (err) { console.log('u-oh') }
		// 		// Send buffer as string to client using my imaginary io object
		// 		resolve(buffer.toString('base64'));
		// 	});
		// });
		a = fflate.strToU8(JSON.stringify(a));
		a = fflate.strFromU8(fflate.compressSync(a), true);
	}
	res.send(a);
});
app.get('/test', async (req, res) => {
	// var a = await axios.get('https://1drv.ms/f/s!Aobg1nGm2h_xqi4D3pHWzm114Q85');
	// var b = url.parse(a.request.path, true);
	// console.log(b);
	var a = await f1.updateESVOnedrive(1);
	console.log(a);
	res.send({});
});


app.enable('trust proxy');
app.listen(port, () => { console.log('Server started on: ' + port); });
