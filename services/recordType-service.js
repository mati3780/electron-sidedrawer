const axios = require('axios');
const envVariables = require('../env-variables');
const authService = require('./auth-service');
const { apiRecord } = envVariables;



function get() {
    return axios.get(`${apiRecord}records-type?order=ASC`, {
        headers: { 'Authorization': `Bearer ${authService.getAccessToken()}`, },
    });
}

module.exports = {
    get
};