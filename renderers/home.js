const { remote } = require('electron');
const axios = require('axios');
axios.defaults.adapter = require('axios/lib/adapters/http');
const authService = remote.require('./services/auth-service');
const authProcess = remote.require('./main/auth-process');
const fs = require('fs')
const envVariables = require('../env-variables');
const { apiRecord, apiRecordDomain } = envVariables;
var folder;
var records;
var sidedrawerId;

const webContents = remote.getCurrentWebContents();

webContents.on('dom-ready', () => {
  const profile = authService.getProfile();
  document.getElementById('picture').src = profile.picture;
  document.getElementById('name').innerText = profile.name;
  document.getElementById('success').innerText = 'You successfully used Auth0 to authenticate.';
});

document.getElementById('logout').onclick = () => {
  authProcess.createLogoutWindow();
  remote.getCurrentWindow().close();
};

document.getElementById('secured-request').onclick = () => {

  const userHome = require('user-home');
  folder = userHome + '\\SideDrawer Inc';
  createFolder(folder);
  folder = folder + '\\Own SideDrawers';
  createFolder(folder);
 // getRecordTypes();
  getNetwork();
};

function createFolder(folderName) {
  try {

    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName)
    }

  } catch (err) {
    console.error(err)
  }
};

function getNetwork(){
 
  axios.get(`${apiRecord}network?sidedrawerRole=sd_owner`, {
    headers: {'Authorization': `Bearer ${authService.getAccessToken()}`,},
  }).then((response) => {
    sidedrawerId = response.data[0].sidedrawer.id;
    getSidedrawerRecords();

  }).catch((error) => {
    if (error) throw new Error(error);
  });
  }

function getSidedrawerRecords()
{
  axios.get(`${apiRecord}sidedrawer/sidedrawer-id/${sidedrawerId}/records`, {
    headers: {'Authorization': `Bearer ${authService.getAccessToken()}`, },
  }).then((response) => {

    records = response.data;
    getRecordTypes();
  }).catch((error) => {
    if (error) throw new Error(error);
  });

}



function getRecordTypes() {
  axios.get(`${apiRecord}records-type?order=ASC`, {
     headers: {'Authorization': `Bearer ${authService.getAccessToken()}`,},
  }).then((response) => {

    response.data.forEach((recordType) => {
      var folderRecorType = `${folder}\\${recordType.displayValue[0].value}`;
      createFolder(folderRecorType);
      const recordsAssociated = records.filter(r => r.recordType.id == recordType.id);
      recordsAssociated.forEach((record) => {
        createFolder(`${folderRecorType}\\${record.name}`);
        const path = `${folderRecorType}\\${record.name}`;
        getRecordFiles(path, record.id);
        
      });
      
    });


  }).catch((error) => {
    if (error) throw new Error(error);
  });
}


function getRecordFiles(path,recordId) {



  axios.get(`${apiRecord}sidedrawer/sidedrawer-id/${sidedrawerId}/records/record-id/${recordId}/record-files`, {
    headers: { 'Authorization': `Bearer ${authService.getAccessToken()}`, },
  }).then((response) => {

//https://records-api-dev.sidedrawerdev.com/api/v1/sidedrawer/sidedrawer-id/5fa5e4b70c836ad25cfdcf56/records/record-id/5fac4b16be10c63b5bf6da94/record-files/YY113161711731_pago_03-11.pdf

   // getFile();
    const files = response.data.filter(f => f.files.length > 0);
    files.forEach((file) => {

      const extension = file.files[0].fileUrl.split(/[\s/]+/).pop().split(/[\s.]+/).pop();
      const fileName = `${file.uploadTitle}.${extension}`;
      getFile(path, fileName, file.files[0].fileUrl); 

    });

    // const messageJumbotron = document.getElementById('message');
    // messageJumbotron.innerText = JSON.stringify(response.data);
    // messageJumbotron.style.display = 'block';

  }).catch((error) => {
    if (error) throw new Error(error);
  });
}



function getFile(path, fileName, url) {
//sidedrawer/sidedrawer-id/5fa5e4b70c836ad25cfdcf56/records/record-id/5fac4b16be10c63b5bf6da94/record-files/YY113161711731_pago_03-11.pdf
  axios.get(`${apiRecordDomain}${url}`, {
    headers: { 'Authorization': `Bearer ${authService.getAccessToken()}`, },
    responseType: 'stream'
  }).then((response) => {

    var file = fs.createWriteStream(`${path}\\${fileName}`);
    response.data.pipe(file);
  }).catch((error) => {
    if (error) throw new Error(error);
  });
}




