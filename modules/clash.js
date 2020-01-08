const axios = require('axios');

const api_baseurl = "https://api.clashofclans.com/v1";

let api = {
    connected: false,
    token: ""
};

exports.getToken = getToken;

async function getToken(ip, clantag, developer_email, developer_password) {

    if(ip == "" || clantag == "" || developer_email == "" || developer_password == ""){
        api.connected = false;
        api.token = "";
        return api;
	}
    
    try {

        // Make sure tag starts with #
        clantag = fixTag(clantag);

        if (api.token != "") {

            // We have an api token created, lets try and fetch some data and see if it still available to use
            axios.defaults.headers.common['Authorization'] = "Bearer " + api.token;

            let location_res = await axios.get(api_baseurl + "/locations");

            if (location_res.status == 200) {
                console.log("We have a working api token, no need to create a new one!");
                api.connected = true;
                return api;
            }
        }

        axios.defaults.headers.post['content-type'] = 'application/json';

        let login_res = await axios.post('https://developer.clashofclans.com/api/login', { email: developer_email, password: developer_password });

        if (login_res.data.status.message) {

            if (login_res.data.status.message == "ok") {

                let cookies = login_res.headers['set-cookie'];
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

                    let list_res = await axios.post('https://developer.clashofclans.com/api/apikey/list');

                    if (list_res.data.status.message) {

                        if (list_res.data.status.message == "ok") {

                            let myip_added = false;
                            let oldkeys = list_res.data.keys;

                            // Loop through all keys and see if we have one for this IP and clantag
                            for (var x = 0; x < oldkeys.length; x++) {

                                if (oldkeys[x].cidrRanges[0] == ip && oldkeys[x].name == clantag) {
                                    api.token = oldkeys[x].key;
                                    api.connected = true;
                                    myip_added = true;
                                    console.log("Found existing token for this IP and clantag!");
                                    break;
                                }
                            }
                            
                            // Create a key if needed
                            if(!myip_added){
                                
                                let create_res = await axios.post('https://developer.clashofclans.com/api/apikey/create', { name: clantag, description: ip, cidrRanges: ip });

                                if (create_res.data.status.message) {

                                    if (create_res.data.status.message == "ok") {
                                        api.token = create_res.data.key.key;
                                        console.log("Created new token for this IP and clantag!");
                                    }

                                }
                            }
                            

                            // Lets delete any old keys for this clantag (excluding the current IP)
                            for (var x = 0; x < oldkeys.length; x++) {

                                if (oldkeys[x].cidrRanges[0] != ip && oldkeys[x].name == clantag) {

                                    let oldkey_id = oldkeys[x].id;
                                    let oldkey_key = oldkeys[x].cidrRanges[0];

                                    let revoke_res = await axios.post('https://developer.clashofclans.com/api/apikey/revoke', { id: oldkey_id });
                                    
                                    if (revoke_res.data.status.message) {

                                        if (revoke_res.data.status.message == "ok") {
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
        console.log(err);
        api.connected = false;
        api.token = "";
    }

    return api;

}

function fixTag(tag) {

    if (!tag.startsWith("#")) {
        tag = "#" + tag;
    }
    return tag;
}