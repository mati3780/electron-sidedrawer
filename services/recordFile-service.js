const axios = require('axios');
axios.defaults.adapter = require('axios/lib/adapters/http');
const fs = require('fs')
const envVariables = require('../env-variables');
const authService = require('./auth-service');
const { apiRecord, apiRecordDomain, root, otherSide, mySide } = envVariables;



function getByRecord(sidedrawerId, recordId) {

    return axios.get(`${apiRecord}sidedrawer/sidedrawer-id/${sidedrawerId}/records/record-id/${recordId}/record-files`, {
        headers: { 'Authorization': `Bearer ${authService.getAccessToken()}`, },
    }).catch((error) => {
        if (error && error.response.status != 404 && error.response.status != 403) throw new Error(error);
    });
}

function getById(url) {

    return axios.get(`${apiRecordDomain}${url}`, {
        headers: { 'Authorization': `Bearer ${authService.getAccessToken()}`, },
        responseType: 'stream'
    });

}

function post(formData, data) {
    const url = `${apiRecord}sidedrawer/sidedrawer-id/${data.sidedrawerId}/records/record-id/${data.recordId}/record-files?fileName=${data.fileName}&correlationId=${data.correlationId}&uploadTitle=${data.uploadtitle}&fileType=document`;
    const config = {
        headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${authService.getAccessToken()}`
        }
    }

    axios.post(url, formData, config)
        .then(response =>
            console.log(response.data, response.status))
        .catch(err =>
            console.error(err.config, err.response.data));
}


module.exports = {
    getByRecord,
    getById,
    post
};