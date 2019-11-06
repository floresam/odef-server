var express = require('express');
var router = express.Router();
var Cloudant = require('@cloudant/cloudant');

var cfenv = require("cfenv");
var appenv = cfenv.getAppEnv();
var services = appenv.getServices();
var cloudant_creds = appenv.getServiceCreds(/cloudantNoSQLDB/);
var cloudant = {};
if(appenv.isLocal == false) {
  console.log("Using VCAP configuration");
  cloudant = Cloudant({account:cloudant_creds.username, password: cloudant_creds.password});
} else {
  console.log("Using static configuration");
  cloudant = Cloudant({account:process.env.CLOUDANT_ACCOUNT, password: process.env.CLOUDANT_PASSWORD});
}

var dbList = [];

cloudant.db.list(function(err, allDbs) {
  dbList = allDbs;
});

//var odef = cloudant.db.use('o-def');
var odef = cloudant.db.use(process.env.CLOUDANT_DB);
var itemList = [];
/*
odef.view('o-def','en', { 'include_docs': true }, function(err, body) {
  if(!err) {
    body.rows.forEach(function(row) {
      row.doc.id = row.doc._id;
      delete row.doc._id;
      delete row.doc._rev;
      itemList.push(row.doc);
    });
  }
});
*/
odef.find({selector: { $or: [{ type: 'object' }, { type: 'property'} ]}}, function(err, body) {
  if(err) { 
    throw err; 
  } 
  console.log("Buildling list");
  body.docs.forEach(function(doc) {
    doc.id = doc.odef_id;
    delete doc._id;
    delete doc._rev;
    itemList.push(doc);
  });
  itemList.sort(function(a,b) {
    var aId = parseFloat(a.id);
    var bId = parseFloat(b.id);
    return(aId > bId) ? 1: ((bId > aId) ? -1: 0);
  });
});

/* GET odef listing. */
router.get('/', function(req, res, next) {
  res.send(itemList);
});

/* GET odef listing by type and id. */
router.get('/search', function(req, res, next) {
  console.log(JSON.stringify(req.query.term));
  var q = req.query.term.toLowerCase();
  res.send(itemList.filter(item => (item.name.toLowerCase() === q) || (item.description.toLowerCase().indexOf(q) > -1)));
});
/* GET odef listing by type and id. */
router.get('/:type/:odefId', function(req, res, next) {
  console.log(req.params.type, " ", req.params.odefId);
  console.log(itemList.filter(item => (parseFloat(item.id) === parseFloat(req.params.odefId)) && (item.type === req.params.type)));
  res.send(itemList.filter(item => (parseFloat(item.id) === parseFloat(req.params.odefId)) && (item.type === req.params.type))[0]);
});
/* GET odef listing by id. */
router.get('/:odefId', function(req, res, next) {
  var item = itemList.filter(item => item.id === req.params.odefId)[0];
  console.log(JSON.stringify(item));
  res.send(item);
});
module.exports = router;
