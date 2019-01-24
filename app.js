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
    case '/load/images/now_player.png':
      res.writeHead(200,{"Content-Type":"image/png"});
      var output=fs.readFileSync("./load/images/now_player.png");
      res.end(output);
      break;
    case '/load/images/else_player.png':
      res.writeHead(200,{"Content-Type":"image/png"});
      var output=fs.readFileSync("./load/images/else_player.png");
      res.end(output);
      break;
    case '/load/images/result_haikei.png':
      res.writeHead(200,{"Content-Type":"image/png"});
      var output=fs.readFileSync("./load/images/result_haikei.png");
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
var tableKartoj=[];
var effectAry=[];
var whichEffect=0;
var bool_select_user;
var selectUserId;
var selectHash={};
var selectTwoHash={};

var turnKartoj={};
var turnCounter=0;
var whoTurn;
var lastPushPlayer;
var finishPlayer=[];

var outKartojNum=0;
var GAME_STATE={
  game_start:"GAME_START",
  game_play:"GAME_PLAY",
  game_finish:"GAME_FINISH"
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
    //console.log(cardAry);
    //console.log("cardAry.length:"+cardAry.length);
    //console.log("whichEffect:"+whichEffect);
    if(outKartojNum==0){
      ;
    }
    else if(cardAry.length==1 && (whichEffect==2 || whichEffect==3)){
      twoPush(cardAry);
      return;
    }
    else if(cardAry.length!=outKartojNum){
      return 0;
    }
    if(gameState==GAME_STATE["game_start"]){
      taskOfOrder(cardAry);
    }else if(gameState==GAME_STATE["game_play"]){
      taskPushKartoj(cardAry);
    }
  });

  socket.on("push_pass",function(){

    if(gameState==GAME_STATE["game_play"]){
      if(socket.id==userOrder[turnCounter]&&outKartojNum!=0){
        turnCount(turnCounter);
      }
    }
  });

  socket.on("push_invention",function(){
    pushEffect(1);
  });

  socket.on("push_culture",function(){
    pushEffect(2);
  });

  socket.on("push_war",function(){
    pushEffect(3);
  });

  socket.on("select_used",function(selectUsedId){
    let message;
    if(userOrder[turnCounter]==socket.id && whichEffect==1){
      let index=100;
      for(index=0;index<usedKartoj.length;index++){
        if(usedKartoj[index].id==selectUsedId){
          break;
        }
      }
      if(index==100){
        return;
      }
      if(usedKartoj[index].type==1){
        io.sockets.emit("display_message",{value:"発見カードは手札に戻せません"});
        return;
      }
      ///
      message=String(usedKartoj[index].num)+"世紀"+String(usedKartoj[index].name)+"を手札に戻しました";
      userKartoj[socket.id].push(usedKartoj[index]);
      usedKartoj.splice(index,1);
      whichEffect=0;
      pushEnemyCardNum();
      pushMyCard();
      io.sockets.emit("used_info",{value:usedKartoj});
      io.sockets.emit("display_message",{value:message});
      io.to(socket.id).emit("which_effect",{value:whichEffect});
      setTimeout(function(){
        turnCount(turnCounter);
      },2000);
    }
  });

  socket.on("push_user_img",function(num){
    if(userOrder[turnCounter]==socket.id && bool_select_user==true){
      if(whichEffect==2 || whichEffect==3){
        //console.log(num);
        let index=turnCounter+num;
        let message;
        if(index>userOrder.length-1){
          index-=userOrder.length;
        }
        //console.log("indexxx:"+index);
        selectHash={};
        selectTwoHash={};
        selectHash[socket.id]=false;
        selectHash[userOrder[index]]=false;
        selectUserId=userOrder[index];
        message=String(userHash[userOrder[index]])+"が選ばれました";
        io.sockets.emit("display_message",{value:message});
        for(let i=0;i<userOrder.length;i++){
          let interval;
          if(index>i){
            interval=index-i;
          }else if(index==i){
            interval=0;
          }else{
            interval=userOrder.length-i+index;
          }
          io.to(userOrder[i]).emit("display_who_light",{value:interval});
        }
        bool_select_user=false;

        setTimeout(function(){
          if(whichEffect==2){
            for(index in selectHash){
              io.to(index).emit("which_effect",{value:whichEffect});
              //console.log("index:"+index);
              io.to(index).emit("display_message",{value:"交換するカードを１枚出してください"});
              io.to(index).emit("operation_push",{value:true});
            }
          }else{
            for(index in selectHash){
              io.to(index).emit("which_effect",{value:whichEffect});
              //console.log("index:"+index);
              io.to(index).emit("display_message",{value:"カードを１枚出してください"});
              io.to(index).emit("operation_push",{value:true});
            }
          }
        },2000);
      }
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
    io.sockets.emit("used_info",{value:usedKartoj});
  }

  /////////////
  function tableKarto(userId,cardAry){
    tableKartoj.push(cardAry);
    for(let i=0;i<cardAry.length;i++){
      let kartoId=cardAry[i];
      for(let j=0;j<userKartoj[userId].length;j++){
        if(userKartoj[userId][j].id==kartoId){
          userKartoj[userId].splice(j,1);
          break;
        }
      }
    }
  }

  function turnCount(turn){
    let message;
    turnCounter=turn;
    turnCounter+=1;
    if(turnCounter>userOrder.length-1){
      turnCounter=0;
    }
    whoTurn=userOrder[turnCounter]
    whichEffect=0;
    bool_select_user=false;
    returnMyKartoj(whoTurn);
    io.sockets.emit("used_bool",{value:true});
    for(let id in userHash){
      io.to(id).emit("who_turn_img",{value:intervalPlayer(id,whoTurn)})
      if(id==whoTurn){
        message="あなたの番です。カードを出してください。";
        io.to(id).emit("operation_push",{value:true});
        if(outKartojNum!=0){
          io.to(id).emit("pass_able",{value:true});
        }else{
          io.to(id).emit("pass_able",{value:false});
        }
      }else{
        message=String(userHash[whoTurn])+"の番です。";
        io.to(id).emit("operation_push",{value:false});
        io.to(id).emit("pass_able",{value:false});
      }
      io.to(id).emit("display_message",{value:message});
    }

    if(userKartoj[whoTurn].length==0){
      turnCount(turnCounter);
    }
  }

  function intervalPlayer(id1,id2){
    let count1=0;
    let count2=0;

    if(id1==id2){
      return 0;
    }
    for(let i=0;i<userOrder.length;i++){
      if(userOrder[i]==id1){
        count1=i;
      }else if(userOrder[i]==id2){
        count2=i;
      }
    }
    if(count1<count2){
      return count2-count1;
    }else{
      return userOrder.length-count1+count2;
    }
  }

  function finishGame(){
    if(finishPlayer.length==3){
      //console.log("finish");
      let nameAry=[];
      for(let i in userHash){
        let flag=true;
        for(let j=0;j<finishPlayer.length;j++){
          if(i==finishPlayer[j]){
            flag=false;
          }
        }
        if(flag==true){
          finishPlayer.push(i);
        }
      }
      //console.log("finishPlayer:"+finishPlayer);
      for(let i=0;i<finishPlayer.length;i++){
        nameAry.push(userHash[finishPlayer[i]]);
      }
      //console.log("nameAry:"+nameAry);
      gameState=GAME_STATE["game_finish"];
      io.sockets.emit("finish_player",{value:nameAry});
    }
  }

  function nowPlayer(){
    let nowTurn;
    if(turnCounter==0){
      nowTurn=userOrder[userOrder.length-1];
    }else{
      nowTurn=userOrder[turnCounter-1];
    }
    return nowTurn;
  }

  function returnMyKartoj(id){
    if(lastPushPlayer!=id){
      return;
    }
    for(let i=0;i<tableKartoj.length;i++){
      for(let j=0;j<tableKartoj[i].length;j++){
        let karto=searchKartoj(tableKartoj[i][j]);
        usedKartoj.push(karto);
      }
    }
    io.sockets.emit("used_info",{value:usedKartoj});
    tableKartoj=[];
    outKartojNum=0;
    io.sockets.emit("out_kartoj_num",{value:outKartojNum});
    pushTableCard();
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
        turnCount(-1);
      },7000)

    }
  }

  function taskPushKartoj(cardAry){
    if(Object.keys(tableKartoj).length!=0){
      let kartoNum=searchKartoj(cardAry[0]).num;
      let lastKartoj=tableKartoj.slice(-1)[0];
      let lastNum=searchKartoj(lastKartoj[0]).num;
      if(kartoNum<=lastNum){
        return 0;
      }
    }
    tableKarto(socket.id,cardAry);
    pushMyCard();
    io.to(socket.id).emit("operation_push",{value:false});
    pushEnemyCardNum();
    pushTableCard();
    if(tableKartoj.length!=0){
      lastKartoj=tableKartoj.slice(-1)[0];
      outKartojNum=lastKartoj.length;
    }
    lastPushPlayer=socket.id;
    /////////
    handZero(socket.id);
    io.sockets.emit("out_kartoj_num",{value:outKartojNum});
    effectKartoj(cardAry);
    if(effectAry.length>0){
      pushEffectAry();
      return;
    }
    finishGame();
    turnCount(turnCounter);
  }

  function handZero(id){
    if(userKartoj[id].length==0){
      //console.log("handZero");
      addFinishPlayer(id);
      for(let index=0;index<userOrder.length;index++){
        io.to(userOrder[index]).emit("display_who_img",{value:intervalPlayer(userOrder[index],id)});
      }
    }
  }

  function twoPush(cardAry){
    console.log("twoPush");
    io.to(socket.id).emit("operation_push",{value:false});
    if(cardAry.length!=1){
      return;
    }
    for(let index in selectHash){
      if(index==socket.id && selectHash[index]==false){
        selectHash[socket.id]=true;
        selectTwoHash[socket.id]=cardAry[0];
      }
    }
    console.log(selectTwoHash);
    if(Object.keys(selectTwoHash).length==2){
      console.log("selectTwoHash");
      if(whichEffect==2){
        exchangeEffect();
      }else{
        battleEffect();
      }
    }
  }

  function exchangeEffect(){
    //console.log("exchange");
    let userAry=[];
    let card1;
    let card2;
    let message1;
    let message2;
    let message3;
    for(let index in selectTwoHash){
      userAry.push(index);
    }
    card1=searchKartoj(selectTwoHash[userAry[1]]);
    card2=searchKartoj(selectTwoHash[userAry[0]]);
    //console.log("card1:"+card1);
    //console.log("userKartoj:"+userKartoj[userAry[0]]);
    userKartoj[userAry[0]].push(card1);
    userKartoj[userAry[1]].push(card2);
    for(let index in selectTwoHash){
      console.log("selectTwoHash[index]"+selectTwoHash[index]);
      for(let i=0;i<userKartoj[index].length;i++){
        console.log("userKartoj[index][i]:"+userKartoj[index][i]);
        if(selectTwoHash[index]==userKartoj[index][i].id){
          console.log("zzzzzzz");
          userKartoj[index].splice(i,1);
          break;
        }
      }
    }
    message1=String(userHash[userAry[0]])+"←"+String(card2.num)+"世紀"+String(card1.name)+"、";
    message2=String(userHash[userAry[1]])+"←"+String(card2.num)+"世紀"+String(card2.name);
    message3="交換が成立しました　"+message1+message2;
    io.sockets.emit("display_message",{value:message3});
    whichEffect=0;
    pushEnemyCardNum();
    pushMyCard();
    io.sockets.emit("which_effect",{value:whichEffect});
    setTimeout(function(){
      turnCount(turnCounter);
    },2000);
  }

  function battleEffect(){
    console.log("battle");
    let nowId=userOrder[turnCounter];
    let enemyId;
    let card1;
    let card2;
    let message1;
    let message2;
    let message3;
    for(let index in selectTwoHash){
      if(index!=nowId){
        enemyId=index;
      }
    }
    card1=searchKartoj(selectTwoHash[nowId]);
    card2=searchKartoj(selectTwoHash[enemyId]);
    message1=String(userHash[nowId])+"："+String(card1.num)+"世紀"+String(card1.name);
    message2=String(userHash[enemyId])+"："+String(card2.num)+"世紀"+String(card2.name);
    if(card1.num>=card2.num){
      message3=String(userHash[enemyId])+"←"+String(card1.num)+"世紀"+String(card1.name);
      userKartoj[enemyId].push(card1);
      for(let index=0;index<userKartoj[nowId].length;index++){
        if(userKartoj[nowId][index].id==card1.id){
          userKartoj[nowId].splice(index,1);
          break;
        }
      }
      handZero(nowId);
    }else{
      message3=String(userHash[nowId])+"←"+String(card2.num)+"世紀"+String(card2.name);
      userKartoj[nowId].push(card2);
      for(let index=0;index<userKartoj[enemyId].length;index++){
        if(userKartoj[enemyId][index].id==card2.id){
          userKartoj[enemyId].splice(index,1);
          break;
        }
      }
      handZero(enemyId);
    }
    io.sockets.emit("display_message",{value:"結果が出ました"});
    setTimeout(function(){
      io.sockets.emit("display_message",{value:message1});
    },2000);
    setTimeout(function(){
      io.sockets.emit("display_message",{value:message2});
    },3000);
    setTimeout(function(){
      whichEffect=0;
      pushEnemyCardNum();
      pushMyCard();
      io.sockets.emit("which_effect",{value:whichEffect});
      io.sockets.emit("display_message",{value:message3});
      turnCount(turnCounter);
    },4000);
  }

  function pushEffectAry(){
    //console.log("effectAry : "+effectAry);
    let user=userHash[socket.id];
    let message=user+"さんが特殊効果を選択中です";
    io.to(socket.id).emit("display_message",{value:"発動する特殊効果を選んでください"});
    io.to(socket.id).emit("effect_ary",{value:effectAry});
    io.to(socket.id).emit("pass_able",{value:false});
    for(let index in userHash){
      if(index!=socket.id){
        io.to(index).emit("display_message",{value:message});
      }
    }
  }

  function pushEffect(num){
    let message;
    let effect;

    whichEffect=num;
    if(whoTurn!=socket.id){
      return;
    }
    switch(num){
      case 1:message="手札に戻すカードを選んでください";
        effect="発見";
        break;
      case 2:message="カードを交換する相手を選んでください";
        effect="文化";
        bool_select_user=true;
        break;
      case 3:message="争う相手を選んでください";
        effect="戦争";
        bool_select_user=true;
        break;
      default:message="おかしなメッセージ";
        effect="？？";
    }
    io.to(socket.id).emit("display_message",{value:message});
    io.to(socket.id).emit("effect_ary",{value:new Array()});
    io.to(socket.id).emit("which_effect",{value:whichEffect});
    for(let index in userHash){
      if(index!=socket.id){
        io.to(index).emit("display_message",{value:effect+"が発動されました"});
      }
    }
  }

  function effectKartoj(cardAry){
    let tableLength=Object.keys(tableKartoj).length;
    effectAry=[];
    //console.log("tableLength:"+tableLength);
    //console.log("lengthKartoj"+userKartoj[socket.id].length);
    if(userKartoj[socket.id].length<=0){
      return;
    }
    if(outKartojNum>=3){
      return;
    }
    for(let i=0;i<cardAry.length;i++){
      let karto=searchKartoj(cardAry[i]);
      if(karto.type!=0){
        //console.log("karto.type:"+karto.type)
        if(tableLength>1 || karto.type!=1){
          effectAry.push(karto.type);
        }
      }
    }
  }

  function addFinishPlayer(id){
    for(let i=0;i<finishPlayer.length;i++){
      if(finishPlayer[i]==id){
        return;
      }
    }
    finishPlayer.push(id);
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

  function pushTableCard(){
    let pushTableInfo=[];
    let lastTableAry;
    if(tableKartoj.length==0){
      io.sockets.emit("table_info",{value:pushTableInfo});
      return;
    }
    lastTableAry=tableKartoj.slice(-1)[0];
    for(let i=0;i<lastTableAry.length;i++){
      let kartoInfo=searchKartoj(lastTableAry[i]);
      pushTableInfo.push(kartoInfo);
    }
    io.sockets.emit("table_info",{value:pushTableInfo});
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
