var express = require('express');
var app = express();
var path=require('path');
var expressSession = require('express-session');
var fs=require('fs');
var mongoUrl = 'mongodb://localhost:27017/fee_management_system';
var MongoStore = require('connect-mongo')(expressSession);
var mongo = require('./mongo');
var port = 1337; 
var bodyParser=require('body-parser');
var spawn=require('child_process').spawn;
var cookieParser=require('cookie-parser');
var router=require('router');
var compiler=require('compilex');


app.use(bodyParser());
app.use(cookieParser());
app.use(router());
app.use(express.static(__dirname+'/bootstrap'));
app.use(express.static(__dirname+'/custom'));
compiler.init({stats:true});
app.set('view engine', 'pug');
app.set('views', './views');

function requireUser(req, res, next){
  if (!req.session.regno) {
    res.redirect('/user_unauthorized');
  } else {
    next();
  }
}

// This middleware checks if the user is logged in and sets
// req.user if so.
function checkIfLoggedIn(req, res, next){
  if (req.session.regno) {
    var coll = mongo.collection('student');
    coll.findOne({regno : req.session.regno}, function(err, student){
      if (student) {
        // set a 'user' property on req
        // so that the 'requireUser' middleware can check if the user is
        // logged in
        req.student = student;
        
      }
      
      next();
    });
  } else {
    next();
  }
}

app.use( expressSession({
  secret: 'somesecretrandomstring',
  store: new MongoStore({
    url: mongoUrl
  })
}));


function authenticateUser(regno, password, callback){
  var coll = mongo.collection('student');
  
  coll.find({regno: regno, password:password}).toArray(function(err, student){
    callback(err, student);
  }); 
} 


function authenticateAdmin(username, password, callback){
  var coll = mongo.collection('administrator');
  
  coll.find({username : username, password:password}).toArray(function(err, admin){
    callback(err, admin);
  }); 
}
// We must use this middleware _after_ the expressSession middleware,
// because checkIfLoggedIn checks the `req.session.username` value,
// which will not be available until after the session middleware runs.
app.use(checkIfLoggedIn);

app.get('/', function(req, res){
  if(req.session.regno)
  {
    res.redirect('/dashboard');
  }
  else
   {
    res.redirect('/login');
   } 
});

app.get('/login', function(req, res){
  if(req.session.regno)
  {
      res.sendFile('session_active.html',{root: path.join(__dirname,'./')});  
  }
  else res.sendFile('login.html',{root: path.join(__dirname,'./')});
});

app.get('/administrator', function(req, res){
  if(req.session.regno)
  {
      res.sendFile('session_active.html',{root: path.join(__dirname,'./')});  
  }
  else res.sendFile('administrator.html',{root: path.join(__dirname,'./')});
});



app.get('/invalid_credentials', function(req, res){

  res.sendFile('invalid_credentials.html',{root: path.join(__dirname,'./')});
});


app.get('/user_unauthorized', function(req, res){
  res.sendFile('user_unauthorized.html',{root: path.join(__dirname,'./')});
});



app.get('/dashboard', requireUser, function(req, res){
  var coll = mongo.collection('payments');
  coll.find({regno : req.session.regno}).toArray(function(err,list1){
    if(err) console.log(err);

    else
    {
      var coll2 = mongo.collection('dues');
      coll2.find({regno : req.session.regno}).toArray(function(err,list2){

        if(err) console.log(err);

        else
        {

          res.render('dashboard', {studentname: req.session.name, list1 : list1, list2 : list2});

        }

      });
      

    }
  });

  
});


app.get('/admindashboard', requireUser, function(req, res){
    var coll = mongo.collection('applied');

    var coll1 = mongo.collection('dues');

    coll.find().toArray(function(err,list){
       if(err)
       {
        console.log(err);
       }

       else
       {
            coll1.find({sem : 'I'}).toArray(function(err,listI){

              coll1.find({sem : 'II'}).toArray(function(err,listII){

                coll1.find({sem : 'III'}).toArray(function(err,listIII){

                  coll1.find({sem : 'IV'}).toArray(function(err,listIV){

                    coll1.find({sem : 'V'}).toArray(function(err,listV){

                      coll1.find({sem : 'VI'}).toArray(function(err,listVI){

                        coll1.find({sem : 'VII'}).toArray(function(err,listVII){

                          coll1.find({sem : 'VIII'}).toArray(function(err,listVIII){

                            coll1.find({payfor : 'Semester Fees'}).toArray(function(err,listsemfees){

                              coll1.find({payfor : 'Mess Fees'}).toArray(function(err,listmessfees){

                 res.render('admindashboard', {adminname: req.session.name, list : list[0], listI : listI, listII : listII, listIII : listIII, listIV : listIV, listV : listV, listVI : listVI, listVII : listVII, listVIII : listVIII, listsemfees : listsemfees, listmessfees : listmessfees});

              });

                

              });

                

              });

                

              });

                

              });

                

              });

                

              });

                

              });



              });

            });

           
       }

    });

    

  
});


app.get('/register', function(req,res){

  if(req.session.regno)
  {
    console.log(req.session.regno);
     res.sendFile('session_active.html',{root: path.join(__dirname,'./')}); 
  }
  else res.sendFile('register.html',{root: path.join(__dirname,'./')});
});


