var express = require('express');
var app = express();
var mongo = require('mongodb');
var bodyParser = require('body-parser');
var geoip = require('geoip-lite');
var path = require('path')
var fetch = require("node-fetch");


app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());


var questions = ["Банан",
    "Ботинок",
    "Яблоко",
    "Корыто",
    "Комар",
    "Конфета",
    "Сигарета",
    "Торпеда"]

var questionsTTS = ["Банан",
    "Ботинок",
    "Яблоко",
    "Корыто",
    "Комар",
    "Конфета",
    "Сигарета",
    "Торпеда"]

var answers = ["съем",
    "выброшу",
    "съем",
    "выброшу",
    "выброшу",
    "съем",
    "выброшу",
    "выброшу"]

var cards = ["Шестерка",
    "Семерка",
    "Восьмерка",
    "Девятка",
    "Десятка",
    "Валет",
    "Дама",
    "Король",
    "Туз"]
var cards_score = [6,
    7,
    8,
    9,
    10,
    2,
    3,
    4,
    1]

var cards_imgs = [457239046,
    457239047,
    457239048,
    457239049,
    457239050,
    457239051,
    457239052,
    457239053,
    457239054]


    

var maryseaSessions = {}
app.post('/api/maryseaSkill', async (req, res) => {

    var requestOut = getBaseResponseMarysea(req)
    var original_utterance = req.body.request.original_utterance.toLowerCase()
    console.log("original_utterance: " + original_utterance)
    if (maryseaSessions.hasOwnProperty(req.body.session.session_id)) {
        var sessionItem = maryseaSessions[req.body.session.session_id]
        if(sessionItem['game'] == 1){
            var isCorrectAnswer = contain(answers[sessionItem.step], original_utterance.split(" ")[0])
            console.log("sessionItem.step: " + sessionItem.step + "isCorrectAnswer: " + isCorrectAnswer)
            var sound = "<speaker audio=marusia-sounds/game-boot-1> ";
            if (isCorrectAnswer) {
                sound = "<speaker audio=marusia-sounds/game-8-bit-coin-1>";
                if(sessionItem.hasOwnProperty('category')){
                    sessionItem['category'] += 1
                }else{
                    sessionItem['category'] = 1
                }
                
            }else{
                requestOut.response = {
                    "text": questions[0],
                    "tts": "<speaker audio=marusia-sounds/game-loss-1>" + questions[0],
                    "card": {
                        "type": "BigImage",
                        "image_id": 457239038
                    },
                    "end_session": false
                }
                maryseaSessions[req.body.session.session_id] = {
                    "typeRequest": 2,
                    "step": 0
                }
                return res.send(requestOut);
                delete maryseaSessions[req.body.session.session_id]
                return res.send(requestOut);
            }
            sessionItem.step = sessionItem.step + 1

            if (sessionItem.step >= questions.length) {
                if (sessionItem.hasOwnProperty('category')) {
                    requestOut.response = {
                        "text": "Молодец, ты прошел игру!",
                        "tts": "<speaker audio=marusia-sounds/game-win-1> " + "Молодец, ты прошел игру!",
                        "commands": [{
                                "type": "BigImage",
                                "image_id": 457239029
                            },
                            {
                                "type": "MiniApp",
                                "url": "https://vk.com/app7543093"
                            },
                            {
                                "type": "Link",
                                "url": "https://vk.com/app7543093",
                                "title": "Регистрация",
                                "text": "Вездекод",
                                "image_id": 457239027
                            }
                        ],
                        "end_session": true
                    }
                } else {
                    requestOut.response = {
                        "text": "К сожалению вы не угадали.",
                        "tts": "<speaker audio=marusia-sounds/game-loss-1>  К сожалению вы не угадали.",
                        "end_session": true
                    }
                }
                delete maryseaSessions[req.body.session.session_id]
                return res.send(requestOut);
            }
            requestOut.response = {
                "text": questions[sessionItem.step],
                "tts": sound + " " + questionsTTS[sessionItem.step],
                "card": {
                    "type": "BigImage",
                    "image_id": 457239038 + sessionItem.step
                },
                "end_session": false
            }
            return res.send(requestOut);
        }else{
            var cardNumber = randomInteger(0,8)
            var card = cards[cardNumber]
            var score = cards_score[cardNumber]

            var isCorrectAnswer = contain(original_utterance.split(" ")[0],"ещ")
            console.log("sessionItem.step: " + sessionItem.step + "isCorrectAnswer: " + isCorrectAnswer)
            var sound = "<speaker audio=marusia-sounds/game-boot-1> ";

            console.log("sessionItem['category']: " + sessionItem['category'])
            if (isCorrectAnswer && sessionItem['category'] < 21) {
                sound = "<speaker audio=marusia-sounds/game-8-bit-coin-1>";
                if(sessionItem.hasOwnProperty('category')){
                    sessionItem['category'] += score
                }else{
                    sessionItem['category'] = score
                }
            }else{
                var final_text = ""
                if(sessionItem['category'] < 18){
                    final_text = "Мало очков, но спасибо за игру"
                }
                if(sessionItem['category'] > 17 && sessionItem['category'] < 21){
                    final_text = "Хороший результат, лучше синица в руках, чем журавль небе"
                }
                if(sessionItem['category'] == 21){
                    final_text = "Поздравляем ты победил"
                }
                if(sessionItem['category'] > 21){
                    final_text = "Очень жаль, ты проиграл"
                }
                requestOut.response = {
                    "text": final_text,
                    "tts": final_text,
                    "end_session": true
                }
                delete maryseaSessions[req.body.session.session_id]
                return res.send(requestOut);
            }
            sessionItem.step = sessionItem.step + 1

            

            requestOut.response = {
                
                "text": cards[cardNumber],
                "tts": cards[cardNumber],
                "card": {
                    "type": "BigImage",
                    "image_id": cards_imgs[cardNumber]
                },
                "end_session": false
            }
            return res.send(requestOut);
        }

        
    }


    if (contain(original_utterance, "везде") && (contain(original_utterance, "код") || contain(original_utterance, "кот") || contain(original_utterance, "ход"))) {
        requestOut.response = {
            "text": "Привет вездекодерам!",
            "tts": "<speaker audio=marusia-sounds/game-win-2> " + "Привет ^вездек`одерам^",
            "card": {
                "type": "BigImage",
                "image_id": 457239027
            },
            "end_session": true
        }
        delete maryseaSessions[req.body.session.session_id]
        return res.send(requestOut);
    }

    
    if (contain(original_utterance, "Играть в карты")) {
        var cardNumber = randomInteger(0,8)
        requestOut.response = {
            
            "text": "Сейчас будем играть в игру двадцть одно. " + cards[cardNumber],
            "tts": "Сейчас будем играть в игру двадцть одно. " + cards[cardNumber],
            "card": {
                "type": "BigImage",
                "image_id": cards_imgs[cardNumber]
            },
            "end_session": false
        }
        maryseaSessions[req.body.session.session_id] = {
            "typeRequest": 2,
            "step": 0,
            "category": cards_score[cardNumber],
            "game":0
        }
        return res.send(requestOut);
    }
    if (contain(original_utterance, "начать")) {
        requestOut.response = {
            "text": questions[0],
            "tts": questions[0],
            "card": {
                "type": "BigImage",
                "image_id": 457239038
            },
            "end_session": false
        }
        maryseaSessions[req.body.session.session_id] = {
            "typeRequest": 2,
            "step": 0,
            "game":1
        }
        return res.send(requestOut);
    }

    requestOut.response = {
        "text": "Запрос не определен =(",
        "tts": "<speaker audio=marusia-sounds/animals-owl-1> " + "Запрос не определен",
        "card": {
            "type": "BigImage",
            "image_id": 457239025
        },
        "end_session": true
    }
    delete maryseaSessions[req.body.session.session_id]
    return res.send(requestOut);
});

function getBaseResponseMarysea(req) {
    return {
        "session": {
            "session_id": req.body.session.session_id,
            "user_id": req.body.session.user_id,
            "skill_id": req.body.session.skill_id,
            "new": false,
            "message_id": req.body.session.message_id,
            "user": {
                "user_id": req.body.session.user_id
            },
            "application": {
                "application_id": req.body.session.application.application_id,
                "application_type": req.body.session.application.application_type
            }
        },
        "version": req.body.version
    }
}

function contain(text, pattern) {
    if (text.toLowerCase().indexOf(pattern.toLowerCase()) == -1) {
        return false
    } else {
        return true
    }
}
