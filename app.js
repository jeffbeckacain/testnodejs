var app = require("express")();
var session = require('express-session');
var mysql = require("mysql");
var fs = require("fs");
var bodyParser = require('body-parser');
var http = require('http').Server(app);
//var io = require("socket.io").listen(http, {log:true,resource:'/socket.io/'});
var io = require("socket.io")(http);

//initialize the session
app.use(session({
    secret: "chat",
    resave: false,
    saveUninitialized: false
}));
var session;

app.use(require("express").static('data'));

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

/* Creating MySQL connection.*/
var con    =    mysql.createConnection({
      //connectionLimit   :   100,
      host              :   '52.32.172.158',
      user              :   'root',
      password          :   'CD271815',
      database          :   'chat',
	  debug: false
});

//Making the connection 
con.connect();

/*  This is auto initiated event when Client connects to Your Machien.  */
io.on('connection',function(socket){  
    socket.on('get msg',function(data){
      sendMsg(data,function(result){
        io.emit('set msg',JSON.stringify(result));
      });
    });
});
app.get("/",function(req,res){
    res.sendFile(__dirname + '/index.html');
});
app.get("/home.html",function(req,res){
   res.sendFile(__dirname + '/home.html');
});	
/*--------------------------------------------------------- Login And Registration starts--------------------------------------------------*/
/*----------------- Ajax calls starts ------------------------*/
app.post('/check_session', function (req, res) {
  var obj={
    redirect:"",
    reason:""
  }
  if(session.password){  
    obj.redirect="valid";
    obj.reason=""; 
    res.write(JSON.stringify(obj));
    res.end();
  }else{
    obj.redirect="invalid";
    obj.reason="session destroyed"; 
    res.write(JSON.stringify(obj));
    res.end();
  }
});
app.get('/logout', function (req, res) {
  req.session.destroy();
  session.password="";
  res.redirect('/');
});

app.post('/login', function (req, res) {
  session=req.session;
  data = {
    name:req.body.name,
    password:req.body.password,
  };
  session.password=data.password;
  var obj={data:""};
  var query="select * from user where name='"+data.name+"' and password='"+data.password+"'";
  con.query(String(query),function(err,rows){
    if(rows.length > 0){
      obj.data="valid";
      var un=new Buffer(String(rows[0].name)).toString('base64');
      var ui=new Buffer(String(rows[0].id)).toString('base64');
      obj.path_name="/home.html#?un="+un+"&ui="+ui;
      res.write(JSON.stringify(obj));
    }else{
      obj.data="invalid";
      res.write(JSON.stringify(obj));
    }
    res.end();
  });
});
app.post('/check_name', function (req, res) {
  var query="select * from user where name='"+req.body.name+"'";
  var obj={data:""};
  con.query(String(query),function(err,rows){
    if(rows.length > 0){
      obj.data="Unavailable";
      res.write(JSON.stringify(obj));
    }else{
      obj.data="available";
      res.write(JSON.stringify(obj));
    }
    res.end();
  });
});

app.post('/register', function (req, res) {
  session=req.session;
  data = {
    id:'',
    name:req.body.name,
    password:req.body.password,
    p_photo:'img/uploads/avatar1.png',
    timestamp:Math.floor(new Date() / 1000)
  };
  session.password=data.password;
  con.query('INSERT INTO user SET ?', data,function(err,rows){});  
  var get_data="select * from user where name='"+data.name+"' and password='"+data.password+"'";
  con.query(String(get_data),function(err,rows){
    var obj={data:""};
    if(rows.length > 0){
      obj.data="valid";
      var un=new Buffer(String(rows[0].name)).toString('base64');
      var ui=new Buffer(String(rows[0].id)).toString('base64');
      obj.path_name="/home.html#?un="+un+"&ui="+ui;
      res.write(JSON.stringify(obj));
    }else{
      obj.data="invalid";
      res.write(JSON.stringify(obj));
    }
    res.end();
  });
});





/*--------------------------------------------------------- Login And Registration starts--------------------------------------------------*/

/*----------------------------------------------------------- Home page starts--------------------------------------------------------*/
app.post('/getList', function (req, res) {
  data = {
    id:req.body.id,
    name:req.body.name,
  };
  if(!session.password){
    res.redirect('/login');
  }
  var name=new Buffer(String(data.name), 'base64').toString('ascii');
  var id=new Buffer(String(data.id), 'base64').toString('ascii');
  var filter="";
  var query="select * from conversation where to_id='"+id+"' or from_id='"+id+"'";
  con.query(String(query),function(err,rows){
    var count=rows.length;
    var j=1;
    console.log(count);
    if(count==0){
        var check_id="select * from user where 1";
        console.log(check_id);
        con.query(String(check_id),function(err,results){
          res.write(JSON.stringify(results));
          res.end();
        });
      }else{
        for(var i=0;i<count;i++){
          if(count==0){
            filter=1;
          }else{
            if(j==count){
              filter += " id!='"+rows[i]['to_id']+"' and id!='"+rows[i]['from_id']+"'";
            }else{
              filter += " id!='"+rows[i]['to_id']+"' and id!='"+rows[i]['from_id']+"' and";
            } 
          }
          if(j==count){
            var check_id="select * from user where "+filter;
            con.query(String(check_id),function(err,results){
              res.write(JSON.stringify(results));
              res.end();
            });
          }        
          j++;
        }
      }
  });
});

