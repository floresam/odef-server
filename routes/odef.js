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
  console.log("Building list");
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

/* GET Translate odef id to/from name. */
router.get('/translate/:translateTarget', function(req, res, next) {
  var target = req.params.translateTarget.toString();
  var tmp = target.split('_');
  var property = "_"+tmp[1];
  var object = tmp[0];
  tmp = object.split('~');
  object = tmp[0];
  var role = '~'+tmp[1];
  var objectItem = itemList.filter(item => (item.id.toString() === object) && (item.type === "object"))[0];
  var roleItem = itemList.filter(item => (item.id.toString() === role) && (item.type === "role"))[0];
  var propertyItem = itemList.filter(item => (item.id.toString() === property) && (item.type === "property"))[0];
  var result = "";
  result += (objectItem)?objectItem.name:"";
  result += (roleItem)?"~"+roleItem.name:"";
  result += (propertyItem)?"_"+propertyItem.name:"";
  res.send(result);
});
/* GET Translate odef id to/from name. */
router.get('/translateTo/:translateTarget', function(req, res, next) {
  var target = req.params.translateTarget.toString().toLowerCase();
  var tmp = target.split('_');
  var property = tmp[1];
  console.log(property);
  var object = tmp[0];
  tmp = object.split('~');
  object = tmp[0];
  var role = tmp[1];
  var objectItem = itemList.filter(item => (item.name.toString().toLowerCase() === object) && (item.type === "object"))[0];
  var roleItem = itemList.filter(item => (item.name.toString().toLowerCase() === role) && (item.type === "role"))[0];
  var propertyItem = itemList.filter(item => (item.name.toString().toLowerCase() === property) && (item.type === "property"))[0];
  var result = "";
  result += (objectItem)?objectItem.id:"";
  console.log(JSON.stringify(objectItem))
  result += (roleItem)?roleItem.id:"";
  console.log(JSON.stringify(roleItem))
  result += (propertyItem)?propertyItem.id:"";
  console.log(JSON.stringify(propertyItem))
  res.send(result);
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
  //console.log(itemList.filter(item => (parseFloat(item.id) === parseFloat(req.params.odefId)) && (item.type === req.params.type)));
  //res.send(itemList.filter(item => (parseFloat(item.id) === parseFloat(req.params.odefId)) && (item.type === req.params.type))[0]);
  console.log(itemList.filter(item => (item.id.toString() === req.params.odefId.toString()) && (item.type === req.params.type)));
  res.send(itemList.filter(item => (item.id.toString() === req.params.odefId.toString()) && (item.type === req.params.type))[0]);
});
/* GET odef listing by id. */
router.get('/:odefId', function(req, res, next) {
  var item = itemList.filter(item => item.id.toString() === req.params.odefId.toString())[0];
  console.log(JSON.stringify(item));
  res.send(item);
});
module.exports = router;
