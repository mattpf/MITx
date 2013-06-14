(function() {
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
        var result = evaluate(tokens, variables);
        if(tokens.length) {
            throw "ill-formed expression";
        }
        return String(result);
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
        var our_env = $.extend({}, env);
        for(var i = 0; i < values.length; ++i) {
            our_env[variable] = values[i];
            var our_tokens = tokens.slice(0);
            results.push(evaluate(our_tokens, our_env));
        }
        return [values, results];
    }

    // A value to consider to be zero.
    var MINIMUM_PRECISION = 1e-10;

    /*
     * Returns the values at which to include ticks, if the axis ranges from min to max.
     *
     * min: the minimum value on the axis
     * max: the maximum value on the axis
     */
    var get_ticks = function(min, max) {
        var range = max - min;
        var p = Math.ceil(Math.log(range) / Math.log(10)); // log(range) base 10
        var interval = Math.pow(10, p-1);
        // Change the interval to have an appropriate number of ticks (≥ 5, ≤ 10)
        if(range / interval < 5) {
            interval /= 5;
        }  if(range / interval > 10) {
            interval *= 2;
        }
        var start = min + (interval - min % interval) - interval; // One tick before the start point
        var ticks = [];
        for(var i = start; i <= max; i += interval) {
            ticks.push(i);
        }
        return ticks;
    }

    var label_div = $('<div class="crosshair-label">').hide();
    /*
     * Show the crosshair label at some canvas position (sx, sy) display some graph values (gx, gy)
     */
    var show_label = function(sx, sy, gx, gy) {
        label_div.show();
        if(Math.abs(gx) < MINIMUM_PRECISION) gx = 0;
        if(Math.abs(gy) < MINIMUM_PRECISION) gy = 0;
        label_div.css({top: sy - 30, left: sx + 10}).text(gx.toPrecision(3) + ", " + gy.toPrecision(3));
    }

    /*
     * Hide the crosshair label.
     */
    var hide_label = function() {
        label_div.hide();
    }
    
    /*
     * Creates a calculator inside the given container.
     *
     * container: an HTML element node in which to create a calculator.
     */
    var create_calculator = function(container) {
        var width = 438; var height = 300; // Dimensions of the calculator (fixed)
        var display_height = height - 20; var offset = 10; // Space to leave at the top and bottom of the graph.

        // Build up the UI.
        var canvas_holder = $('<div style="position: relative;">');
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
        var add_button = $('<button class="btn btn-small">Add static variable</button>');
        p.append(field, button);
        canvas_holder.append(canvas, label_div);
        form.append(p, range_holder, canvas_holder);
        $(container).append(form, variable_holder, add_button);
        
        var ctx = backing_store[0].getContext('2d'); //< Context for draing the graph into; hidden.
        var vctx = canvas[0].getContext('2d'); //< Context for drawing the overlay into; displayed.

        /*
         * Copies the graph context into the display context.
         */
        var blit = function() {
            vctx.clearRect(0, 0, width, height);
            vctx.drawImage(backing_store[0], 0, 0);
        }

        // Create a new 'constant' variable holder when clicked by cloning the template.
        add_button.click(function(e) {
            e.preventDefault();
            variable_holder.append(variable_template.clone());
        });

        // These values are needed by all of the below.
        var x_values, y_values, max, min, range, real_zero_y, real_zero_x, end, start;
        var has_graph = false;

        /*
         * Given coordinates in the graph space, returns pixel coordinates in canvas space.
         *
         * x_graph: Graph x coordinate
         * y_graph: Graph y coordinate
         *
         * returns an object {x: x screen coord, y: y screen coord}
         */
        var graph_to_screen = function(x_graph, y_graph) {
            var y_screen = Math.floor(display_height - (((y_graph) - min) / range) * display_height) + offset;
            var x_screen = real_zero_y + x_graph * (width / (end-start));
            return {x: x_screen, y: y_screen};
        }
        
        // The magical calculation thing.
        form.submit(function(e) {
            e.preventDefault(); // Don't actually submit the form.
            var variables = $.extend({}, standard_variables); // Fill in our standard constants (e.g. π)
            // For each of the user-defined constants, fill in the value given.
            variable_holder.find('div').each(function() {
                var name = $(this).find('.calculator-varname').val();
                var value = $(this).find('.calculator-varval').val();
                if(name !== '') {
                    variables[name] = parseFloat(value);
                }
            });
            // Try evaluating the three expressions we have (min, max, and the expression to graph).
            var values;
            try {
                start = evaluate(tokenise(xmin.val()), variables);
                end = evaluate(tokenise(xmax.val()), variables);
                var step = (end - start) / width;
                values = range_variable(field.val(), 'x', start, end, step, variables);
            } catch(e) {
                alert(e); // TODO: prettify.
                return false;
            }
            has_graph = true;
            x_values = values[0];
            y_values = values[1];
            max = Math.max.apply(this, y_values);
            min = Math.min.apply(this, y_values);
            range = max - min;
            // Make sure we don't have zero-range (which wouldn't display nicely).
            if(range < MINIMUM_PRECISION) {
                max += MINIMUM_PRECISION;
                range += MINIMUM_PRECISION;
            }

            // Wipe our context for drawing.
            ctx.clearRect(0, 0, width, height);

            // Draw in some axes
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#222';
            // y axis
            var zero_y = -start / step;
            real_zero_y = zero_y;
            // Make sure we don't fall off the edges.
            if(zero_y < 0) zero_y = 0;
            else if(zero_y > width) zero_y = width; 
            ctx.beginPath();
            ctx.moveTo(zero_y, 0);
            ctx.lineTo(zero_y, height);
            ctx.stroke();
            // x axis
            var zero_x = Math.floor(display_height - ((0 - min) / range) * display_height) + offset;
            real_zero_x = zero_x;
            // Make sure we don't fall off the edges.
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

            // Actually draw the ticks.
            for(var i = 0; i < y_ticks.length; ++i) {
                if(Math.abs(y_ticks[i]) <= MINIMUM_PRECISION) continue;
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
            // Draw the ticks.
            for(var i = 0; i < x_ticks.length; ++i) {
                if(Math.abs(x_ticks[i]) <= MINIMUM_PRECISION) continue;
                var x = real_zero_y + x_ticks[i] * (width / (end-start));
                ctx.beginPath();
                ctx.moveTo(x, zero_x - 1 * side);
                ctx.lineTo(x, zero_x - 7 * side);
                ctx.stroke();
                ctx.fillText(parseFloat(x_ticks[i].toPrecision(12)), x, zero_x - 9 * side);
            }

            // Draw the graph line.
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#FA5A55';
            ctx.beginPath();
            for(var i = 0; i < y_values.length; ++i) {
                var x = i;
                var y = Math.floor(display_height - (((y_values[i]) - min) / range) * display_height) + offset;
                ctx.lineTo(x, y);
            }
            ctx.stroke();

            blit();
            return false;
        });

        // Graph dragging state.
        var dragging = false;
        var drag_start = null;

        var get_mouse_coords = function(e) {
            var offset = canvas.offset();
            return {
                x: Math.round(event.pageX - offset.left),
                y: Math.round(event.pageY - offset.top)
            };
        }

        canvas.on('mousemove', function(e) {
            if(!has_graph) return; // Drawing crosshairs with no graph is bad.
            blit(); // Erase existing crosshair overlay.
            var m = get_mouse_coords(e);

            // Find our graph coordinates that we're vertically positioned over.
            var value_index = Math.round(m.x);
            var gx = x_values[value_index];
            var gy = y_values[value_index];
            // And the screen coordinates for those graph coordinates.
            var screen_coords = graph_to_screen(gx, gy);
            var sx = screen_coords.x;
            var sy = screen_coords.y;

            // If we're dragging, draw a box between the start and current positions,
            // and drag the 
            if(dragging) {
                vctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                vctx.fillRect(drag_start.x, 0, m.x - drag_start.x, height);
                var start_y = y_values[Math.round(drag_start.x)];
                var start_x = x_values[Math.round(drag_start.x)];
                var screen = graph_to_screen(start_x, start_y);

                vctx.fillStyle = 'black';

                vctx.beginPath();
                vctx.arc(screen.x, screen.y,5,0,2*Math.PI);
                vctx.fill();
                vctx.fillStyle = 'black';
                vctx.textAlign = 'right';
                vctx.fillText(start_x.toPrecision(3)+", "+start_y.toPrecision(3),screen.x-4,screen.y-4);

                vctx.beginPath();
                vctx.arc(sx, sy,5,0,2*Math.PI);
                vctx.fill();

                vctx.fillStyle = 'black';
                vctx.textAlign = 'left';
                vctx.fillText(gx.toPrecision(3)+", "+gy.toPrecision(3),sx+4,sy-4);


                vctx.fillStyle = 'black';
                vctx.textAlign = 'center';
                vctx.save();
                vctx.font = "20px Helvetica";
                vctx.fillText((gy - start_y).toPrecision(3),(sx + screen.x)/2,20);
                vctx.restore();

            } else {
                vctx.lineWidth = 1;
                vctx.strokeStyle = '#aaa';
                vctx.beginPath();
                vctx.moveTo(0,sy); vctx.lineTo(width,sy);
                vctx.moveTo(sx,0); vctx.lineTo(sx,height);
                vctx.stroke();

                show_label(sx, sy, gx, gy);
            }
        });

        // Prepare for dragging by stashing where we started and removing the crosshair label.
        canvas.on('mousedown', function(e) {
            e.preventDefault();
            dragging = true;
            hide_label();
            var m = get_mouse_coords(e);
            drag_start = {x: m.x, y: m.y};
        });

        // Stop dragging.
        canvas.on('mouseup', function(e) {
            dragging = false;
        });

        // Hide the label and clear the crosshairs when the mouse leaves.
        canvas.on('mouseout', function(e) {
            hide_label();
            blit();
        })
    };
    
    // Go!
    $(function() {
        $('.calculator').each(function() {
            create_calculator(this);
        });
    });
})();