app.get('/username_exist', function(req,res){
  res.sendFile('username_exist.html',{root: path.join(__dirname,'./')});
});


app.get('/registration_successful', function(req,res){
  res.sendFile('registration_successful.html',{root: path.join(__dirname,'./')});
});

// This creates a new user and calls the callback with
// two arguments: err, if there was an error, and the created user
// if a new user was created.
//
// Possible errors: the passwords are not the same, and a user
// with that username already exists.
function createUser(name, regno, email, password, callback){
  var coll = mongo.collection('student');
  var coll1 = mongo.collection('applied');
  
  
    var query      = {regno:regno};
    var studentObject = {name : name, regno: regno, email : email, password: password};
    
    // make sure this username does not exist already
    coll.findOne(query, function(err, student){
      if (student) {
            err = 'The username you entered already exists';
            callback(err);
      } else {
        // create the new user

          coll1.findOne(query,function(err,student){

          if(student)
          {

            err = 'The username you entered already exists';
            callback(err);
            
          }

          else
          {


          coll1.insert(studentObject, function(err,user){
          callback(err,user);

          });
          }
          });

        }

      });
}

app.get('/ranklist',requireUser,function(req,res){
   var coll=mongo.collection('ranklist');
   coll.find().sort({score:-1}).toArray(function(err, user){
    //console.log(user);
    if(err) res.sendFile('/page_not_found.html',{root: path.join(__dirname,'./')});
    else
    res.render('ranklist',{ list : user , username : req.session.username});
  }); 
});


app.post('/register', function(req, res){
  var regno = (req.body.regno).toUpperCase();
  var name=req.body.name;
  var password = req.body.password;
  var email=req.body.email;


  
  createUser(name, regno, email, password, function(err, user){
    if (err) {
      res.redirect('/username_exist');
    } else {
      
      res.redirect('/registration_successful');  
    }
  });
});

app.post('/logout', function(req,res){
   delete req.session.regno;
   res.redirect('/login');
});


app.post('/login', function(req, res){
  var regno = req.body.regno.toUpperCase();
  var password = req.body.password;
  console.log(regno);
  console.log(password);
  authenticateUser(regno, password, function(err, student){
    if (student.length) {
      // This way subsequent requests will know the user is logged in.
      req.session.regno = student[0].regno;
      req.session.name = student[0].name;
      console.log(req.session.name); 
      res.redirect('/dashboard');
    } else {
      res.redirect('/invalid_credentials');
    }
  });
});


app.post('/administrator', function(req, res){
  var username = req.body.username;
  var password = req.body.password;
  console.log(username);
  console.log(password);
  authenticateAdmin(username, password, function(err, admin){
    if (admin.length) {
      // This way subsequent requests will know the user is logged in.
      req.session.regno = admin[0].username;
      req.session.name = admin[0].name;
      console.log(req.session.name); 
      res.redirect('/admindashboard');
    } else {
      res.redirect('/invalid_credentials');
    }
  });
});



app.post('/addsemesterdues', function(req,res){
   var semester = req.body.semesterdues;

   var coll1=mongo.collection('student');
   var coll2=mongo.collection('dues');

   coll1.find().forEach(function (myDoc){

    coll2.insert({regno : myDoc.regno , sem : semester , payfor : 'Semester Fees'});
  coll2.insert({regno : myDoc.regno , sem : semester , payfor : 'Mess Fees'});
 
   });

   res.redirect('/admindashboard');
});

app.post('/dashboard', function(req, res){
  var regno = req.session.regno;
  var sem = req.body.semester;
  var payfor = req.body.payfor;
  var status = 'success';
  var message = '';

  var coll = mongo.collection('payments');
  var coll2=mongo.collection('dues');

  var payment = {regno : regno, sem : sem, payfor : payfor, status: status};
  
  coll2.findOne({regno : regno, sem : sem, payfor : payfor}, function(err,result){

    if(result)
    {
      coll.insert(payment);
      coll2.remove({regno : regno, sem : sem, payfor : payfor});
      console.log('inserted');

      message='Payment successful'
      res.render('paymentstatus', {studentname : req.session.name, message : 'Payment successful.'});
    }

    else
    {

      console.log('not inserted');

      message = 'You are not suppposed to make this payment';
      res.render('paymentstatus', {studentname : req.session.name, message : 'You are not suppposed to make this payment.'});
    }

  });
});


app.post('/addstudent',function(req,res){

   var name = req.body.name;
   var regno = req.body.regno;
   var email = req.body.email;
   var password = req.body.password;

   var coll=mongo.collection('student');
   coll.findOne({name : name, regno : regno , email : email, password : password}, function(err,resp){


    if(resp && resp.length>0)
    {


    }

    else
    {

      coll.insert({name : name, regno : regno , email : email, password : password});

    }

    

   });
   


   var coll1=mongo.collection('applied');

   coll1.remove({name : name, regno : regno , email : email, password : password});

   res.redirect('/admindashboard');

});


app.post('/removestudent',function(req,res){

   var regno = req.body.regno;

   var coll1=mongo.collection('applied');
   console.log(regno);

   coll1.remove({regno : regno});

   res.redirect('/admindashboard');

});

mongo.connect(mongoUrl, function(){
  console.log('Connected to mongo at: ' + mongoUrl);
  app.listen(port, function(){
    console.log('Server is listening on port: '+port);
  });  
});
