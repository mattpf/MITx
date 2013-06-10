(function() {
    var operations = {
        '*': function(a, b) { return a * b; },
        '+': function(a, b) { return a + b; },
        '-': function(a, b) { return a - b; },
        '/': function(a, b) { return a / b; }
    };
    var functions = {
        'sin': Math.sin,
        'cos': Math.cos,
        'tan': Math.tan,
        'sqrt': Math.sqrt
    }
    
    var read_operand = function(tokens, variables) {
        var token = tokens.shift(1);
        if(token == '(') {
            var inner_result = evaluate(tokens, variables);
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
        if(variables[token] !== undefined) {
            return variables[token];
        }
        // This should probably be somewhere else...
        if(functions[token]) {
            var func_inner = read_operand(tokens, variables);
            if(!!functions[token]) {
                return functions[token](func_inner);
            }
        }
        var number = parseFloat(token) * negate;
        if(number != number) {
            throw "Unknown function or variable name '" + token + "'";
        }
        return number;
    }
    
    var read_term = function(tokens, variables) {
        var value = read_operand(tokens, variables);
        while(tokens.length) {
            var operator = tokens[0];
            if(operator == ')') {
                return value;
            }
            if(operator == '-' || operator == '+') {
                return value;
            }
            tokens.shift(1);
            var operand = read_operand(tokens, variables);
            if(!operations[operator]) {
                throw "Unknown operator " + operator;
            }
            value = operations[operator](value, operand);
        }
        return value;
    }
    
    var evaluate = function(tokens, variables) {
        if(tokens.length === 0) {
            throw "Missing an operand";
        }
        var value = read_term(tokens, variables);
        while(tokens.length) {
            var operator = tokens[0];
            if(operator == ')') {
                return value;
            }
            tokens.shift(1);
            var operand = read_term(tokens, variables);
            if(!operations[operator]) {
                throw "Unknown operator " + operator;
            }
            value = operations[operator](value, operand);
        }
        return value;
    }
    
    var calculate = function(text, variables) {
        var pattern = /(?:[+*\/()\-]|\.\d+|\d+\.\d*|\d+|\w+)/g;
        var tokens = text.match(pattern);
        try {
            var result = evaluate(tokens, variables);
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
        var variable_holder = $('<div>');
        var variable_template = $('<div><input class="calculator-varname"> = <input class="calculator-varval">');
        var add_button = $('<button>Add variable</button>');
        p.append(field, button);
        form.append(p, output, variable_holder, add_button);
        $(container).append(form);
        
        add_button.click(function(e) {
            e.preventDefault();
            variable_holder.append(variable_template.clone());
        });
        
        form.submit(function(e) {
            e.preventDefault();
            var variables = {};
            variable_holder.find('div').each(function() {
                var name = $(this).find('.calculator-varname').val();
                var value = $(this).find('.calculator-varval').val();
                if(name !== '') {
                    variables[name] = parseFloat(value);
                }
            });
            output.text(String(calculate(field.val(), variables)));
            return false;
        });
    };
    
    $(window).ready(function() {
        $('.calculator').each(function() {
            create_calculator(this);
        });
    });
})();
