const { remote } = require('electron');
const axios = require('axios');
axios.defaults.adapter = require('axios/lib/adapters/http');
const authService = remote.require('./services/auth-service');
const authProcess = remote.require('./main/auth-process');
const fs = require('fs')
const envVariables = require('../env-variables');
const { apiRecord, apiRecordDomain, root, otherSide, mySide } = envVariables;
const userHome = require('user-home');
var recordsTypes;

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
  getRecordTypes();
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

function getPathFolder(my) {
  var folder = `${userHome}\\${root}`;
  createFolder(folder);
  folder = `${folder}\\${my ? mySide : otherSide}`;
  createFolder(folder);
  return folder;
}

function createSidedrawers(my, data) {

  const sideDrawers = data.filter(r => (my && r.sdRole == 'sd_owner') || (!my && r.sdRole != 'sd_owner'));
  if (sideDrawers.length > 0) {
    const folder = getPathFolder(my);
    sideDrawers.forEach((s) => {

      var folderSidedrawer = `${folder}\\${s.name}`;
      createFolder(folderSidedrawer)
      getSidedrawerRecords(folderSidedrawer, s);

    });
  }
}

function getNetwork() {

  // axios.get(`${apiRecord}network`, {
  axios.get(`${apiRecord}sidedrawer/others`, {
    headers: {'Authorization': `Bearer ${authService.getAccessToken()}`,},
  }).then((response) => {

    createSidedrawers(true, response.data);
    createSidedrawers(false, response.data);

  }).catch((error) => {
    if (error) throw new Error(error);
  });
  }

function getSidedrawerRecords(folder, sidedrawer)
{
  axios.get(`${apiRecord}sidedrawer/sidedrawer-id/${sidedrawer.id}/records`, {
    headers: {'Authorization': `Bearer ${authService.getAccessToken()}`, },
  }).then((response) => {

    createRecords(folder, sidedrawer, response.data);
  }).catch((error) => {
    if (error && error.response.status != 404) throw new Error(error);
  });

}



function getRecordTypes() {
  axios.get(`${apiRecord}records-type?order=ASC`, {
    headers: { 'Authorization': `Bearer ${authService.getAccessToken()}`, },
  }).then((response) => {
    recordsTypes = response.data;
  }).catch((error) => {
    if (error) throw new Error(error);
  });
}


function createRecords(folder, sidedrawer, records) {

  records.forEach((record) => {

    const recordType = recordsTypes.find(r => r.id == record.recordType.id);
    const folderRecorType = `${folder}\\${recordType.displayValue[0].value}`;
    createFolder(folderRecorType);

    const path = `${folderRecorType}\\${record.name}`;
    createFolder(path);
    getRecordFiles(path, sidedrawer.id, record.id);

  });

  if (sidedrawer.sdRole.substring(0, 3) != 'rec') {
    const recordTypesToCreate = recordsTypes.filter(r => records.filter(rec => rec.recordType.id == r.id).length == 0);
    recordTypesToCreate.forEach((rt) => {
      createFolder(`${folder}\\${rt.displayValue[0].value}`);

    });

  }

}


function getRecordFiles(path, sidedrawerId, recordId) {


  axios.get(`${apiRecord}sidedrawer/sidedrawer-id/${sidedrawerId}/records/record-id/${recordId}/record-files`, {
    headers: { 'Authorization': `Bearer ${authService.getAccessToken()}`, },
  }).then((response) => {

//https://records-api-dev.sidedrawerdev.com/api/v1/sidedrawer/sidedrawer-id/5fa5e4b70c836ad25cfdcf56/records/record-id/5fac4b16be10c63b5bf6da94/record-files/YY113161711731_pago_03-11.pdf

   // getFile();
    const filesFilter = response.data.filter(f => f.files.length > 0);
    filesFilter.forEach((file) => {
      file.files.forEach((f) => {
        const extension = f.fileUrl.split(/[\s/]+/).pop().split(/[\s.]+/).pop();
        const fileName = `${file.uploadTitle}${f.caption}.${extension}`;
        getFile(path, fileName, f.fileUrl);

      }
      );

    });

    // const messageJumbotron = document.getElementById('message');
    // messageJumbotron.innerText = JSON.stringify(response.data);
    // messageJumbotron.style.display = 'block';

  }).catch((error) => {
    if (error && error.response.status != 404) throw new Error(error);
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




