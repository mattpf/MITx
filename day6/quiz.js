var USE_PARSE = true;

var quiz = (function() {
    var exports = {};

    var questions = [
        {
            questionText: "Sam thinks \\(y=\\frac{x^2}{2}\\) is going to ____ as x goes from 1 to 10",
            options: ["increasing","decreasing","increasing then decreasing","decreasing then increasing"]
        },
        {
            questionText: "Which of the following is a reserved word in JavaScript?",
            options: ["class","export","static","protected","all of the above"]
        },
        {
            questionText: "what?",
            options: ["foo","bar","baz","spam"]
        }
    ];
    var solutions = {};
    var answers = {};
    var questionIndex = 0;
    var score = 0;
    var storage = null;

    var scoreHolder, promptHolder, optionHolder, checkButton, nextButton, contentHolder, loadingHolder;

    var commitStorage = function() {
        if(USE_PARSE) {
            storage.save(null, { 
                success: function(s) {
                    storage = s;
                    console.log("Stored with ID " + storage.id);
                    localStorage['quiz-parse-id'] = storage.id;
                }, 
                error: function(s, error) {
                    alert("Storage failed: " + error.description);
                }
            });
        }
    }

    var undisable = function() {
        contentHolder.find('input, button').removeAttr('disabled');
        optionHolder.find('input:radio').attr('disabled', 'disabled');
        checkButton.attr('disabled', 'disabled');
        if(questionIndex >= questions.length - 1) {
            nextButton.attr('disabled','disabled');
        }
    }

    var checkAnswer = function() {
        var radio = optionHolder.find('input:radio:checked');
        var choice = parseInt(radio.val());
        contentHolder.find('input, button').attr('disabled','disabled');
        $.post("http://localhost:8080/response", {solutionIndex: choice, questionIndex: questionIndex}).done(function(response) {
            var correct = response.correct;
            if(correct) {
                radio.parent().append('<span class="result correct">&#x2714;</span>');
                incrementScore();
            } else {
                radio.parent().append('<span class="result wrong">&#x2718;</span>');
            }
            undisable();
        }).error(function(msg) {
            alert("Something broke.");
            undisable();
        });


    }
    exports.checkAnswer = checkAnswer;

    var displayQuestion = function() {
        var question = questions[questionIndex];
        promptHolder.text(question.questionText);
        optionHolder.html('');
        nextButton.attr('disabled', 'disabled');
        checkButton.removeAttr('disabled');
        $.each(question.options, function(index, value) {
            var option = $('<li>');
            var option_id =  'option-' + questionIndex + '-' + index;
            var name = 'quiz-options-' + questionIndex;
            var radio = $('<input>', {type: 'radio', value: index, id: option_id, name: name});
            option.append(radio, $('<label>', {'for': option_id}).text(value));
            optionHolder.append(option);
        });
        MathJax.Hub.Queue(["Typeset",MathJax.Hub, promptHolder[0]]);
        contentHolder.show();
        loadingHolder.hide();
        scoreHolder.text(score);
    }
    exports.displayQuestion = displayQuestion;

    var incrementScore = function() {
        score++;
        scoreHolder.text(score);
        storage.setItem('quizScore', score);
        commitStorage();
    }
    exports.incrementScore = incrementScore;

    var nextQuestion = function() {
        if(questionIndex < questions.length-1) ++questionIndex;
        displayQuestion();
        storage.setItem('quizQuestionIndex', questionIndex);
        commitStorage();
    }

    var restoreState = function() {
        if(storage.getItem('quizScore') !== null) {
            score = storage.getItem('quizScore');
        }

        if(storage.getItem('quizQuestionIndex') !== null) {
            questionIndex = storage.getItem('quizQuestionIndex');
        }
        console.log(score, questionIndex);
        displayQuestion();
    }

    var setup = function() {
        $('.quiz').each(function() {
            $(this).html(
                "<div class='content' style='display: none;'>" + 
                    "<div class='score'>Quiz score: <span class='score-value'>0</span></div>" +
                    "<div class='question'>" +
                        "<div class='prompt'></div>" +
                        "<ul class='options'></ul>" +
                    "</div>" +
                    "<div class='controls'>" +
                        "<button class='check'>Check</button>" + 
                        "<button class='next' disabled>Next &raquo;</button>" +
                    "</div>" +
                "</div>" +
                "<div class='loading'>" +
                    "Loading..." +
                "</div>"
            );
            contentHolder = $(this).find('.content');
            loadingHolder = $(this).find('.loading');
            scoreHolder = $(this).find('.score-value');
            promptHolder = $(this).find('.prompt');
            optionHolder = $(this).find('.options');
            checkButton = $(this).find('.check');
            nextButton = $(this).find('.next');
            checkButton.click(checkAnswer);
            nextButton.click(nextQuestion);
        });

        storage = localStorage;
        if(USE_PARSE) {
            // Create a QuizState object that shares the same interface as localStorage.
            var QuizState = Parse.Object.extend('QuizState', {
                setItem: function(key, value) {
                    this.set(key, value);
                },
                getItem: function(key) {
                    if(this.get(key) === undefined) return null;
                    else return this.get(key);
                }
            });
            if(localStorage['quiz-parse-id'] !== undefined) {
                (new Parse.Query(QuizState)).get(localStorage['quiz-parse-id'], {
                    success: function(s) {
                        storage = s;
                        restoreState();
                    },
                    error: function(s, error) {
                        console.log("Failed to restore state: " + error.description);
                        storage = new QuizState();
                        restoreState();
                    }
                });
            } else {
                storage = new QuizState();
                restoreState();
            }
        } else {
            restoreState();
        }
        //displayQuestion();
    }
    exports.setup = setup;

    return exports;
})();

$(function() {
    Parse.initialize("bGAeOhwIfyXS8K2GyXzYvLvjHS93XtSlANL2YRZw", "uT5R9mjNuqsYoqOA4oly5LWtuURVkovKaokb6iv2");
    quiz.setup();
/*
    $.ajax({
        url: "http://localhost:8080/",
        data: {id: 10}
    }).done(function(msg) {
        console.log(msg);
    });*/
});
