(function() {
    var round = function(value, places) {
        return Math.round(value * Math.pow(10, places)) / Math.pow(10, places);
    }

    var add_commas = function(number, show_decimal) {
        number = String(round(number, show_decimal));
        var parts = number.split('.');
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
        return out;
    }

    var button_clicked = function() {
        var key = $(this).text();
        console.log(key);
        var calc = $(this).parents('.apple-calculator');
        var data = calc.data();
        if(/\d/.test(key)) {
            var value = data.current;
            if(!data.decimal) {
                value = value * 10 + parseInt(key);
            } else {
                value += parseInt(key) / Math.pow(10, data.decimal);
                calc.data('decimal', data.decimal + 1);
            }
            calc.data('current', value);
            calc.find('.display > div').text(add_commas(value, data.decimal));
        } else if(key == '.') {
            if(!data.decimal) {
                data.decimal = 1;
                calc.find('.display > div').text(add_commas(data.current, data.decimal));
            }
        } else if(key == "C") {

        }
    }

    $(window).ready(function() {
        $('.apple-calculator').data({memory: 0, accumulator: 0, current: 0, decimal: false, operation: null}).find('button').click(button_clicked);
    });
})();