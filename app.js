var fs=require("fs");

var card_list=require("./card_list.js");

var server=require("http").createServer(function(req,res){
  switch(req.url){
    case '/':
      res.writeHead(200,{"Content-Type":"text/html"});
      var output=fs.readFileSync("./index.html","utf-8");
      res.end(output);
      break;
    case '/load/images/chat_haikei.png':
      res.writeHead(200,{"Content-Type":"image/png"});
      var output=fs.readFileSync("./load/images/chat_haikei.png");
      res.end(output);
      break;
    case '/load/images/title.png':
      res.writeHead(200,{"Content-Type":"image/png"});
      var output=fs.readFileSync("./load/images/title.png");
      res.end(output);
      break;
    case '/load/images/mycard.png':
      res.writeHead(200,{"Content-Type":"image/png"});
      var output=fs.readFileSync("./load/images/mycard.png");
      res.end(output);
      break;
    case '/load/images/enemy_front.png':
      res.writeHead(200,{"Content-Type":"image/png"});
      var output=fs.readFileSync("./load/images/enemy_front.png");
      res.end(output);
      break;
    case '/load/images/enemy_side.png':
      res.writeHead(200,{"Content-Type":"image/png"});
      var output=fs.readFileSync("./load/images/enemy_side.png");
      res.end(output);
      break;
    case '/load/images/haikei.png':
      res.writeHead(200,{"Content-Type":"image/png"});
      var output=fs.readFileSync("./load/images/haikei.png");
      res.end(output);
      break;
  }
}).listen(4567);
var io=require("socket.io").listen(server);

var userHash={};

var kartoj=[];
var userKartoj={};
var playUser=[];

io.sockets.on("connection",function(socket){

  socket.on("connected",function(){
    var str="hello world"
    io.sockets.emit("hello_world",{value:str});
    emitEntryNum();
  });

  socket.on("add_user",function(name){
    let user_name;
    let message;
    let user_num=Object.keys(userHash).length;
    if(user_num<4){
      userHash[socket.id]=name;
      if(userHash[socket.id]){
        io.to(socket.id).emit("user_in",{value:name});
        emitEntryNum();
        emitMember();
        user_name=userHash[socket.id];
        message="["+user_name+"]が入室しました";
        io.sockets.emit("add_message",{value:message});
      }
    }else{
      io.to(socket.id).emit("over_capacity");
      io.to(socket.id).emit("entry_num",{value:user_num});
    }
  });

  socket.on("push_message",function(message){
    if(userHash[socket.id]){
      let user_name=userHash[socket.id];
      message="["+user_name+"]　"+message;
      io.sockets.emit("add_message",{value:message});
    }
  });

  socket.on("start_game",function(){
    let user_num=Object.keys(userHash).length;
    setPlayUser();
    selectEra();
    dealKartoj();
    pushEnemyCardNum();
    if(user_num==4){
      io.sockets.emit("start_game");
    }
  });

  socket.on("disconnect",function(){
    let user_name;
    let message;
    if(userHash[socket.id]){
      user_name=userHash[socket.id];
      message="["+user_name+"]が退室しました";
      io.sockets.emit("add_message",{value:message});
      delete userHash[socket.id];
      emitEntryNum();
      emitMember();
    }
  });

  function emitEntryNum(){
    let user_num=Object.keys(userHash).length;
    io.sockets.emit("entry_num",{value:user_num});
  }

  function emitMember(){
    let length=Object.keys(userHash).length;
    let uHash={};
    let count=0;
    for(let i in userHash){
      uHash[count]=userHash[i];
      count+=1;
    }
    io.sockets.emit("u_hash",{value:uHash});
  }

  function setPlayUser(){
    for(let i in userHash){
      playUser.push(i);
    }
    for(let i=0;i<4;i++){
      console.log(playUser[i]);
    }
  }

  function pushEnemyCardNum(){
    for(let i in userHash){
      let enemyAry=[];
      for(let j in userHash){
        if(i!=j){
          let enemyName=userHash[j];
          let enemyCardHash={};
          enemyCardHash["name"]=userHash[j];
          enemyCardHash["num"]=userKartoj[j].length;
          enemyAry.push(enemyCardHash);
        }
      }
      io.to(i).emit("enemyUserInfo",{value:enemyAry});
    }
  }

  function selectEra(){
    let selectEra=Math.floor(Math.random()*(8));
    let countKartoj=0;
    for(let i=selectEra;i<selectEra+13;i++){
      fisherYates(card_list.list[i]);
      for(let j=0;j<4;j++){
        let card=card_list.list[i][j];
        card.num=i;
        card.id=countKartoj;
        kartoj.push(card);
        countKartoj++;
      }
    }
  }

  function fisherYates(array){
    for(let i=array.length-1;i>0;i--){
      let j=Math.floor(Math.random()*(i+1));
      let tmp=array[i];
      array[i]=array[j];
      array[j]=tmp;
    }
  }

  function dealKartoj(){
    fisherYates(kartoj);
    let userCount=0;
    for(let i in userHash){
      let sliceStart=userCount*13;
      userKartoj[i]=kartoj.slice(sliceStart,sliceStart+13);
      userCount++;
    }
  }




});
