require('dotenv').config();

const IP = require('./modules/ip.js');
const Clash = require('./modules/clash.js');

const clantag = process.env.CLASH_MYCLANTAG;
const clashdeveloper_email_address = process.env.CLASH_DEVELOPER_EMAIL;
const clashdeveloper_password = process.env.CLASH_DEVELOPER_PASSWORD;

doLogin();

async function doLogin(){

	// Get external IP
	let external_ip = await IP.getMyIP();

	if (external_ip != "") {

		let api = await Clash.getToken(external_ip, clantag, clashdeveloper_email_address, clashdeveloper_password);

		console.log("Able to query API: " + api.connected);
		console.log("Token: " + api.token);
		
	} else {
		console.log("Unable to fetch external IP!");
	}

	setTimeout(doLogin, 5000);

}


