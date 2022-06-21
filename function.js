const axios = require('axios');
var url = require('url');
const pako = require('pako');
const jwt = require("jsonwebtoken"), jwt_password = 'Pvl@2019';
var moment = require('moment-timezone'); moment().tz("Asia/Ho_Chi_Minh").format();
var time_vaild = 60 * 60 * 24; // thời gian phiên đăng nhập hợp lệ // 1 ngày
String.prototype.replaceArray = function (find, replace) {
	var replaceString = this; for (var i = 0; i < find.length; i++) { replaceString = replaceString.replace(find[i], replace[i]); }
	return replaceString;
}
String.prototype.replaceAllArray = function (find, replace) {
	var replaceString = this; for (var i = 0; i < find.length; i++) { replaceString = replaceString.replace(new RegExp(find[i], 'g'), replace[i]); }
	return replaceString;
}
function khongdau(st) {
	let vietChar = 'á|à|ả|ã|ạ|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ|é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ|ó|ò|ỏ|õ|ọ|ơ|ớ|ờ|ở|ỡ|ợ|ô|ố|ồ|ổ|ỗ|ộ|ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự|í|ì|ỉ|ĩ|ị|ý|ỳ|ỷ|ỹ|ỵ|đ|Á|À|Ả|Ã|Ạ|Ă|Ắ|Ằ|Ẳ|Ẵ|Ặ|Â|Ấ|Ầ|Ẩ|Ẫ|Ậ|É|È|Ẻ|Ẽ|Ẹ|Ê|Ế|Ề|Ể|Ễ|Ệ|Ó|Ò|Ỏ|Õ|Ọ|Ơ|Ớ|Ờ|Ở|Ỡ|Ợ|Ô|Ố|Ồ|Ổ|Ỗ|Ộ|Ú|Ù|Ủ|Ũ|Ụ|Ư|Ứ|Ừ|Ử|Ữ|Ự|Í|Ì|Ỉ|Ĩ|Ị|Ý|Ỳ|Ỷ|Ỹ|Ỵ|Đ';
	let engChar = 'a|a|a|a|a|a|a|a|a|a|a|a|a|a|a|a|a|e|e|e|e|e|e|e|e|e|e|e|o|o|o|o|o|o|o|o|o|o|o|o|o|o|o|o|o|u|u|u|u|u|u|u|u|u|u|u|i|i|i|i|i|y|y|y|y|y|d|A|A|A|A|A|A|A|A|A|A|A|A|A|A|A|A|A|E|E|E|E|E|E|E|E|E|E|E|O|O|O|O|O|O|O|O|O|O|O|O|O|O|O|O|O|U|U|U|U|U|U|U|U|U|U|U|I|I|I|I|I|Y|Y|Y|Y|Y|D';
	let arrVietChar = vietChar.split('|');
	let arrEngChar = engChar.split('|');
	st = st.replaceAllArray(arrVietChar, arrEngChar);
	// st = st.split(":").join("").split("_").join(" ").split("-").join(" ");
	// st = st.split("  ").join(" ");
	// return st.split(" ").join("-").toLowerCase();
	return st.replace(/:/gi, '').replace(/_/gi, ' ').replace(/  /gi, '').replace(/ /gi, '-').toLowerCase();
}
function encode_id(id) {
	return (Number(id) + 123456).toString(16).replaceArray([1, 2, 3, 4, 5], ['i', 't', 'o', 'y', 'w']);
	// return (Number(id) + 123456).toString(16).replace(/1/g, 'i').replace(/2/g, 't').replace(/3/g, 'o').replace(/4/g, 'y').replace(/5/g, 'w');
}
function decode_id(id) {
	return Number(parseInt(id.replaceArray(['w', 'y', 'o', 't', 'i'], [5, 4, 3, 2, 1]), 16)) - 123456;
	// return Number(parseInt(id.replace(/w/gi, 5).replace(/y/gi, 4).replace(/o/gi, 3).replace(/t/gi, 2).replace(/i/gi, 1), 16)) - 123456;
}
function lineCount(text) {
	var nLines = 0;
	for (var i = 0, n = text.length; i < n; ++i) if (text[i] === '\n') ++nLines;
	return nLines;
}

