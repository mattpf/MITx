(function() {

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

    var truncate_float_error = function(value) {
        return parseFloat(value.toPrecision(12));
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
        var range_holder = $('<div class="range">');
        var xmin = $('<input type="text" value="0">');
        var xmax = $('<input type="text" value="2">');
        range_holder.append($('<div class="control">').append('x min: ', xmin),  $('<div class="control">').append("x max: ", xmax));

        var form = $('<form>');
        var field = $("<input type='text' size='50' class='calculator-expression'>");
        var button = $("<input type='submit' value='Calculate' class='btn'>");
        var output = $('<div class="calculator-result">');
        var p = $('<p>');
        var variable_holder = $('<div class="calculator-parent">');
        var variable_template = $('<div class="calculator-varholder"><input class="calculator-varname" type="text" placeholder="y"> = <input class="calculator-varval" type="number" placeholder="42">');
        var add_button = $('<button class="btn btn-small">Add constant</button>');
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
        var x_values, y_values, max, min, range, end, start, step;
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
            var x_screen = (-start/step) + x_graph * (width / (end-start));
            return {x: x_screen, y: y_screen};
        }
        
        // The magical calculation thing.
        form.submit(function(e) {
            e.preventDefault(); // Don't actually submit the form.
            var variables = {};
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
                start = Calculator.Calculate(xmin.val(), variables);
                end = Calculator.Calculate(xmax.val(), variables);
                step = (end - start) / width;
                values = Calculator.Range(field.val(), 'x', start, end, step, variables);
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

            var zero = graph_to_screen(0, 0);
            // y axis
            var zero_y = zero.x;
            // Make sure we don't fall off the edges.
            if(zero_y < 0) zero_y = 0;
            else if(zero_y > width) zero_y = width; 
            ctx.beginPath();
            ctx.moveTo(zero_y, 0);
            ctx.lineTo(zero_y, height);
            ctx.stroke();
            // x axis
            var zero_x = zero.y;
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
                var tick_pos = graph_to_screen(0, y_ticks[i]);
                ctx.beginPath();
                ctx.moveTo(zero_y + 1 * side, tick_pos.y);
                ctx.lineTo(zero_y + 7 * side, tick_pos.y);
                ctx.stroke();
                ctx.fillText(truncate_float_error(y_ticks[i]), zero_y + 8 * side, tick_pos.y);
            }
            // x-axis
            side = (zero_x < 20) ? -1 : 1;
            ctx.textBaseline = side < 0 ? 'top' : 'alphabetic';
            ctx.textAlign = 'center';
            var x_ticks = get_ticks(start, end);
            // Draw the ticks.
            for(var i = 0; i < x_ticks.length; ++i) {
                if(Math.abs(x_ticks[i]) <= MINIMUM_PRECISION) continue;
                var tick_pos = graph_to_screen(x_ticks[i], 0);
                ctx.beginPath();
                ctx.moveTo(tick_pos.x, zero_x - 1 * side);
                ctx.lineTo(tick_pos.x, zero_x - 7 * side);
                ctx.stroke();
                ctx.fillText(truncate_float_error(x_ticks[i]), tick_pos.x, zero_x - 9 * side);
            }

            // Draw the graph line.
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#FA5A55';
            ctx.beginPath();
            for(var i = 0; i < y_values.length; ++i) {
                var point = graph_to_screen(x_values[i], y_values[i]);
                ctx.lineTo(point.x, point.y);
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
            // and add little circles at each end.
            if(dragging) {
                // Range box
                vctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                vctx.fillRect(drag_start.x, 0, m.x - drag_start.x, height);
                var start_y = y_values[Math.round(drag_start.x)];
                var start_x = x_values[Math.round(drag_start.x)];
                var screen = graph_to_screen(start_x, start_y);

                vctx.fillStyle = 'black';

                // Start text circle
                vctx.beginPath();
                vctx.arc(screen.x, screen.y,5,0,2*Math.PI);
                vctx.fill();
                vctx.textAlign = 'right';
                vctx.fillText(start_x.toPrecision(3)+", "+start_y.toPrecision(3),screen.x-4,screen.y-4);

                // End text circle
                vctx.beginPath();
                vctx.arc(sx, sy,5,0,2*Math.PI);
                vctx.fill();
                vctx.textAlign = 'left';
                vctx.fillText(gx.toPrecision(3)+", "+gy.toPrecision(3),sx+4,sy-4);

                // Centred label thing
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
