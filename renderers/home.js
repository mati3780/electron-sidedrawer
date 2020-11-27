const { remote } = require('electron');
const axios = require('axios');
axios.defaults.adapter = require('axios/lib/adapters/http');
const authService = remote.require('./services/auth-service');
const authProcess = remote.require('./main/auth-process');
const fs = require('fs')
const envVariables = require('../env-variables');
const { apiRecord, apiRecordDomain, root, otherSide, mySide } = envVariables;
const userHome = require('user-home');
const chokidar = require('chokidar');
const FormData = require('form-data');
var recordsTypes;
var watcher = null;
var watcherReady = false;

const webContents = remote.getCurrentWebContents();

webContents.on('dom-ready', () => {
  const profile = authService.getProfile();
  document.getElementById('picture').src = profile.picture;
  document.getElementById('name').innerText = profile.name;
  document.getElementById('success').innerText = 'You successfully used Auth0 to authenticate.';

});


document.getElementById("start").addEventListener("click", function (e) {
  const { dialog } = require('electron').remote;
  dialog.showOpenDialog({
    properties: ['openDirectory']
  }).then(path => {
    if (path) {
      StartWatcher(path.filePaths[0]);

    } else {
      console.log("No path selected");
    }
  }).catch(err => {
    console.log(err)
  });

}, false);

document.getElementById("stop").addEventListener("click", function (e) {
  if (!watcher) {
    console.log("You need to start first the watcher");
  } else {
    watcher.close();
    document.getElementById("start").disabled = false;
    watcherReady = false;
    ///document.getElementById("messageLogger").innerHTML = "Nothing is being watched";
  }
}, false);


document.getElementById('logout').onclick = () => {
  authProcess.createLogoutWindow();
  remote.getCurrentWindow().close();
};

document.getElementById('secured-request').onclick = () => {
  getRecordTypes();
  getNetwork();
};

