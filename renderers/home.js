const { remote } = require('electron');
 const axios = require('axios');
 axios.defaults.adapter = require('axios/lib/adapters/http');
const authService = remote.require('./services/auth-service');
const sidedrawerService = remote.require('./services/sidedrawer-service');
const recordService = remote.require('./services/record-service');
const recordTypeService = remote.require('./services/recordType-service');
const recordFileService = remote.require('./services/recordFile-service');
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


var Datastore = require('nedb');
var recordTable = new Datastore({ filename: 'db/records.db', autoload: true });

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

        const split = path.split("\\");
        const x = split.slice(0, split.length - 1).join("\\");


        recordTable.findOne({ path: x }, function (err, doc) {
          postFile(path, doc);

        });

      }
    }


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



function postFile(path, record) {

  const formData = new FormData();
  formData.append('file', fs.createReadStream(path));

  const split = path.split("\\").slice(-1)[0].split(".");
  const uploadtitle = split.slice(0, split.length - 1).join(".");
  const correlationId = `YY${Math.random()}`;
  const fileName = `${correlationId}${uploadtitle}`

  recordFileService.post(formData, { sidedrawerId: record.sidedrawerId, recordId: record.id, fileName, correlationId, uploadtitle })

}

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
  const network = sidedrawerService.getNetwork();

  network.then((response) => {
    createSidedrawers(true, response.data);
    createSidedrawers(false, response.data);
  });

  }

function getSidedrawerRecords(folder, sidedrawer)
{
  const records = recordService.getBySidedrawer(sidedrawer.id);

  records.then((response) => {
    createRecords(folder, sidedrawer, response.data);
  });
}

function getRecordTypes() {

  const recordTypes = recordTypeService.get();
  recordTypes.then((response) => {
    recordsTypes = response.data;
  });

}


function createRecords(folder, sidedrawer, records) {

  records.forEach((record) => {

    const recordType = recordsTypes.find(r => r.id == record.recordType.id);
    const folderRecorType = `${folder}\\${recordType.displayValue[0].value}`;
    createFolder(folderRecorType);

    const path = `${folderRecorType}\\${record.name}`;
    createFolder(path);
    record.path = path;
    record.sidedrawerId = sidedrawer.id;

    recordTable.update({ id: record.id }, record, { upsert: true }, function (err, result) { });

    if (sidedrawer.sdRole != 'rec_info' && sidedrawer.sdRole != 'sd_info')
      getRecordFiles(path, sidedrawer.id, record.id);
    else
      createReadme(path);
     
  });

  if (sidedrawer.sdRole.substring(0, 3) != 'rec') {
    const recordTypesToCreate = recordsTypes.filter(r => records.filter(rec => rec.recordType.id == r.id).length == 0);
    recordTypesToCreate.forEach((rt) => {
      createFolder(`${folder}\\${rt.displayValue[0].value}`);

    });

  }

}

function createReadme(path) {
  var file = fs.createWriteStream(`${path}\\readme.txt`);
  file.write("You don't have enough permission to view the contents of this Record.");
  file.end();
}

function getRecordFiles(path, sidedrawerId, recordId) {

  const recordFiles = recordFileService.getByRecord(sidedrawerId, recordId)
  recordFiles.then((response) => {

    const filesFilter = response.data.filter(f => f.files.length > 0);
    filesFilter.forEach((file) => {
      file.files.forEach((f) => {
        const extension = f.fileUrl.split(/[\s/]+/).pop().split(/[\s.]+/).pop();
        const fileName = `${file.uploadTitle}${f.caption ? '_' + f.caption : ''}.${extension}`;
        getFile(path, fileName, f.fileUrl);

      });

    });
  });
}



function getFile(path, fileName, url) {

  axios.get(`${apiRecordDomain}${url}`, {
    headers: { 'Authorization': `Bearer ${authService.getAccessToken()}`, },
    responseType: 'stream'
  }).then((response) => {

    var file = fs.createWriteStream(`${path}\\${fileName}`);
    response.data.pipe(file);
  }).catch((error) => {
    if (error) throw new Error(error);
  });
  //recordFileService.getById(url);
  // const file = recordFileService.getById(url);
  // file.then((response) => {
  //   var file = fs.createWriteStream(`${path}\\${fileName}`);
  //   response.data.pipe(file);
  // });
}




