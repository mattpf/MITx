var sys = require("sys");
var qs = require('querystring');
var url = require('url');
var parse = require('parse');

var questions = [
    {
        questionText: "Sam thinks \\(y=\\frac{x^2}{2}\\) is going to ____ as x goes from 1 to 10",
        options: ["increasing","decreasing","increasing then decreasing","decreasing then increasing"],
        solutionIndex: 0
    },
    {
        questionText: "Someone else thinks \\(y=\\frac{x^2}{2}\\) is going to ____ as x goes from 1 to 10",
        options: ["foo","bar","baz","spam"],
        solutionIndex: 4
    },
    {
        questionText: "Question three.",
        options: ["foo","bar","baz","spam"],
        solutionIndex: 0
    }
];

function actually_handle_the_bloody_thing(request, response, content) {
    sys.puts(url.parse(request.url).pathname );
    if(url.parse(request.url).pathname == '/response') {
        var question = questions[content.questionIndex];
        if(!question) {
            response.writeHeader(404, {"Access-Control-Allow-Origin": "*"});
            response.write(JSON.stringify({error: "File not found."}));
            response.end();
            return;
        }
        if(content.solutionIndex == question.solutionIndex) { 
            // Yay.
        }
        response.writeHeader(200, {"Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*"});
        response.write(JSON.stringify({correct: content.solutionIndex == question.solutionIndex}));
        response.end();
        return;
    }
    response.end();
}

my_http = require("http");
my_http.createServer(function(request,response){
    sys.puts("hi");
    if(request.method === "POST") {
        var data = '';
        request.on('data', function(chunk) {
            data += chunk;
        });
        request.on('end', function() {
            var content = qs.parse(data);
            actually_handle_the_bloody_thing(request, response, content);
        })
    } else {
        response.writeHeader(200, {"Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*"});
        response.end();
    }

}).listen(8080);
sys.puts("Server Running on 8080"); 
