
var Datastore = require('nedb');
var recordTable = new Datastore({ filename: 'db/records.db', autoload: true });