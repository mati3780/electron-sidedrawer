const axios = require('axios');
const envVariables = require('../env-variables');
const authService = require('./auth-service');
const { apiRecord, apiRecordDomain, root, otherSide, mySide } = envVariables;

function getNetwork() {
    return axios.get(`${apiRecord}sidedrawer/others`, {
        headers: { 'Authorization': `Bearer ${authService.getAccessToken()}`, },
    });
}

module.exports = {
    getNetwork

};