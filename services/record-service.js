const axios = require('axios');
const envVariables = require('../env-variables');
const authService = require('./auth-service');
const { apiRecord, apiRecordDomain, root, otherSide, mySide } = envVariables;



function getBySidedrawer(sidedrawerId) {
    return axios.get(`${apiRecord}sidedrawer/sidedrawer-id/${sidedrawerId}/records`, {
        headers: { 'Authorization': `Bearer ${authService.getAccessToken()}`, },
    }).catch((error) => {
        if (error && error.response.status != 404) throw new Error(error);
    });

}

module.exports = {
    getBySidedrawer
};