(function() {
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
        var pattern = /(?:\*\*|<<|>>|[&|+*\/()\-,\^]|\.\d+|\d+\.\d*|\d+|\w+)/g;
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
        return [values, results];
    }

    var get_ticks = function(min, max) {
        var range = max - min;
        var p = Math.ceil(Math.log(range) / Math.log(10));
        var interval = Math.pow(10, p-1);
        if(range / interval < 5) {
            interval /= 5;
        }  if(range / interval > 10) {
            interval *= 2;
        }
        var start = min + (interval - min % interval) - interval;
        var ticks = [];
        for(var i = start; i <= max; i += interval) {
            ticks.push(i);
        }
        return ticks;
    }
    
    var create_calculator = function(container) {
        var width = 438; var height = 200;
        var display_height = height - 20; var offset = 10;
        var canvas = $('<canvas width="' + width + '" height="' + height + '">');
        var backing_store = $('<canvas width="' + width + '" height="' + height + '">');
        var range_holder = $('<div>');
        var xmin = $('<input type="text" value="0">');
        var xmax = $('<input type="text" value="2">');
        range_holder.append("x min: ", xmin, "max: ", xmax);

        var form = $('<form>');
        var field = $("<input type='text' size='50' class='calculator-expression'>");
        var button = $("<input type='submit' value='Calculate' class='btn'>");
        var output = $('<div class="calculator-result">');
        var p = $('<p>');
        var variable_holder = $('<div class="calculator-parent">');
        var variable_template = $('<div class="calculator-varholder"><input class="calculator-varname" type="text" placeholder="y"> = <input class="calculator-varval" type="number" placeholder="42">');
        var add_button = $('<button class="btn btn-small">Add variable</button>');
        p.append(field, button);
        form.append(p, range_holder, canvas);
        $(container).append(form, variable_holder, add_button);
        
        var ctx = backing_store[0].getContext('2d');
        var vctx = canvas[0].getContext('2d');

        var blit = function() {
            vctx.clearRect(0, 0, width, height);
            vctx.drawImage(backing_store[0], 0, 0);
        }

        // Retina support
        /*if(window.devicePixelRatio) {
            canvas.attr('width', width * window.devicePixelRatio);
            canvas.attr('height', height * window.devicePixelRatio);
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

            backing_store.attr('width', width * window.devicePixelRatio);
            backing_store.attr('height', height * window.devicePixelRatio);
            vctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }*/

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
                var start = evaluate(tokenise(xmin.val()), variables);
                var end = evaluate(tokenise(xmax.val()), variables);
                var step = (end - start) / width;
                var values = range_variable(field.val(), 'x', start, end, step, variables);
            } catch(e) {
                alert(e);
                return false;
            }
            var x_values = values[0];
            values = values[1];
            var max = Math.max.apply(this, values);
            var min = Math.min.apply(this, values);
            var range = max - min;
            if(range < 1) {
                min -= 0.5;
                max += 0.5;
                range += 1;
            }

            ctx.clearRect(0, 0, width, height);

            // Draw in some axes
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#222';
            // y axis
            var zero_y = -start / step;
            var real_zero_y = zero_y;
            if(zero_y < 0) zero_y = 0;
            else if(zero_y > width) zero_y = width; 
            ctx.beginPath();
            ctx.moveTo(zero_y, 0);
            ctx.lineTo(zero_y, height);
            ctx.stroke();
            // x axis
            var zero_x = Math.floor(display_height - ((0 - min) / range) * display_height) + offset;
            var real_zero_x = zero_x;
            if(zero_x > height) zero_x = height;
            else if(zero_x < 0) zero_x = 0;
            ctx.beginPath();
            ctx.moveTo(0, zero_x);
            ctx.lineTo(width, zero_x);
            ctx.stroke();

            // And some ticks
            // y-axis
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#555';
            ctx.fillStyle = '#555';
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';
            var y_ticks = get_ticks(min, max);
            var side = (zero_y > width - 20) ? -1 : 1;
            if(side < 0) {
                ctx.textAlign = 'right';
            }
            console.log(side);
            for(var i = 0; i < y_ticks.length; ++i) {
                if(Math.abs(y_ticks[i]) <= 0.0001) continue;
                var y = real_zero_x - y_ticks[i] * (display_height / range);
                ctx.beginPath();
                ctx.moveTo(zero_y + 1 * side, y);
                ctx.lineTo(zero_y + 7 * side, y);
                ctx.stroke();
                ctx.fillText(parseFloat(y_ticks[i].toPrecision(12)), zero_y + 8 * side, y);
            }
            // x-axis
            side = (zero_x < 20) ? -1 : 1;
            ctx.textBaseline = side < 0 ? 'top' : 'alphabetic';
            ctx.textAlign = 'center';
            var x_ticks = get_ticks(start, end);
            for(var i = 0; i < x_ticks.length; ++i) {
                if(Math.abs(x_ticks[i]) <= 0.0001) continue;
                var x = real_zero_y + x_ticks[i] * (width / (end-start));
                ctx.beginPath();
                ctx.moveTo(x, zero_x - 1 * side);
                ctx.lineTo(x, zero_x - 7 * side);
                ctx.stroke();
                ctx.fillText(parseFloat(x_ticks[i].toPrecision(12)), x, zero_x - 9 * side);
            }


            ctx.lineWidth = 3;
            ctx.strokeStyle = '#FA5A55';
            ctx.beginPath();
            for(var i = 0; i < values.length; ++i) {
                var x = i;
                var y = Math.floor(display_height - (((values[i]) - min) / range) * display_height) + offset;
                ctx.lineTo(x, y);
            }
            ctx.stroke();

            blit();
            return false;
        });
    };
    
    $(window).ready(function() {
        $('.calculator').each(function() {
            create_calculator(this);
        });
    });
})();
