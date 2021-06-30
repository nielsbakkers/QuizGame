const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const { makeid } = require('./utils');
const { quizData } = require('./quizdata');

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET"],
    credentials: true,
  }
});

//quizRooms is the local storage
const quizRooms = {};

io.on('connection', client => {
  //when a client connects to the webpage this will be logged
  console.log(`[SERVER] ${client.id}`)

  //when the clientside emits a message the server side will run a handler
  client.on('newQuiz', handleNewQuiz);
  client.on('joinQuiz', handleJoinQuiz);
  client.on('startQuiz', handleStartQuiz);
  client.on('getUsernames', handleGetUsernames);
  client.on('checkAnswer', handleCheckAnswer);
  client.on('validateQuizcode', handleValidateQuizCode);

  function handleCheckAnswer(answer, username) {
    roomname = getCurrentRoomname(username);
    questionData = quizData();
    quizName = quizRooms[roomname].quizName;

    if (answer === questionData[quizName][quizRooms[roomname].questionCount].correct) {
      for (room in quizRooms) {
        if (quizRooms[room].client_number === client.id && quizRooms[room].roomname === roomname) {
          quizRooms[room].correct += 1;
          roomname = quizRooms[room].roomname;
        }
      }
      client.emit('questionResult', true);
    } 
    else 
    {
      client.emit('questionResult', false);
    }
    //when user submitted answer add 1 to the answered count.
    quizRooms[roomname].answered += 1;
    //send the clients who answered the question.
    io.sockets.in(roomname).emit('userAnswered', username, quizRooms[roomname].answered, quizRooms[roomname].clients.length);

      if (quizRooms[roomname].answered == quizRooms[roomname].clients.length) {
        quizRooms[roomname].questionCount += 1;
        quizName = quizRooms[roomname].quizName;
        if ((quizRooms[roomname].questionCount - 1) == Object.keys(question[quizName]).length) {
          handleQuizEnd(roomname);
        } 
        else 
        {
          handleNewQuestion(roomname);
        }
      }
    }
            
  function handleNewQuestion(roomname) {
    question = quizData();
    quizRooms[roomname].answered = 0;
    quizName = quizRooms[roomname].quizName;
    io.sockets.in(roomname).emit('quizStarted', question[quizName][quizRooms[roomname].questionCount]);
  }

  function handleQuizEnd(roomname) {
    let results = {};
    for (room in quizRooms) {
      if (quizRooms[room].roomname === roomname) {
        results[quizRooms[room].userName] = quizRooms[room];
      }
    }
    quizName = quizRooms[roomname].quizName;
    question = quizData();
    console.log(`[${roomname}] quiz finished`);
    io.sockets.in(roomname).emit('quizFinished', results, Object.keys(question[quizName]).length);
  }

  function handleStartQuiz(username, quizname) {
    let roomname = '';
    for (room in quizRooms) {
      if (quizRooms[room].userName === username && client.id === quizRooms[room].client_number) {
        roomname = quizRooms[room].roomname
      }
    }
    quizRooms[roomname].quizName = quizname;
    quizRooms[roomname].questionCount = 1;
    quizName = quizRooms[roomname].quizName;
    question = quizData();
    console.log(`[${roomname}] quiz has been started`)
    io.sockets.in(roomname).emit('quizStarted', question[quizName][quizRooms[roomname].questionCount]);
  }

  function handleJoinQuiz(roomName, username) {
    quizRooms[roomName].clients.push(username);
    const clients = quizRooms[roomName].clients.length;
    
    quizRooms[client.id] = {roomname: roomName, userName: username, client_number: clients, correct: 0};
    client.join(roomName);
    client.id = quizRooms[client.id].client_number;
    if (quizRooms[roomName].questionCount == 0) {
      client.emit('init', client.id);
      client.emit('quizCode', roomName, username)
      io.sockets.in(roomName).emit('userJoined', quizRooms[roomName].clients)
      console.log(`[${username}] joined ${roomName}`);
    } 
    else 
    {
      client.emit('setUsername', username);
      question = quizData();
      quizname = quizRooms[roomName].quizName;
      client.emit('quizStarted', question[quizname][quizRooms[roomName].questionCount])
    }
  }

  function handleNewQuiz(username) {
    //create roomName of 5 characters
    let roomName = makeid(5);
    //create an object with the user information
    quizRooms[client.id] = {roomname: roomName, userName: username, client_number: 1, correct: 0};
    //count of the amount of users in the room
    quizRooms[roomName] = {'clients': [username], quizName: '', questionCount: 0, answered: 0};
    //send the quizCode to the client
    client.emit('quizCode', roomName, username);

    client.join(roomName);
    client.id = quizRooms[client.id].client_number;

    //get all the quiz names
    const quizNames = Object.keys(quizData());
    client.emit('init', client.id, quizNames);
    io.sockets.in(roomName).emit('userJoined', quizRooms[roomName].clients)
    console.log('[ROOM CREATED]', roomName);
    console.log(`[${username}] joined ${roomName}`);
  }

  function handleGetUsernames(code) {
    if (code in quizRooms) {
      usernames = quizRooms[code].clients;
      client.emit('usernamesInGame', usernames);
    }
  }

  client.on('disconnect', function() {
    for (room in quizRooms) {
      if (quizRooms[room].client_number === client.id) {
        roomName = quizRooms[room].roomname;
        username = quizRooms[room].userName;
        index = quizRooms[quizRooms[room].roomname].clients.indexOf(quizRooms[room].userName);
        quizRooms[quizRooms[room].roomname].clients.splice(index, index);
        delete quizRooms[room];
        io.sockets.in(roomName).emit('userJoined', quizRooms[roomName].clients);
        console.log(`[${username}] left ${roomName}`);
      }
    }
  })

  function getCurrentRoomname(username) {
    let roomname = '';
    for (room in quizRooms) {
      if (quizRooms[room].userName === username) {
        roomname = quizRooms[room].roomname;
      }
    }
    return roomname;
  }
  
  function handleValidateQuizCode(quizCode) {
    if(Object.keys(quizRooms).includes(quizCode)) {
      client.emit('QuizCodeValidator', true);
    }
    else
    {
      client.emit('QuizCodeValidator', false);
    }
  }
});

server.listen(3000, () => {
  console.log('[SERVER] Listening on *:3000');
});