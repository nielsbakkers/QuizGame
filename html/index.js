var urlParts = window.location.href.split(':');
//connect to the socket.io socket
var socket = io(`${urlParts[0]}:${urlParts[1]}:1010/`);
//list with the word quiz in different languages
var quizWords = ['quiz', 'Kvíz', 'kwis', 'questionário', 'examen', 'cwis', 'kuisa', 'kuiz', 'egzamen','kouíz', 'galdetegi', 'problema', 'pirsok'];

//initialization of the elements on the Initial screen
const initialScreen = document.getElementById('initialScreen');
const newQuizBtn = document.getElementById('newQuizButton');
const joinQuizBtn = document.getElementById('joinQuizButton');
const usernameInput = document.getElementById('usernameInput');
const quizcodeInput = document.getElementById('quizcodeInput');

//initialization of the elements on the quizLoading screen
const quizScreen = document.getElementById('quizScreen');
const startQuizBtn = document.getElementById('startQuizButton');
const quizcodeDisplay = document.getElementById('quizcodeDisplay');
const usernameDisplay = document.getElementById('usernameDisplay');
const controlDisplay = document.getElementById('controls');
const usersDisplay = document.getElementById('users');
const quizNamesDisplay = document.getElementById('quizNames');

//initialization of the elements on the quizQuestion screen
const errorMessageDisplay = document.getElementById('errorMessage');
const errorMessageBoxDisplay = document.getElementById('errorMessageBox');
const quizQuestionScreenDisplay = document.getElementById('quizQuestionScreen');
const questionDisplay = document.getElementById('question');
const answersEl = document.querySelectorAll('.answer');
const answerAdisplay = document.getElementById('a_answer');
const answerBdisplay = document.getElementById('b_answer');
const answerCdisplay = document.getElementById('c_answer');
const answerDdisplay = document.getElementById('d_answer');
const checkAnswerBtn = document.getElementById('checkAnswer');
const questionResultDisplay = document.getElementById('questionResult');
const notificationDisplay = document.getElementById('notification');
const userAnsweredDisplay = document.getElementById('userAnswered');
const answeredScreenDisplay = document.getElementById('answeredScreen');
const quizCodeDisplay = document.getElementById('quizCodeDisplay');
const userNameDisplay = document.getElementById('userNameDisplay');

//initialization of the elements on the quizResults screen
const quizResultsDisplay = document.getElementById('quizResults');
const selectErrorDisplay = document.getElementById('selectError');
const quizcodeResultsDisplay = document.getElementById('quizcodeResults');
const usernameResultsDisplay = document.getElementById('usernameResults');

//function to generate the words and let them fall from the top of the screen to the bottom
function createWord() {
    const word = document.createElement('div');
    word.classList.add('word');

    word.style.left = Math.random() * 100 + "vw";
    word.innerText = quizWords[Math.floor(Math.random() * ((quizWords.length -1) - 0 + 1) + 0)];

    word.style.animationDuration = Math.random() * 2 + 3 + "s";


    document.getElementById('quizWords').appendChild(word);

    setTimeout(() => {word.remove()}, 5000)
}

//set interval to generate the words when on the Initial screen
setInterval(() => {
    if (initialScreen.style.display == "block") {
        createWord();
    }    
}, 300);

//socket handlers
socket.on('quizCode', handleQuizCode);
//socket.on('unknownCode', handleUnknownCode);
socket.on('init', handleInit);
socket.on('userJoined', handleUserJoined);
socket.on('quizStarted', handleQuiz);
socket.on('usernamesInGame', handleUsernamesInGame);
socket.on('questionResult', handleQuestionResult)
socket.on('userAnswered', handleUserAnswered);
socket.on('quizFinished', handleQuizFinished);
socket.on('setUsername', handleSetUsername);
socket.on('QuizCodeValidator', handleQuizCodeValidator);

//eventlisteners
newQuizBtn.addEventListener('click', newQuiz);
joinQuizBtn.addEventListener('click', joinQuiz);
startQuizBtn.addEventListener('click', startQuiz);
checkAnswerBtn.addEventListener('click', checkAnswer);
quizcodeDisplay.addEventListener('click', copyQuizcodeURL);

//list to save the usernamesInGame for the handleUsernamesInGame function
let usernamesInGame = [];

