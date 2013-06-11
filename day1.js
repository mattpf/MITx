(function() {
    var operations = {
        '*': function(a, b) { return a * b; },
        '+': function(a, b) { return a + b; },
        '-': function(a, b) { return a - b; },
        '/': function(a, b) { return a / b; },
        '^': function(a, b) { return Math.pow(a, b); }
    };
    var functions = {
        'abs': Math.abs,
        'acos': Math.acos,
        'asin': Math.asin,
        'atan': Math.atan,
        'atan2': Math.atan2,
        'ceil': Math.ceil,
        'cos': Math.cos,
        'floor': Math.floor,
        'ln': Math.log,
        'log': function(a, b) {
            if(b === undefined) return Math.log(a);
            else return Math.log(b) / Math.log(a);
        },
        'max': Math.max,
        'min': Math.min,
        'pow': Math.pow,
        'random': Math.random,
        'round': Math.round,
        'sin': Math.sin,
        'sqrt': Math.sqrt
    }
    
    var standard_variables = {
        'pi': Math.PI,
        'e': Math.E
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
            return variables[token] * negate;
        }
        // This should probably be somewhere else...
        if(functions[token]) {
            if(tokens[0] != '(') {
                throw "Expected (";
            }
            tokens.shift(1);
            var args = [evaluate(tokens, variables)];
            while(tokens) {
                if(tokens[0] != ',') break;
                tokens.shift(1);
                args.push(evaluate(tokens, variables));
            }
            if(tokens[0] != ')') {
                throw "Expected )";
            }
            tokens.shift(1);
            if(!!functions[token]) {
                return functions[token].apply(this, args) * negate;
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
            if(operator == ')' || operator == ',') {
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
            if(operator == ')' || operator == ',') {
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
    
    var tokenise = function(text) {
        var pattern = /(?:[+*\/()\-,\^]|\.\d+|\d+\.\d*|\d+|\w+)/g;
        var tokens = text.match(pattern);
        if(!tokens) tokens = [];
        return tokens;
    }
    
    var calculate = function(text, variables) {
        var tokens = tokenise(text);
        tokens = tokens.slice(0);
        var result = evaluate(tokens, variables);
        if(tokens.length) {
            throw "ill-formed expression";
        }
        return String(result);
    };
    
    var num_range = function(start, stop, step) {
        var out = [];
        for(var value = start; value <= stop; value += step) {
            out.push(value);
        }
        return out;
    };
    
    var range_variable = function(expression, variable, start, stop, step, env) {
        var tokens = tokenise(expression);
        var values = num_range(start, stop, step);
        var results = [];
        var our_env = $.extend({}, env);
        for(var i = 0; i < values.length; ++i) {
            our_env[variable] = values[i];
            var our_tokens = tokens.slice(0);
            results.push(evaluate(our_tokens, our_env));
        }
        return results;
    }
    window.range_variable = range_variable;
    
    var create_calculator = function(container) {
        var form = $('<form>');
        var field = $("<input type='text' size='50' class='calculator-expression'>");
        var button = $("<input type='submit' value='Calculate' class='btn'>");
        var output = $('<div class="calculator-result">');
        var p = $('<p>');
        var variable_holder = $('<div class="calculator-parent">');
        var variable_template = $('<div class="calculator-varholder"><input class="calculator-varname" type="text" placeholder="x"> = <input class="calculator-varval" type="number" placeholder="42">');
        var add_button = $('<button class="btn btn-small">Add variable</button>');
        p.append(field, button);
        form.append(p, output);
        $(container).append(form, variable_holder, add_button);
        
        add_button.click(function(e) {
            e.preventDefault();
            variable_holder.append(variable_template.clone());
        });
        
        form.submit(function(e) {
            e.preventDefault();
            var variables = $.extend({}, standard_variables);
            variable_holder.find('div').each(function() {
                var name = $(this).find('.calculator-varname').val();
                var value = $(this).find('.calculator-varval').val();
                if(name !== '') {
                    variables[name] = parseFloat(value);
                }
            });
            try {
                output.text(String(calculate(field.val(), variables))).removeClass('error');
            } catch(e) {
                output.text(String(e)).addClass('error');
            }
            return false;
        });
    };
    
    $(window).ready(function() {
        $('.calculator').each(function() {
            create_calculator(this);
        });
    });
})();
