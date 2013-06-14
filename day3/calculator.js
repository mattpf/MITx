var Calculator = (function() {
    // Calculator operation functions.
    var operations = {
        '*': function(a, b) { return a * b; },
        '+': function(a, b) { return a + b; },
        '-': function(a, b) { return a - b; },
        '/': function(a, b) { return a / b; },
        '**': function(a, b) { return Math.pow(a, b); },
        '>>': function(a, b) { return a >> b; },
        '<<': function(a, b) { return a << b; },
        '&': function(a, b) { return a & b; },
        '|': function(a, b) { return a | b; },
        '^': function(a, b) { return a ^ b; }
    };
    // Calculator functions.
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
        'sqrt': Math.sqrt,
        'tan': Math.tan
    }
    
    // Standard constants for the calculator
    var standard_variables = {
        'pi': Math.PI,
        'e': Math.E
    }
    
    /*
     * Reads an operand from the calculator.
     * This could be a numeric literal, a parenthesised expression,
     * or a function call. Throws an exception if it finds none of the above.
     *
     * tokens: token list
     * variables: mapping of array names to values
     * returns: a number holding the value of the operand.
     */
    var read_operand = function(tokens, variables) {
        var token = tokens.shift(1);
        // Handle parenthsised expressions by evaluating the sub-expression;
        // we'll get back here with a parenthesis still in the buffer if the
        // expression is well-formed.
        if(token == '(') {
            var inner_result = evaluate(tokens, variables);
            if(tokens.shift(1) != ')') {
                throw "Expected a )";
            }
            return inner_result;
        }
        // If our token is a minus sign, remove it, grab the next token, and note
        // that we should have a negated result.
        var negate = 1;
        if(token == '-') {
            negate = -1;
            token = tokens.shift(1);
        }

        // If we have a known variable name, return that value.
        if(variables[token] !== undefined) {
            return variables[token] * negate;
        }
        // If we have an existing function, evaluate it. This should involve a
        // sub-expression similar to those handled above, which is evaluated
        // recursively.
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
        // If nothing interesting is happening, we should just have a number.
        // If we don't even have one of those, error out.
        var number = parseFloat(token) * negate;
        if(number != number) {
            throw "Unknown function or variable name '" + token + "'";
        }
        return number;
    }
    
    /*
     * This is intended only to be called by the 'evaluate' function, and exists
     * to handle order of operations.
     * Reads a term in the expression. That is, any non-addition/subtraction operation.
     * If we run into addition or subtraction, we fall back to our caller.
     *
     * tokens: token list
     * variables: mapping of variable names to values.
     * returns evaluated value of term.
     */
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
    
    /*
     * Main evaluation function. Call this to evaluate an expression.
     *
     * tokens: list of tokens
     * variables: mapping of variable names to values.
     * returns value of expression encoded in tokens.
     */
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
    
    /*
     * Converts a string expression to a list of tokens.
     * 
     * text: expression string
     * returns list of tokens
     */
    var tokenise = function(text) {
        var pattern = /(?:\*\*|<<|>>|[&|+*\/()\-,\^]|\.\d+|\d+\.\d*|\d+|\w+)/g;
        var tokens = text.match(pattern);
        if(!tokens) tokens = [];
        return tokens;
    }
    
    /*
     * Calculates the value of the given expression.
     *
     * text: expression
     * variables: mapping of variable names to values
     */
    var calculate = function(text, variables) {
        var tokens = tokenise(text);
        var all_variables = $.extend({}, variables, standard_variables);
        var result = evaluate(tokens, all_variables);
        if(tokens.length) {
            throw "ill-formed expression";
        }
        return result;
    };
    
    /*
     * Returns a list of every step numbers between start and stop.
     */
    var num_range = function(start, stop, step) {
        var out = [];
        for(var value = start; value <= stop; value += step) {
            out.push(value);
        }
        return out;
    };
    
    /*
     * Calculates a the result of an expression, ranging the given variable over the
     * given range, using constants from env.
     *
     * expression: the expression to evaluate as a string
     * variable: the name of the variable to range as a string
     * start: the number at which to start the range
     * stop: the number at which to end the range.
     * step: the numeric step at which to test each entry.
     * env: a mapping of non-varying variable names to values.
     */
    var range_variable = function(expression, variable, start, stop, step, env) {
        var tokens = tokenise(expression);
        var values = num_range(start, stop, step);
        var results = [];
        var our_env = $.extend({}, env, standard_variables);
        for(var i = 0; i < values.length; ++i) {
            our_env[variable] = values[i];
            var our_tokens = tokens.slice(0);
            results.push(evaluate(our_tokens, our_env));
        }
        return [values, results];
    }

    return {
        Calculate: calculate,
        Range: range_variable
    }
})();
