(function() {
    var calculate = function() {
        var input = $('#text1');
        var val = input.val();
        $('#output').text(val);
    }
    
    $(window).ready(function() {
        $('#calculate').click(calculate);
    });
})();
