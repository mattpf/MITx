(function() {
    var OPERATION_DIVIDE = '÷';
    var OPERATION_MULTIPLY = '×';
    var OPERATION_ADD = '+';
    var OPERATION_SUBTRACT = '−';

    var operations = {
        '÷': function(a, b) { return a / b; },
        '+': function(a, b) { return a + b; },
        '−': function(a, b) { return a - b; },
        '×': function(a, b) { return a * b; }
    }

    var round = function(value, places) {
        if(places)
            return Math.round(value * Math.pow(10, places)) / Math.pow(10, places);
        else
            return value;
    }

    var add_commas = function(number, show_decimal) {
        var is_negative = number < 0;
        number = String(round(number, show_decimal));
        var parts = number.split('.');
        if(is_negative) parts[0] = parts[0].substring(1);
        var out = '';
        for(var i = 0; i < parts[0].length; ++i) {
            out += parts[0][i];
            if((parts[0].length - i - 1) % 3 == 0 && i != parts[0].length - 1){
                out += ',';
            }
        }
        if(parts.length > 1) {
            out += "." + parts[1];
        } else if(show_decimal) {
            out += ".";
        }
        if(is_negative) out = '-' + out;
        return out;
    }

    var do_calculation = function(calc) {
        var data = calc.data();
        var current_result = data.current;
        if(data.accumulator !== null) {
            // Perform the pending operation
            console.log("Calculating " + data.accumulator + " " + data.operation + " " + current_result);
            current_result = operations[data.operation](data.accumulator, current_result);
            calc.data('accumulator', current_result);
        }
        calc.data('operation', null);
        calc.data('accumulator', current_result);
        calc.data('current', null);
        calc.data('decimal', false);
        calc.find('.display > .value').text(add_commas(current_result));
    }

    var button_clicked = function() {
        var key = $(this).text();
        console.log(key);
        var calc = $(this).parents('.apple-calculator');
        var display = calc.find('.display > .value');
        var data = calc.data();
        if(/\d/.test(key)) { // Check for digits.
            var value = data.current;
            if(!value) value = 0;
            if(!data.decimal) {
                value = value * 10 + parseInt(key);
            } else {
                value += parseInt(key) / Math.pow(10, data.decimal);
                calc.data('decimal', data.decimal + 1);
            }
            calc.data('current', value);
            display.text(add_commas(value, data.decimal));
        } else if(key == '.') {
            if(!data.decimal) {
                data.decimal = 1;
                display.text(add_commas(data.current, data.decimal));
            }
        } else if(key == "C") {
            calc.data({accumulator: null, current: null, decimal: false, operation: null})
            display.text('0');
        } else if(key == "±") {
            var value = data.current;
            if(value === null) {
                value = data.accumulator;
                calc.data('accumulator', -value);
            } else {
                calc.data('current', -value);
            }
            display.text(add_commas(-value, data.decimal));
        } else if(/^[+−÷×]$/.test(key)) {
            var operation = key;
            console.log("current: " + data.current);
            if(data.current === null) {
                calc.data('operation', operation);
                calc.find('.display .operation').text(operation);
                return;
            }
            do_calculation(calc);
            calc.find('.display .operation').text(operation);
            calc.data('operation', operation);
        } else if(key == '=') {
            calc.find('.display .operation').text('');
            do_calculation(calc);
        } else if(key == 'MC') {
            calc.data('memory', 0);
            calc.find('.display .mem').css('display', 'none');
        } else if(key == 'M+') {
            calc.data('memory', data.memory + (data.current === null ? data.accumulator : data.current));
            calc.find('.display .mem').css('display', 'block');
        } else if(key == 'M-') {
            calc.data('memory', data.memory - (data.current === null ? data.accumulator : data.current));
            calc.find('.display .mem').css('display', 'block');
        } else if(key == 'MR') {
            calc.data('current', data.memory);
            display.text(add_commas(data.memory));
        }
    }

    $(window).ready(function() {
        $('.apple-calculator').data({memory: 0, accumulator: null, current: null, decimal: false, operation: null}).find('button').click(button_clicked);
    });
})();