//function to start the newQuiz when the startQuizBtn is clicked
function newQuiz() {
    const username = usernameInput.value;
    if (validateUsername(username)) {
        socket.emit('newQuiz', username);
        init();
    }
}

//when the user starts a new quiz the initial screen will be set to hidden
function init() {
    initialScreen.style.display = "none";
    quizScreen.style.display = "block";
}

//set the chosen username in the usernameDisplay
function handleSetUsername(username) {
    usernameDisplay.innerText = username;
}

//set the generated quizCode in the quizcodeDisplay
function handleQuizCode(quizCode, username) {
    quizcodeDisplay.innerText = quizCode;
    usernameDisplay.innerText = username
}

//function executed when someone clicks the joinQuizBtn
//there will be checked if the chosen username doesn't exist
//if so the selected quizCode will be forwarded to the quizCodeValidator
function joinQuiz() {
    const code = quizcodeInput.value;
    const username = usernameInput.value;
    socket.emit('getUsernames', code);
    setTimeout(function () {
        if (validateUsername(username, code)) {
            socket.emit('validateQuizcode', code);
        }
    }, 500)  
}

//function to validate if the username is already chosen
//and to check if the username has a length greater than zero
function validateUsername(username, code) {
    if (username.length <= 0) {
        errorMessageBoxDisplay.style.display = "block";
        errorMessageDisplay.innerText = "Username length has to be greater than zero!"
        setInterval(function () {
            errorMessageBoxDisplay.style.display = "none";
            errorMessageDisplay.innerText = "";
        }, 5000);
        return false;
    }

    if (usernamesInGame.indexOf(username) === 0) {
        errorMessageBoxDisplay.style.display = "block";
        errorMessageDisplay.innerText = "Username is already chosen!"
        setInterval(function () {
            errorMessageBoxDisplay.style.display = "none";
            errorMessageDisplay.innerText = "";
        }, 5000);
        return false
    }
    return true;
}

//this function gets all the usernames that are currently in the same room
function handleUsernamesInGame(usernames) {
    usernamesInGame = usernames;
}

//after that the server side checked if the quizCode exists 
//the user will be added to the quiz if the quizcode exists
//when the quizcode doesn't exists the user will get an error message
function handleQuizCodeValidator(result) {
    if (result) {
        socket.emit('joinQuiz', quizcodeInput.value, usernameInput.value);
        init();
    } 
    else 
    {
        errorMessageBoxDisplay.innerText = "Please submit a valid quizCode!"
        errorMessageBoxDisplay.style.display = "block";
        setTimeout(function () {
            errorMessageBoxDisplay.innerText = "";
            errorMessageBoxDisplay.style.display = "none";
        }, 2500)
    }
}

//both users are now in the same room
//if the user is the host there are some options that are shown
//the host can choose the quiz subject and start the quiz
function handleInit(number, quizNames){
    const playerNumber = number;
    if (playerNumber == 1) {
        controlDisplay.style.display = "block";
        quizNamesDisplay.style.display = "block";
        if (quizNamesDisplay.getElementsByTagName('li').length === 0) {
            for (quizName in quizNames) {
                var li = document.createElement('li');

                var input = document.createElement('input');
                input.type = 'radio';
                input.id = quizNames[quizName];
                input.classList.add('quizName');
                input.classList.add('form-check-input');
                input.name = 'quizName';

                var label = document.createElement('label');
                label.htmlFor = quizNames[quizName];
                label.className = 'form-check-label';
                label.innerText = quizNames[quizName];

                quizNamesDisplay.appendChild(li);
                li.appendChild(input)
                li.appendChild(label);
            }
        }
    }
}

//when a new user joins the quiz, the chosen username will be shown on everyones screen
function handleUserJoined(clients) {
    while (usersDisplay.firstChild) {
        usersDisplay.removeChild(usersDisplay.firstChild);
    }
    for (x in clients) {
        var item = document.createElement('div');
        item.innerText = clients[x];
        item.className = 'item';
        usersDisplay.appendChild(item);
    }
}

//on the quizLobby loading screen you can copy the quizcode by clicking on it
function copyQuizcodeURL() {
    const quizCode = quizcodeDisplay.innerText;
    const url = window.location.href.split('?')[0];
    var el = document.createElement('textarea');
    //el.style.display = 'none';
    el.value = url + '?quizcode=' + quizCode;
    el.setAttribute('readonly', '');
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
}

