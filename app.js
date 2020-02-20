require('dotenv').config();

const IP = require('./modules/ip.js');
const Clash = require('./modules/clash.js');

const clashdeveloper_email_address = process.env.CLASH_DEVELOPER_EMAIL;
const clashdeveloper_password = process.env.CLASH_DEVELOPER_PASSWORD;

(async () => {

	try {
		
		// Get external IP
		let external_ip = await IP.getMyIP();

		// Get developer token
		let token = await Clash.getToken(external_ip, clashdeveloper_email_address, clashdeveloper_password);
		
		console.log("Developer token: " + token);
		
	} catch (err) {
		console.error(err);
	}
	
	//setTimeout(getDeveloperToken, 5000);

})()