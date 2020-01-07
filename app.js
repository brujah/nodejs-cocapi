require('dotenv').config();

const IP = require('./modules/ip.js');
const Clash = require('./modules/clash.js');

const clantag = process.env.CLASH_MYCLANTAG;
const clashdeveloper_email_address = process.env.CLASH_DEVELOPER_EMAIL;
const clashdeveloper_password = process.env.CLASH_DEVELOPER_PASSWORD;
let external_ip = "";

doLogin();

async function doLogin(){

	// Get external IP
	external_ip = await IP.getMyIP();

	if (external_ip != "") {

		let token = await Clash.getToken(external_ip, clantag, clashdeveloper_email_address, clashdeveloper_password);

		if(token){
			console.log("We are good to go!");
		}

	} else {
		console.log("Unable to fetch external IP!");
	}

}