//function for when the host clicks on the startQuizBtn
function startQuiz() {
    let selectedQuiz = undefined;
    const gameNamesEl = document.querySelectorAll('.quizName');
    gameNamesEl.forEach((gameNameEl) => {
        if (gameNameEl.checked) {
            selectedQuiz = gameNameEl.id;
        }
    })
    if(!selectedQuiz){
        selectErrorDisplay.innerText = "Please select an quiz subject!";
        selectErrorDisplay.style.color = "#b28181";
        setTimeout(function () {
            selectErrorDisplay.innerText = "";
        }, 1500)
    }
    else
    {
        socket.emit('startQuiz', usernameDisplay.innerText, selectedQuiz);
    }
}

function handleQuiz(questionData) {
    deselectAnswers();

    checkAnswerBtn.disabled = false;

    questionResultDisplay.innerText = "";

    controlDisplay.style.display = "none";
    initialScreen.style.display = "none";
    quizScreen.style.display = "none";

    quizQuestionScreenDisplay.style.display = "block";

    questionDisplay.innerText = questionData.question;
    answerAdisplay.innerText = questionData.a;
    answerBdisplay.innerText = questionData.b;
    answerCdisplay.innerText = questionData.c;
    answerDdisplay.innerText = questionData.d;

    answeredScreenDisplay.style.display = 'none';
    userAnsweredDisplay.innerHTML = '';

    userNameDisplay.innerText = usernameDisplay.innerText;
    quizCodeDisplay.innerText = quizcodeDisplay.innerText;
}

function deselectAnswers() {
    answersEl.forEach((answerEl) => {
        answerEl.checked = false;
    })
}

function checkAnswer() {
    let answer = undefined;

    answersEl.forEach((answerEl) => {
        if (answerEl.checked) {
            answer = answerEl.id;
        }
    })

    if(!answer){
        questionResultDisplay.innerText = "Please select an answer!";
        questionResultDisplay.style.color = "#b28181";
        setTimeout(function () {
            questionResultDisplay.innerText = "";
        }, 1500)
    } 
    else 
    {
        username = usernameDisplay.innerText;
        socket.emit('checkAnswer', answer, username);
    }
}

function handleQuestionResult(result) {
    checkAnswerBtn.disabled = true;
    if (result) {
        questionResultDisplay.innerText = "You answered correct!";
        questionResultDisplay.style.color = "#81b29a";
    } 
    else 
    {
        questionResultDisplay.innerText = "You answered wrong!";
        questionResultDisplay.style.color = "#b28181";
    }
}

function handleUserAnswered(username, amountAnswered, totalUsers) {
    answeredScreenDisplay.style.display = "block";
    userAnsweredDisplay.innerHTML = `${amountAnswered}/${totalUsers}`;
    if (!(username == usernameDisplay.innerText)){
        const notificationTextDisplay = document.createElement('h1');

        notificationTextDisplay.id = 'notification-text';
        notificationDisplay.style.display = 'block';
        notificationTextDisplay.innerText = username + ' has answered!';
        notificationTextDisplay.classList.remove('animation-fadein');
        notificationTextDisplay.offsetWidth;
        notificationTextDisplay.className = 'animation-fadein';

        notificationDisplay.appendChild(notificationTextDisplay);
        setTimeout(function () {
            notificationDisplay.classList.remove('animation-fadein');
            notificationDisplay.offsetWidth;
            notificationDisplay.classList.add('animation-fadeout');
        }, 6000);            
        setTimeout(function () {
            notificationTextDisplay.innerText = ''; 
            notificationDisplay.removeChild(notificationDisplay.children[0]);
        }, 10000);
    }
}

function handleQuizFinished(quizData, totalQuestions) {
    quizQuestionScreenDisplay.style.display = "none";
    quizResultsDisplay.style.display = "block";

    for (user in quizData) {
        var item = document.createElement('div');
        item.innerHTML = `${quizData[user].userName}<br>${quizData[user].correct}/${totalQuestions}`;
        item.className = 'item';
        document.getElementById('resultsDisplay').appendChild(item);
    }

    quizcodeResultsDisplay.innerText = quizcodeDisplay.innerText;
    usernameResultsDisplay.innerText = usernameDisplay.innerText;
}

function getUrlJoinCode() {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('quizcode')) {
        const quizCode = urlParams.get('quizcode');
        quizcodeInput.value = quizCode;
    }
}

getUrlJoinCode();