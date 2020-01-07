const axios = require('axios');

const api_baseurl = "https://api.clashofclans.com/v1";
let api_token = "";

exports.getToken = getToken;

async function getToken(ip, clantag, developer_email, developer_password) {

    let token = false;
	
	if(ip == "" || clantag == "" || developer_email == "" || developer_password == ""){
		return false;
	}
    
    try {

        // Make sure tag starts with #
        clantag = fixTag(clantag);

        if (api_token != "") {

            // We have an api_token created, lets try and fetch some data and see if it still available to use
            axios.defaults.headers.common['Authorization'] = "Bearer " + api_token;

            let res = await axios.get(api_baseurl + "/locations");

            if (res.status == 200) {
                console.log("We have a working api_token, no need to create a new one!");
                return true;
            }
        }

        axios.defaults.headers.post['content-type'] = 'application/json';

        let res = await axios.post('https://developer.clashofclans.com/api/login', { email: developer_email, password: developer_password });

        if (res.data.status.message) {

            if (res.data.status.message == "ok") {

                let cookies = res.headers['set-cookie'];
                let session_cookie = "";

                if (cookies) {

                    cookies = cookies.toString().split(';');

                    for (var x = 0; x < cookies.length; x++) {

                        if (cookies[x].includes("session=")) {
                            session_cookie = cookies[x].trim();
                            break;
                        }

                    }

                    axios.defaults.headers.post['cookie'] = session_cookie;

                    res = await axios.post('https://developer.clashofclans.com/api/apikey/list');

                    if (res.data.status.message) {

                        if (res.data.status.message == "ok") {

                            let myip_added = false;
                            let oldkeys = res.data.keys;

                            // Loop through all keys and see if we have one for this IP and clantag
                            for (var x = 0; x < res.data.keys.length; x++) {

                                if (res.data.keys[x].cidrRanges[0] == ip && res.data.keys[x].name == clantag) {
                                    api_token = res.data.keys[x].key;
                                    myip_added = true;
                                    token = true;
                                    console.log("Found existing token for this IP and clantag!");
                                    break;
                                }
                            }
                            
                            // Create a key if needed
                            if(!myip_added){
                                
                                res = await axios.post('https://developer.clashofclans.com/api/apikey/create', { name: clantag, description: ip, cidrRanges: ip });

                                if (res.data.status.message) {

                                    if (res.data.status.message == "ok") {
                                        api_token = res.data.key.key;
                                        token = true;
                                        console.log("Created new token for this IP and clantag!");
                                    }

                                }
                            }
                            

                            // Lets delete any old keys for this clantag (excluding the current IP)
                            for (var x = 0; x < oldkeys.length; x++) {

                                if (oldkeys[x].cidrRanges[0] != ip && oldkeys[x].name == clantag) {

                                    let oldkey_id = oldkeys[x].id;
                                    let oldkey_key = oldkeys[x].cidrRanges[0];

                                    res = await axios.post('https://developer.clashofclans.com/api/apikey/revoke', { id: oldkey_id });
                                    
                                    if (res.data.status.message) {

                                        if (res.data.status.message == "ok") {
                                            console.log("Deleted token for this clantag using an old IP: " + oldkey_key);
                                        }

                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.log("An error occurred!");
        console.log(err);
        api_token = "";
    }

    return token;

}

function fixTag(tag) {

    if (!tag.startsWith("#")) {
        tag = "#" + tag;
    }
    return tag;
}