function StartWatcher(path) {
  watcherReady = false;
  watcher = chokidar.watch(path, {
    ignored: /[\/\\]\./,
    persistent: true
  });

  function onWatcherReady() {
    watcherReady = true;
    console.info('From here can you check for real changes, the initial scan has been completed.');

  }

  watcher
    .on('add', function (path) {
      if (watcherReady) {
        console.log('File', path, 'has been added');


        const formData = new FormData();
        formData.append('file', fs.createReadStream(path));
        // axios.post(`${apiRecord}sidedrawer/sidedrawer-id/5fbba941630a0e4fba05c49b/records/record-id/5fbbac96630a0e216605c4a4/record-files?fileName=YYMMDDHHMMSS_Nuevoswagger1&correlationId=123213213&uploadTitle=nuevoPost%20real&fileType=document`, formData, {
        //   // You need to use `getHeaders()` in Node.js because Axios doesn't
        //   // automatically set the multipart form boundary in Node.
        //   // headers: formData.getHeaders()
        //   headers: {
        //     "Authorization": `Bearer ${authService.getAccessToken()}`,
        //     "Content-Type": "multipart/form-data"
        //     //,
        //     // "Access-Control-Allow-Origin": "*"
        //   }
        //   //,
        //   // data: formData
        // }).then((response) => {
        //   console.log(response);
        // }, (error) => {
        //   console.log(error);
        // });

        var url = `${apiRecord}sidedrawer/sidedrawer-id/5fbba941630a0e4fba05c49b/records/record-id/5fbbac96630a0e216605c4a4/record-files?fileName=YYMMDDHHMMSS_Nuwr1&correlationId=45444fsdfsdf&uploadTitle=nuev%20real&fileType=document`;
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
        // var newFile = fs.createReadStream(path);

        // // personally I'd function out the inner body here and just call 
        // // to the function and pass in the newFile
        // newFile.on('end', function () {
        //   const form_data = new FormData();
        //   form_data.append("file", newFile);
        //   const request_config = {
        //     // method: "post",
        //     url: `sidedrawer/sidedrawer-id/5fbba941630a0e4fba05c49b/records/record-id/5fbbac96630a0e216605c4a4/record-files?fileName=YYMMDDHHMMSS_Nuevoswagger1&correlationId=123213213&uploadTitle=nbre%20real&fileType=document`,
        //     headers: {
        //       "Authorization": `Bearer ${authService.getAccessToken()}`,
        //       "Content-Type": "multipart/form-data"
        //     },
        //     data: form_data
        //   };


        // axios.post(request_config)
        //   .then((response) => {
        //     console.log(response);
        //   }, (error) => {
        //     console.log(error);
        //   });
      }
    }


      // 5fbba941630a0e4fba05c49b


      // 5fbbac96630a0e216605c4a4

      // correlationId: "YY113280911346"
      // fileType: "document"
      // uploadTitle

      // C: \Users\mati\SideDrawer Inc\Other SideDrawers\otra comartida clovinn\Identity Documents\clovin record


      // "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlFqQkVRVFl3TmtJeU5URkVNa0ZCUlRFNE5EYzJSRFZFTVRSRU56VXdPVVJFUmpoQk1qSTRPUSJ9.eyJodHRwczovL3NpZGVkcmF3ZXIuY29tL3JvbGVzIjpbXSwiaHR0cHM6Ly9zaWRlZHJhd2VyLmNvbS9nZW9pcCI6eyJjb3VudHJ5X2NvZGUiOiJBUiIsImNvdW50cnlfY29kZTMiOiJBUkciLCJjb3VudHJ5X25hbWUiOiJBcmdlbnRpbmEiLCJjaXR5X25hbWUiOiJMb21hcyBkZSBaYW1vcmEiLCJsYXRpdHVkZSI6LTM0Ljc2NjEsImxvbmdpdHVkZSI6LTU4LjM5NTcsInRpbWVfem9uZSI6IkFtZXJpY2EvQXJnZW50aW5hL0J1ZW5vc19BaXJlcyIsImNvbnRpbmVudF9jb2RlIjoiU0EifSwiaHR0cHM6Ly9zaWRlZHJhd2VyLmNvbS9jbGllbnQiOiJtbHJIZEJvY3h5VVlmSkoyMG1DdEU5MTdKOVZDN3dtciIsImlzcyI6Imh0dHBzOi8vYWNjLXN0Zy5zaWRlZHJhd2VyLmNvbS8iLCJzdWIiOiJhdXRoMHw1ZmE1ZTQ4OWEzYzhmNjAwNjhmYTU5MmIiLCJhdWQiOlsiaHR0cHM6Ly91c2VyLWFwaS1zdGcuc2lkZWRyYXdlci5jb20iLCJodHRwczovL3NpZGVkcmF3ZXItc3RnLmF1dGgwLmNvbS91c2VyaW5mbyJdLCJpYXQiOjE2MDY1MTEwMjgsImV4cCI6MTYwNjU5NzQyOCwiYXpwIjoibWxySGRCb2N4eVVZZkpKMjBtQ3RFOTE3SjlWQzd3bXIiLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIG9mZmxpbmVfYWNjZXNzIiwicGVybWlzc2lvbnMiOltdfQ.F7yG3r_JY_yPV3U_MvZUaG3dWFaM4c3qREpDuOULS9HxihpJovbsBYrR6i9x4OyqPIlaompFKhrO2GlBRz9VVqa1au8RrNHHDHUksEUWjx-mga1F8EDRgCvIAkEMOvhBRKtZMFQHzIGo76r81Uvpru69LgUAaiXLxIYMc20eM0a0MOhUqHllBeGa3O59S86rHzrvqJ5McxciOxSbtFINcvDR1hZNJLWHyh9rDeNbOHkvIvhACYpqQaLI9L4_35_Y8jMzCn-jhLMtiIn_cQRslgNtMgywDY-eDEhJNX6Ckdn1JRQ6IJDAsFESoQDDSS-64x_dKfp-Pn07p0Jx_8d5Pg"

      // https://records-api-dev.sidedrawerdev.com/api/v1/sidedrawer/sidedrawer-id/5fbba941630a0e4fba05c49b/records/record-id/5fbbac96630a0e216605c4a4/record-files?fileName=YYMMDDHHMMSS_Nuevoswagger1&correlationId=123213213&uploadTitle=nombre%20real&fileType=document


    )
    .on('addDir', function (path) {
      if (watcherReady) {
        console.log('Directory', path, 'has been added');
      }


    })
    .on('change', function (path) {
      if (watcherReady) {
        console.log('File', path, 'has been changed');
      }


    })
    .on('unlink', function (path) {
      if (watcherReady) {
        console.log('File', path, 'has been removed');
      }

    })
    .on('unlinkDir', function (path) {

      if (watcherReady) {
        console.log('Directory', path, 'has been removed');
      }

    })
    .on('error', function (error) {
      if (watcherReady) {
        console.log('Error happened', error);
      }

    })
    .on('ready', onWatcherReady)
    .on('raw', function (event, path, details) {
      // This event should be triggered everytime something happens.
      console.log('Raw event info:', event, path, details);
    });
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

      var folderSidedrawer =
        `${folder}\\${s.name}`;
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
    if (error && error.response.status != 404 && error.response.status != 403) throw new Error(error);
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