module.exports = function (conn) {
	this.conn = conn;
	this.ping = 'pong';
	this.datetime_current = moment().unix();
	this.replaceArray = function (find, replace) {
		var replaceString = this;
		for (var i = 0; i < find.length; i++) { replaceString = replaceString.replace(find[i], replace[i]); }
		return replaceString;
	}
	this.getProfileById = function (user_id) {
		return new Promise(resolve => { conn.query('SELECT * FROM users WHERE user_id = ?', [user_id], function (err, result) { if (err) resolve({ error: true, message: 'Có lỗi xảy ra!' }); resolve(result); }); });
	}
	this.getProfileByEmail = function (email) {
		return new Promise(resolve => { conn.query('SELECT * FROM users WHERE (username = ? OR email = ?)', [email, email], function (err, result) { if (err) resolve({ error: true, message: 'Có lỗi xảy ra!' }); resolve(result); }); });
	}
	this.signIn = async function (email, password) {
		return new Promise(resolve => {
			conn.query('SELECT * FROM users WHERE (username = ? OR email = ?) AND password = MD5(?)', [email, email, password], function (err, result) {
				if (err) resolve({ error: true, message: 'Có lỗi xảy ra!' });
				if (result.length == 1) {
					var a = result[0]; delete a.password;
					a.error = false;
					a.token = jwt.sign({ user_id: a.user_id, exp: moment().unix() + time_vaild }, jwt_password);
					resolve(a);
				}
				else resolve({ error: true, message: 'Tài khoản đăng nhập không chính xác!' });
			});
		});
	}
	this.signUp = async function (fullname, username, email, password) {
		var r = await this.getProfileByEmail(email);
		return new Promise(resolve => {
			if (r.length > 0) resolve({ error: true, message: 'Tài khoản có username/email này đã tồn tại!' });
			else {
				date_joined = moment().unix();
				conn.query("INSERT INTO `users` (`fullname`, `username`, `email`, `password`, `date_joined`, `permission`) VALUES (?, ?, ?, MD5(?), ?, '')", [fullname, username, email, password, date_joined], function (err, result) {
					if (err) resolve({ error: true, message: 'Có lỗi xảy ra!' });
					var lastId = result.insertId;
					var a = { user_id: lastId, fullname: fullname, username: username, email: email, date_joined: date_joined };
					a.token = jwt.sign({ user_id: lastId, exp: moment().unix() + time_vaild }, jwt_password);
					// console.log(result.insertId);
					resolve(a);
				});
			}
		});
	}
	this.checkSession = async function (uid, token) {
		var res = { error: true, message: '' };
		try {
			var token_ = jwt.verify(token, jwt_password);
			var a = await this.getProfileById(token_.user_id);
			if ((moment().unix() - token_.exp) <= time_vaild && token_.user_id == uid && a.length > 0) { res.error = false; res.message = 'Phiên đăng nhập hợp lệ!'; return res; }
			else { res.message = 'Phiên đăng nhập không hợp lệ!'; return res; }
		} catch (e) { res.message = 'Phiên đăng nhập không hợp lệ!'; return res; }
	}
	this.updateProfile = function (user_id, fullname, avatar, date_of_birth, location) {
		var res = { error: true, message: '' };
		var sql = '';
		if (fullname)
			if (fullname.length > 0) sql += "`fullname` = " + conn.escape(fullname) + ',';
		// else res.message = 'Tên không được rỗng hoặc độ dài không hợp lệ!';
		if (avatar != null && avatar != undefined) sql += "`avatar` = " + conn.escape(avatar) + ',';
		if (date_of_birth != null && date_of_birth != undefined) sql += "`date_of_birth` = " + conn.escape(date_of_birth) + ',';
		if (location != null && location != undefined) sql += "`location` = " + conn.escape(location) + ',';
		sql = sql.slice(0, -1);
		return new Promise(resolve => {
			if (sql)
				conn.query("UPDATE users SET " + sql + " WHERE `user_id` = ?", [user_id], function (err, result) {
					if (err) resolve({ error: true, message: 'Có lỗi xảy ra!' });
					if (result.affectedRows) { res.error = false; res.message = 'Cập nhật thông tin thành công!'; }
					else res.message = 'Có lỗi xảy ra. Không có thông tin nào cập nhật!';
					resolve(res);
				});
			else { res.error = false; res.message = 'Không có thông tin nào cập nhật!'; resolve(res); }
		});
	}
	this.getCountryByIds = function (ids) {
		if (ids != '' && !String(ids).split(',').some(isNaN))
			return new Promise(resolve => { conn.query(`SELECT * FROM country WHERE country_id IN(${ids})`, function (err, result) { if (err) resolve({ error: true, message: 'Có lỗi xảy ra!' }); resolve(result); }); });
		else return [];
	}
	this.getCategoryById = function (category_id) {
		return new Promise(resolve => { conn.query('SELECT * FROM categories WHERE category_id = ?', [category_id], function (err, result) { if (err) resolve({ error: true, message: 'Có lỗi xảy ra!' }); resolve(result); }); });
	}
	this.getCategoryByIds = function (ids) {
		if (ids != '' && !String(ids).split(',').some(isNaN))
			return new Promise(resolve => { conn.query(`SELECT * FROM category WHERE category_id IN(${ids})`, function (err, result) { if (err) resolve({ error: true, message: 'Có lỗi xảy ra!' }); resolve(result); }); });
		else return [];
	}
	this.postCategory = function (user_id, name, icon) {
		return new Promise(resolve => {
			conn.query("INSERT INTO `categories` (`user_id`, `name`, `icon`) VALUES (?, ?, ?)", [user_id, name, icon], function (err, result) {
				if (err) resolve({ error: true, message: 'Có lỗi xảy ra!' });
				var lastId = result.insertId;
				var a = { category_id: lastId, user_id: Number(user_id), name: name, icon: Number(icon) };
				resolve(a);
			});
		});
	}
	this.updateCategory = function (category_id, name, icon) {
		var res = { error: true, message: '' };
		var sql = '';
		if (name != null && name != undefined) sql += "`name` = " + conn.escape(name) + ',';
		if (icon != null && icon != undefined) sql += "`icon` = " + conn.escape(icon) + ',';
		sql = sql.slice(0, -1);
		return new Promise(resolve => {
			if (sql)
				conn.query("UPDATE categories SET " + sql + " WHERE `category_id` = ?", [category_id], function (err, result) {
					if (err) resolve({ error: true, message: 'Có lỗi xảy ra!' });
					if (result.affectedRows) { res.error = false; res.message = 'Cập nhật thông tin thành công!'; }
					else res.message = 'Có lỗi xảy ra. Không có thông tin nào cập nhật!';
					resolve(res);
				});
			else { res.error = false; res.message = 'Không có thông tin nào cập nhật!'; resolve(res); }
		});
	}
	this.getCategories = function () {
		return new Promise(resolve => {
			conn.query("SELECT * FROM `category`", async function (err, result) {
				if (err) resolve({ error: true, message: 'Có lỗi xảy ra!' });
				resolve(result);
			});
		});
	}
	this.getCategoryByNameKd = function (category_name_kd) {
		return new Promise(resolve => {
			conn.query("SELECT * FROM `category` WHERE category_name_kd = ?", [category_name_kd], async function (err, result) {
				if (err) resolve({ error: true, message: 'Có lỗi xảy ra!' });
				resolve(result);
			});
		});
	}
	this.getCountries = function () {
		return new Promise(resolve => {
			conn.query("SELECT * FROM `country`", async function (err, result) {
				if (err) resolve({ error: true, message: 'Có lỗi xảy ra!' });
				resolve(result);
			});
		});
	}
	this.getCountryByNameKd = function (country_name_kd) {
		return new Promise(resolve => {
			conn.query("SELECT * FROM `country` WHERE country_name_kd = ?", [country_name_kd], async function (err, result) {
				if (err) resolve({ error: true, message: 'Có lỗi xảy ra!' });
				resolve(result);
			});
		});
	}
	this.postFilm = function (film_name, film_name_en, film_director, film_actors, film_poster, film_trailer, film_content, film_summary, film_duration, film_series, film_release_year, film_country, film_categories) {
		return new Promise(resolve => {
			conn.query("INSERT INTO `film` (`film_name`, `film_name_en`, `film_director`, `film_actors`, `film_poster`, `film_trailer`, `film_content`, `film_summary`, `film_duration`, `film_series`, `film_release_year`, `film_country`, `film_categories`, `film_rating`, `film_datetime`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
				[film_name, film_name_en, film_director, film_actors, film_poster, film_trailer, film_content, film_summary, film_duration, film_series, film_release_year, film_country, film_categories, '', moment().unix()], function (err, result) {
					if (err) { console.log(err); resolve({ error: true, message: 'Có lỗi xảy ra!' }); }
					resolve({ error: false, film_id: result.insertId });
				});
		});
	}
	this.updateFilm = function (film_id, film_name, film_name_en, film_director, film_actors, film_poster, film_trailer, film_content, film_summary, film_duration, film_series, film_release_year, film_country, film_categories) {
		if (isNaN(film_id)) film_id = decode_id(film_id);
		return new Promise(resolve => {
			conn.query("UPDATE `film` SET `film_name` = ?, `film_name_en` = ?, `film_director` = ?, `film_actors` = ?, `film_poster` = ?, `film_trailer` = ?, `film_content` = ?, `film_summary` = ?, `film_duration` = ?, `film_series` = ?, `film_release_year` = ?, `film_country` = ?, `film_categories` = ? WHERE film_id = ?",
				[film_name, film_name_en, film_director, film_actors, film_poster, film_trailer, film_content, film_summary, film_duration, film_series, film_release_year, film_country, film_categories, film_id], function (err, result) {
					if (err) resolve({ error: true, message: 'Có lỗi xảy ra!' });
					resolve({ error: false, message: 'Cập nhật thành công!' });
				});
		});
	}
	this.getFilm = async function (film_id) {
		var getCountryByIds = this.getCountryByIds, getCategoryByIds = this.getCategoryByIds, getEpFirst = this.getEpFirst;
		if (isNaN(film_id)) film_id = decode_id(film_id);
		return new Promise(resolve => {
			conn.query("SELECT * FROM `film` WHERE film_id = ?", [film_id], async function (err, result) {
				if (err) resolve({ error: true, message: 'Có lỗi xảy ra!' });
				if (result.length > 0) {
					result[0].film_name_kd = khongdau(result[0].film_name);
					var film_id = result[0].film_id;
					result[0].film_id = encode_id(result[0].film_id);
					result[0].film_country_id = result[0].film_country;
					result[0].film_categories_id = result[0].film_categories;
					var film_country = await getCountryByIds(result[0].film_country), film_categories = await getCategoryByIds(result[0].film_categories);
					result[0].film_country = film_country.map(e => e.country_name).join(",");
					result[0].film_categories = film_categories.map(e => e.category_name).join(",");
					var ep_first = await getEpFirst(film_id);
					if (ep_first.length > 0) delete ep_first[0].film_id;
					result[0].film_ep = ep_first;
				}
				resolve(result);
			});
		});
	}
	this.getFilms = async function (country_id = '', category_id = '', search = '', page = 1) {
		var getCategoryByIds = this.getCategoryByIds, q_ = '', country, category;
		if (country_id != '') { country = await this.getCountryByNameKd(country_id); if (country.length > 0) country_id = country[0].country_id; else return []; }
		if (category_id != '') { category = await this.getCategoryByNameKd(category_id); if (category.length > 0) category_id = category[0].category_id; else return []; }
		if (!isNaN(country_id) && country_id != '' && typeof country_id != 'object') q_ = 'WHERE find_in_set(' + parseInt(country_id) + ', film_country)';
		if (!isNaN(category_id) && category_id != '' && typeof category_id != 'object') q_ = 'WHERE find_in_set(' + parseInt(category_id) + ', film_categories)';
		if (search != '') { search = conn.escape('%' + search + '%'); q_ = `WHERE film_name LIKE ${search} OR film_name_en LIKE ${search}`; }

		var DATA_PER_PAGE = 21, limit = DATA_PER_PAGE;
		var total = await new Promise(resolve => { conn.query(`SELECT COUNT(*) AS total_films FROM film ${q_}`, function (err, result) { resolve(result); }); });
		total = total[0].total_films;
		if (page < 1 || page == '' || isNaN(page)) page = 1;
		limit = ((page - 1) * DATA_PER_PAGE) + ',' + DATA_PER_PAGE;
		var end_page = Math.ceil(total / DATA_PER_PAGE), pre_page = page - 1, next_page = page + 1, page_item = [];
		for (var i = 1; i <= end_page; i++) if (Math.abs(page - i) <= 3 || i == 1 || i == end_page)
			page_item = page_item.concat(i);
		// console.log(pre_page, page, next_page, end_page, page_item);
		return new Promise(resolve => {
			conn.query(`SELECT film_id, film_name, film_name_en, film_poster, film_duration, film_release_year, film_categories, film_rating, film_views FROM film ${q_} ORDER BY film_id DESC LIMIT ${limit}`, async function (err, result) {
				if (err) resolve({ error: true, message: 'Có lỗi xảy ra!' });
				if (result.length > 0) {
					if (!isNaN(country_id) && country_id != '' && typeof country_id != 'object') result[0].search_country = country[0].country_name;
					if (!isNaN(category_id) && category_id != '' && typeof category_id != 'object') result[0].search_category = category[0].category_name;
					result[0].paging = page_item;
					for (var i in result) {
						result[i].film_name_kd = khongdau(result[i].film_name);
						result[i].film_id = encode_id(result[i].film_id);
						var film_categories = await getCategoryByIds(result[i].film_categories);
						result[i].film_categories = film_categories.map(e => e.category_name).join(",");
					}
				}
				resolve(result);
			});
		});
	}
	this.postView = async function (film_id) {
		if (isNaN(film_id)) film_id = decode_id(film_id);
		return new Promise(resolve => {
			conn.query("UPDATE `film` SET film_views = film_views + 1 WHERE film_id = ?", [film_id], async function (err, result) {
				if (err) resolve({ error: true, message: 'Có lỗi xảy ra!' });
				conn.query("INSERT INTO `top_views` (`film_id`, `tv_date`) VALUES (?, ?)", [film_id, moment().unix()], function (err, result) { });
				resolve(result);
			});
		});
	}
	this.postEp = async function (film_id, ep_name, ep_url) {
		var res = { error: true, message: '' };
		if (isNaN(film_id)) film_id = decode_id(film_id);
		var film = await this.getFilm(film_id), servers = await this.getServers(), server_id = 0;
		if (servers.length > 0) {
			for (var i in servers) if (ep_url.includes(servers[i].server_identification)) server_id = servers[i].server_id;
			if (film.length > 0 && server_id > 0)
				return new Promise(resolve => {
					conn.query("INSERT INTO `ep` (`film_id`, `ep_name`, `ep_url`, `server_id`) VALUES (?, ?, ?, ?)", [film_id, ep_name, ep_url, server_id], function (err, result) {
						if (err) resolve({ error: true, message: 'Có lỗi xảy ra!' });
						resolve({ ep_id: result.insertId });
					});
				});
			else { res.message = 'ID phim không tồn tại hoặc liên kết chưa được nhận diện!'; return res };
		} else resolve({ error: true, message: 'Có lỗi xảy ra!' });
	}
	this.getEpFirst = function (film_id) {
		return new Promise(resolve => {
			conn.query("SELECT * FROM `ep` LEFT JOIN `server` USING(server_id) WHERE film_id = ? ORDER BY ep_id ASC LIMIT 1", [film_id], function (err, result) {
				if (err) resolve({ error: true, message: 'Có lỗi xảy ra!' });
				if (result.length > 0) result[0].ep_id = encode_id(result[0].ep_id);
				resolve(result);
			});
		});
	}
	this.getEpByFilmId = function (film_id) {
		if (isNaN(film_id)) film_id = decode_id(film_id);
		return new Promise(resolve => {
			conn.query("SELECT * FROM `ep` LEFT JOIN `server` USING(server_id) WHERE film_id = ?", [film_id], function (err, result) {
				if (err) resolve({ error: true, message: 'Có lỗi xảy ra!' });
				if (result.length > 0) {
					// result[0].ep_id = encode_id(result[0].ep_id);
					let group = result.reduce((r, a) => {
						// console.log("a", a);
						// console.log('r', r);
						a.ep_id = encode_id(a.ep_id);
						delete a.film_id;
						r['server_' + a.server_id] = [...r['server_' + a.server_id] || [], a];
						return r;
					}, {});
					// console.log("group", group);
					result = group;
				}
				resolve(result);
			});
		});
	}
	this.getServers = function () {
		return new Promise(resolve => {
			conn.query("SELECT * FROM server", async function (err, result) {
				if (err) resolve({ error: true, message: 'Có lỗi xảy ra!' });
				resolve(result);
			});
		});
	}
	this.getESV = function (ep_id, server_id) {
		if (isNaN(ep_id)) ep_id = decode_id(ep_id);
		var updateESVOnedrive = this.updateESVOnedrive;
		return new Promise(resolve => {
			conn.query("SELECT * FROM `ep_server_vip` WHERE `ep_id` = ? AND `server_id` = ?", [ep_id, server_id], async function (err, result) {
				if (err) resolve({ error: true, message: 'Có lỗi xảy ra!' });
				if (result.length > 0) {
					if (result[0].esv_index_last_update == '' || (moment().unix() - result[0].esv_index_last_update) > 60 * 60 * 24 * 105)
						result[0].esv_index_edit = await updateESVOnedrive(result[0].esv_id);
					// else result = result[0].esv_index_edit;
					var esv_thumbnails = result[0].esv_thumbnails_vtt;
					if (result[0].esv_thumbnails_url != '') esv_thumbnails = esv_thumbnails.replace(/thumbnails.jpg/gi, result[0].esv_thumbnails_url);
					var esv_index_edit = result[0].esv_index_edit;//pako.deflate(result[0].esv_index_edit, { level: 3 });
					result = { esv_thumbnails: esv_thumbnails, esv_subtitle: result[0].esv_subtitle, esv_index: esv_index_edit }
				}
				resolve(result);
			});
		});
	}
	this.updateESVOnedrive = async function (esv_id) {
		return new Promise(resolve => {
			conn.query("SELECT * FROM `ep_server_vip` WHERE esv_id = ?", [esv_id], async function (err, result) {
				if (err) resolve({ error: true, message: 'Có lỗi xảy ra!' });
				if (result.length > 0) {
					var a = await axios.get(result[0].esv_onedrive);
					if (result[0].esv_onedrive) {
						var b = url.parse(a.request.path, true);
						var m3u8 = result[0].esv_index;
						var top = lineCount(m3u8);
						var api = await axios.get(`https://api.onedrive.com/v1.0/drives/${b.query.resid.split('!')[0]}/items/${b.query.resid}/children?orderby=name asc&select=id,name,size,@content.downloadUrl&top=${top}&authkey=${b.query.authkey}`);
						var count = api.data['@odata.count'], namef = 'index';
						var ext_segment = 'png';
						m3u8 = m3u8.replace(/.ts/g, '.' + ext_segment);
						a = api.data.value;
						for (var i = 0; i < count; i++) {
							b = a[i];
							var c = namef + `_${i}.${ext_segment}`;
							if (b.name == c)
								m3u8 = m3u8.replace(c, b['@content.downloadUrl']);
						}
						conn.query("UPDATE `ep_server_vip` SET `esv_index_edit` = ?, esv_index_last_update = ? WHERE esv_id = ?", [m3u8, moment().unix(), esv_id], async function (err, result) { if (err) resolve({ error: true, message: 'Có lỗi xảy ra!' }); });
					}
				}
				resolve(m3u8);
			});
		});
	}
}