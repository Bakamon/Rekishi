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
    case '/load/images/mycard_1.png':
      res.writeHead(200,{"Content-Type":"image/png"});
      var output=fs.readFileSync("./load/images/mycard_1.png");
      res.end(output);
      break;
    case '/load/images/mycard_2.png':
      res.writeHead(200,{"Content-Type":"image/png"});
      var output=fs.readFileSync("./load/images/mycard_2.png");
      res.end(output);
      break;
    case '/load/images/mycard_3.png':
      res.writeHead(200,{"Content-Type":"image/png"});
      var output=fs.readFileSync("./load/images/mycard_3.png");
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
var userOrder=[];

var kartoj=[];
var userKartoj={};
var usedKartoj=[];

var turnKartoj={};
var turnCount=0;
var whoTurn;

var outKartojNum=0;
var GAME_STATE={
  game_start:"GAME_START",
  game_play:"GAME_PLAY"
};
var gameState=GAME_STATE["game_start"];


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
    outKartojNum=1;
    gameState=GAME_STATE["game_start"];
    setUserOrder();
    selectEra();
    dealKartoj();
    pushEnemyCardNum();
    pushMyCard();
    io.sockets.emit("out_kartoj_num",{value:outKartojNum});
    if(user_num==4){
      io.sockets.emit("start_game");
    }
  });

  socket.on("push_my_card",function(cardAry){
    if(cardAry.length!=outKartojNum){
      return 0;
    }
    if(gameState==GAME_STATE["game_start"]){
      taskOfOrder(cardAry);
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

  function searchKartoj(id){
    for(let i=0;i<kartoj.length;i++){
      if(kartoj[i].id==id){
        return kartoj[i];
      }
    }
    return 0;
  }

  //////
  function usedKarto(kartoId,userId){
    let index;
    for(index=0;index<userKartoj[userId].length;index++){
      if(userKartoj[userId][index].id==kartoId){
        break;
      }
    }
    usedKartoj.push(userKartoj[userId][index]);
    userKartoj[userId].splice(index,1);
  }

  function turnCount(turn){
    let message;
    turnCount=turn;
    whoTurn=userOrder[turnCount];
    for(let id in userHash){
      if(id==whoTurn){
        message="あなたの番です。カードを出してください。";
        io.to(id).emit("operation_push",{value:true});
        if(outKartojNum!=0){
          io.to(id).emit("pass_able",{value:false});
        }else{
          io.to(id).emit("pass_able",{value:false});
        }
      }else{
        message=String(userHash[whoTurn])+"の番です。";
        io.to(id).emit("operation_push",{value:false});
      }
      io.to(id).emit("display_message",{value:message});
    }

    turnCount+=1;
    if(turnCount>userOrder.length){
      turnCount=0;
    }
  }

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

  function setUserOrder(){
    userOrder=[];
    for(let i in userHash){
      userOrder.push(i);
    }
  }

  function taskOfOrder(cardAry){
    turnKartoj[socket.id]=cardAry[0];
    usedKarto(cardAry[0],socket.id);
    pushMyCard();
    io.to(socket.id).emit("operation_push",{value:false});

    if(Object.keys(turnKartoj).length==4){
      userOrder=[];
      for(let index in turnKartoj){
        let cardId=turnKartoj[index];
        let karto=searchKartoj(cardId).id;
        let orderLength=userOrder.length;
        if(userOrder.length==0){
          userOrder.push(index);
          continue;
        }
        for(let i=0;i<orderLength;i++){
          let index2=userOrder[i];
          let cardId2=turnKartoj[index2];
          let karto2=searchKartoj(cardId2).id;
          if(karto>karto2){
            userOrder.splice(i,0,index);
            break;
          }else if(karto==karto2){
            if(Math.random()%2==0){
              userOrder.splice(i,0,index);
            }else{
              userOrder.splice(i+1,0,index);
            }
            break;
          }else if(i==orderLength-1){
            userOrder.push(index);
          }
        }
      }
      io.sockets.emit("touch_able_kartoj",{value:false});
      io.sockets.emit("display_message",{value:"順番が決まりました"});
      pushEnemyCardNum();
      for(let i=0;i<userOrder.length;i++){
        let index=userOrder.length-(1+i);
        let userId=userOrder[index];
        let waitTime=1500*(i)+1000;
        let karto=searchKartoj(turnKartoj[userId]);
        let message=String(userHash[userId])+"が"+String(userOrder.length-i)+"番目です";
        setTimeout(function(){
          io.sockets.emit("kartoj_info",{value:karto});
          io.sockets.emit("display_message",{value:message});
        },waitTime);
      }
      setTimeout(function(){
        io.sockets.emit("touch_able_kartoj",{value:true});
        gameState=GAME_STATE["game_play"];
        outKartojNum=0;
        io.sockets.emit("out_kartoj_num",{value:outKartojNum});
        turnCount(0);
      },7000)

    }
  }

  function pushEnemyCardNum(){
    for(let i=0;i<userOrder.length;i++){
      let myId=userOrder[i];
      let enemyAry=[];
      let me=0;
      while(me<2){
        for(let j=0;j<userOrder.length;j++){
          let eneId=userOrder[j];
          if(i==j){
            me+=1;
          }else if(me==1){
            let enemyName=userHash[eneId];
            let enemyCardHash={};
            enemyCardHash["name"]=userHash[eneId];
            enemyCardHash["num"]=userKartoj[eneId].length;
            enemyAry.push(enemyCardHash);
          }
        }
      }
      io.to(myId).emit("enemyUserInfo",{value:enemyAry});
    }
  }

  function pushMyCard(){
    for(let i in userHash){
      let kartoj=userKartoj[i];
      io.to(i).emit("myKartoj",{value:kartoj});
    }
  }

  function selectEra(){
    let selectEra=Math.floor(Math.random()*(8));
    let countKartoj=0;
    for(let i=selectEra;i<selectEra+13;i++){
      fisherYates(card_list.list[i]);
      for(let j=0;j<4;j++){
        let card=card_list.list[i][j];
        card.num=i+1;
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
