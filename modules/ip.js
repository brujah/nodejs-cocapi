const axios = require('axios');

exports.getMyIP = getMyIP;

async function getMyIP() {

    let urls = new Array();
    let ip;
    
    urls.push('https://myexternalip.com/raw');
    urls.push('https://api.ipify.org');
    urls.push('https://ifconfig.co/ip');

    try {

        for (let x = 0; x < urls.length; x++) {
            
            let res = await axios.get(urls[x]);

            if(res.data){
                ip = res.data;
                break;
            }

        }

    } catch (err){
        console.log(err);
    }

    return ip;
    
}
