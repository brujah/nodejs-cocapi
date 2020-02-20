const axios = require('axios');

const api_baseurl = "https://api.clashofclans.com/v1";
const clash_baseurl = "https://developer.clashofclans.com/api";
let developer_token = "";

axios.defaults.headers.post['content-type'] = 'application/json';

async function getToken(ip, developer_email, developer_password) {
    
    try {
        
        if(ip === "" || developer_email === "" || developer_password === ""){
            throw new Error("Invalid input!");
        }

        // Check if we have a valid token set already
        let validtoken = await checkValidToken(developer_token);

        if(validtoken){
            return developer_token;
        }

        // Lets login to the website and get the login cookies
        let cookies = await getDeveloperCookies(developer_email, developer_password);

        if(!cookies) {
            throw new Error("Unable to login to developer website with provided credentials!");
        }

        // Lets get the session cookies
        let session_cookie = getSessionCookie(cookies);

        if(!session_cookie) {
            throw new Error("Unable to get session cookies!");
        }

        // Store the sessios cookie in our post requests
        axios.defaults.headers.post['cookie'] = session_cookie;

        // Lets see if we already have a token for this IP
        let existingToken = await getExistingTokenForMyIP(ip);

        if(existingToken) {
            developer_token = existingToken;
        } else {
            // Create a token for this IP
            developer_token = await createTokenForMyIP(ip);
        }

        // Remove any old tokens
        await removeOldTokens(ip);

    } catch (err) {
        developer_token = "";
        console.error(err);
        
    } finally {
        return developer_token;
    }
    
}

exports.getToken = getToken;

async function getDeveloperCookies(developer_email, developer_password) {

    let cookies = "";
    let res = await axios.post(clash_baseurl + '/login654654654', { email: developer_email, password: developer_password });

    if (res.data.status.message) {

        if (res.data.status.message == "ok") {
            cookies = res.headers['set-cookie'];
        }

    }

    return cookies;

}

async function checkValidToken(token){

    let valid = false;

    if (token != "") {

        // We have an api token created, lets try and fetch some data and see if it still available to use
        axios.defaults.headers.common['Authorization'] = "Bearer " + api.token;

        let res = await axios.get(api_baseurl + "/locations");

        if (res.status == 200) {
            console.log("We have a working api token, no need to create a new one!");
            valid = true;
        }
    }

    return valid;

}

function getSessionCookie(cookies) {

    let session_cookie = "";

    cookies = cookies.toString().split(';');

    for (var x = 0; x < cookies.length; x++) {

        if (cookies[x].includes("session=")) {
            session_cookie = cookies[x].trim();
            break;
        }

    }

    return session_cookie;

}

async function getExistingTokens() {

    let existingTokens = "";
    let res = await axios.post(clash_baseurl + '/apikey/list');
    
    if (res.data.status.message) {

        if (res.data.status.message == "ok") {
            existingTokens = res.data.keys;
        }
    }

    return existingTokens;

}

async function getExistingTokenForMyIP(ip) {

    let existingToken = "";
    let existingTokens = await getExistingTokens();

    if(existingTokens) {

        // Loop through all keys and see if we have one for this IP
        for (var x = 0; x < existingTokens.length; x++) {

            if (existingTokens[x].cidrRanges[0] == ip) {
                existingToken = existingTokens[x].key;
                console.log("Found existing token for this IP!");
                break;
            }
        }

    }
    
    return existingToken;

}

async function createTokenForMyIP(ip) {

    let res = await axios.post(clash_baseurl + '/apikey/create', { name: ip, description: ip, cidrRanges: ip });
    let newToken = "";

    if (res.data.status.message) {

        if (res.data.status.message == "ok") {

            console.log("Created new token for this IP!");
            newToken = res.data.key.key;
            
        }

    }

    return newToken;

}

async function removeOldTokens(ip) {

    // Lets get all tokens
    let existingTokens = await getExistingTokens();

    if(existingTokens) {

        // Loop through all keys and see if we have one for this IP
        for (var x = 0; x < existingTokens.length; x++) {

            if (existingTokens[x].cidrRanges[0] != ip) {

                let oldkey_id = existingTokens[x].id;
                let oldkey_ip = existingTokens[x].cidrRanges[0];

                let res = await axios.post(clash_baseurl + '/apikey/revoke', { id: oldkey_id });
                
                if (res.data.status.message) {

                    if (res.data.status.message == "ok") {
                        console.log("Deleted token for IP: " + oldkey_ip);
                    }
                }
            }

        }
    }
}