var sendMsg = function (data,callback_result) {
  var timestamp=Math.floor(new Date() / 1000);
  var from_id=new Buffer(String(data.from_id), 'base64').toString('ascii');
  //saving the msg and creating the conversation ID
  var query="select * from conversation where to_id='"+data.to_id+"' and from_id='"+from_id+"' or to_id='"+from_id+"' and from_id='"+data.to_id+"'";
  con.query(String(query),function(err,rows){
    if(rows.length > 0){
        if(data.msg!=""){
          var add_conversation="insert into conversation values('','"+from_id+"','"+data.to_id+"','"+rows[0].con_id+"','"+timestamp+"')";
          con.query(String(add_conversation),function(err,rows){});
          var add_msg="insert into conversation_reply values('','"+data.msg+"','"+from_id+"','"+data.to_id+"','"+rows[0].con_id+"','"+timestamp+"')";
          con.query(String(add_msg),function(err,rows){
            // Getting the List of Msg's
            get_all_msg(data.to_id,from_id,function(results){
              //res.write(JSON.stringify(results));
              //res.end();
              callback_result(results);
  
            });  
          });
        }else{
          get_all_msg(data.to_id,from_id,function(results){
            callback_result(results);
          }); 
        }
        
    }else{
      if(data.msg!=""){
        var conversation_id="select con_id from conversation order by con_id DESC limit 1 ";
        con.query(String(conversation_id),function(err,rows){
            var con_id="";
            if(rows.length < 1){
              con_id=0;
            }else{
              var con_id=Number(rows[0].con_id);
              con_id++;
            }          
            var add_conversation="insert into conversation values('','"+from_id+"','"+data.to_id+"','"+con_id+"','"+timestamp+"')";
            con.query(String(add_conversation),function(err,rows){});
            var add_msg="insert into conversation_reply values('','"+data.msg+"','"+from_id+"','"+data.to_id+"','"+con_id+"','"+timestamp+"')";
            con.query(String(add_msg),function(err,rows){
            // Getting the List of Msg's
            get_all_msg(data.to_id,from_id,function(results){
              //res.write(JSON.stringify(results));
              //res.end();
              callback_result(results);
            });              
          });
        });
      }else{
        // Getting the List of Msg's
        get_all_msg(data.to_id,from_id,function(results){
          callback_result(results);
        });
      }            
    }   
  });
}
var get_all_msg = function (to_id,from_id,callback) {
  var get_msg="select * from conversation_reply where from_id='"+from_id+"' and to_id='"+to_id+"' or  from_id='"+to_id+"' and to_id='"+from_id+"' order by timestamp asc";
  con.query(String(get_msg),function(err,rows){
    callback(rows);
  });
}


app.post('/get_chat_list', function (req, res) {
  data = {
    id:req.body.id,
    name:req.body.name,
  };
  var name=new Buffer(String(data.name), 'base64').toString('ascii');
  var id=new Buffer(String(data.id), 'base64').toString('ascii');
  
  get_user_info(res,id,function(results){
    var obj=[];
    var b=0;
    for(var a=0;a<results.length;a++){
     if(isEmptyObject(results[a])){
      }else{
        obj[b]=results[a];
        b++;
      }
    }
    res.write(JSON.stringify(obj),function(){
      res.end();
    });
  });
});


var get_user_info = function (res,id,callback) {
  var obj=[];
  var callback_obj;
  //getting nummber of chats
  var query="select DISTINCT con_id from conversation where to_id='"+id+"' or from_id='"+id+"' order by timestamp desc ";
  con.query(String(query),function(err,rows){
    //getting user information
    if(rows.length==0){
      callback(obj);
    }else{
      var j=1;
      for(var i=0;i<rows.length;i++){
        var user_info="select *  from conversation where con_id='"+rows[i].con_id+"' and to_id='"+id+"' or con_id='"+rows[i].con_id+"' and  from_id='"+id+"' limit  1";
        callback_obj={
          query:user_info,
          i:i,
          j:j
        };
        get_actual_info(callback_obj,id,function(results){
          obj[results.return_i]=results.result;
          if(results.return_j==rows.length){
            callback(obj);
          }
        });
        j++;
      }
    }    
  });
}

var get_actual_info = function (callback_obj,id,callback) {
  var user_info=callback_obj.query;
  var callback_return;
  var user_id="";
  con.query(user_info,function(err,results){
    if(results.length>0){
      if(results[0].to_id==id){
        user_id=results[0].from_id;
      }else{
        user_id=results[0].to_id;
      }
      var actual_user_info="select * from user where id='"+user_id+"'";
      con.query(String(actual_user_info),function(err,list){
        callback_return={
          result:list[0],
          return_i:callback_obj.i,
          return_j:callback_obj.j
        }
        callback(callback_return);
      });
    }else{
      callback_return={
          result:{},
          return_i:callback_obj.i,
          return_j:callback_obj.j
        }
      callback(callback_return);
    }
    
    });
}
function isEmptyObject(obj) {
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return false;
    }
  }
  return true;
}
/*----------------------------------------------------------- Home page Ends ---------------------------------------------------------*/

http.listen(8000);