(function() {
    var operations = {
        '*': function(a, b) { return a * b; },
        '+': function(a, b) { return a + b; },
        '-': function(a, b) { return a - b; },
        '/': function(a, b) { return a / b; }
    };
    
    var read_operand = function(tokens) {
        var token = tokens.shift(1);
        if(token == '(') {
            var inner_result = evaluate(tokens);
            if(tokens.shift(1) != ')') {
                throw "Expected a )";
            }
            return inner_result;
        }
        var negate = 1;
        if(token == '-') {
            negate = -1;
            token = tokens.shift(1);
        }
        var number = parseInt(token) * negate;
        if(number != number) {
            throw "Expected an integer";
        }
        return number;
    }
    
    var evaluate = function(tokens) {
        if(tokens.length === 0) {
            throw "Missing an operand";
        }
        var value = read_operand(tokens);
        while(tokens.length) {
            var operator = tokens[0];
            if(operator == ')') {
                return value;
            }
            tokens.shift(1);
            var operand = read_operand(tokens);
            value = operations[operator](value, operand);
        }
        return value;
    }
    
    var calculate = function(text) {
        var pattern = /(?:[+*\/()\-]|\d+)/g;
        var tokens = text.match(pattern);
        try {
            var result = evaluate(tokens);
            if(tokens.length) {
                throw "ill-formed expression";
            }
            return String(result);
        } catch(e) {
            return e;
        }
    };
    
    var create_calculator = function(container) {
        var form = $('<form>');
        var field = $("<input type='text' size='50'>");
        var button = $("<input type='submit' value='Calculate'>");
        var output = $('<div>');
        var p = $('<p>');
        p.append(field, button);
        form.append(p, output);
        $(container).append(form);
        
        form.submit(function(e) {
            e.preventDefault();
            output.text(String(calculate(field.val())));
            return false;
        });
    }
    
    $(window).ready(function() {
        $('.calculator').each(function() {
            create_calculator(this);
        });
    });
})();
