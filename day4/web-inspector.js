/**
 * A simple web inspector.
 *
 * Intended to be a singleton: this only exists once per page, so it
 * attaches itself to the BODY element.
 */
var Inspector = function($) {
  exports = {};

  // The root element of the inspector.
  var root = null;
  // The other elements of the inspector
  var tray = null;
  var text_editor = null;
  var property_editor = null;
  var node_lookup = null;
  var node_selector = null;
  var nth_node = null;
  var lookup_btn = null;
  var property_list = null;
  var handle = null;

  /*
   * Animate in/out.
   */
  var is_shown = true;
  var toggle_inspector = function() {
    if(is_shown)
      root.animate({'top': '-300px'});
    else
      root.animate({'top': '0px'});
    is_shown = !is_shown;
  }

  /*
   * Find and display the node
   */
  var displayed_node = null;
  var find_node = function() {
    var selector = node_selector.val();
    var n = parseInt(nth_node.val()) || 0;
    try {
      var node = $(selector).eq(n);
    } catch(e) {
      // Ignore invalid CSS errors.
      displayed_node = null;
      return;
    }
    display_node(node);
  }

  /*
   * Display the node
   */
  var display_node = function(node) {
    displayed_node = node;
    text_editor.val(displayed_node.html());
    display_property_list();
  }

  /*
   * Update the chosen node to match our content.
   */
  var update_node = function(e) {
    if(!displayed_node) return;
    // BUG: Overwriting the entire body kills ourselves.
    displayed_node.html(text_editor.val());
  }

  var hover_node = $('<div style="pointer-events: none; position: absolute; z-index: 2000; border: 5px solid red;">');

  var handle_point_enter = function(e) {
    //$(e.target).data('inspector-old-border', $(e.target).css('border')).css('border', '5px solid red');
    var offset = $(e.target).offset();
    hover_node.css({
      top: offset.top,
      left: offset.left,
      height: $(e.target).height() - 10 + parseInt($(e.target).css('border-top')) + parseInt($(e.target).css('border-bottom')) + parseInt($(e.target).css('padding-bottom')) + parseInt($(e.target).css('padding-top')),
      width: $(e.target).width() - 10 + parseInt($(e.target).css('border-left')) + parseInt($(e.target).css('border-right')) + parseInt($(e.target).css('padding-left')) + parseInt($(e.target).css('padding-right'))
    }).appendTo($('body'));
    e.stopPropagation();
  }

  var handle_point_exit = function(e) {
    //$(e.target).css('border', $(e.target).data('inspector-old-border'))
    hover_node.remove();
  }

  var handle_point_click = function(e) {
    e.preventDefault();
    e.stopPropagation();
    handle_point_exit(e);
    $('body').off('mouseover', handle_point_enter);
    $('body').off('mouseout', handle_point_exit);
    display_node($(e.target));

  }

  var start_point = function(e) {
    $('body').on('mouseover', handle_point_enter);
    $('body').on('mouseout', handle_point_exit);
    e.stopPropagation();
    $('body').one('click', handle_point_click);;
  }

  /*
   * Display a property list.
   */
  var display_property_list = function() {
    if(!displayed_node || !displayed_node.length) return;
    property_list.html('');
    var list = $('<ul>');
    // Size
    list.append('<li><span class="property-label">Size:</span> ' + displayed_node.width() + ' × ' + displayed_node.height());
    // Margin
    var margin_top = displayed_node.css('margin-top').replace(/[^\d]/g,'');
    var margin_left = displayed_node.css('margin-left').replace(/[^\d]/g,'');
    var margin_bottom = displayed_node.css('margin-bottom').replace(/[^\d]/g,'');
    var margin_right = displayed_node.css('margin-right').replace(/[^\d]/g,'');
    $('<li><span class="property-label">Margin:</span>')
      .append('top: ' + margin_top + ', bottom: ' + margin_bottom + ', left: ' + margin_left + ', right: ' + margin_right)
      .appendTo(list);
    // Padding
    var padding_top = displayed_node.css('padding-top').replace(/[^\d]/g,'');
    var padding_left = displayed_node.css('padding-left').replace(/[^\d]/g,'');
    var padding_bottom = displayed_node.css('padding-bottom').replace(/[^\d]/g,'');
    var padding_right = displayed_node.css('padding-right').replace(/[^\d]/g,'');
    $('<li><span class="property-label">Padding:</span>')
      .append('top: ' + padding_top + ', bottom: ' + padding_bottom + ', left: ' + padding_left + ', right: ' + padding_right)
      .appendTo(list);
    // Position
    list.append('<li><span class="property-label">Position:</span> ' + displayed_node.offset().left + ', ' + displayed_node.offset().top);
    // Background color
    list.append('<li><span class="property-label">Background colour:</span> ' + displayed_node.css('background-color'));
    property_list.append(list);
  }

  /*
   * Construct the UI
   */
  exports.initialize = function() {
    root = $("<div class='inspector'></div>").appendTo($('body'));
    tray = $('<div class="tray">');
    text_editor = $('<textarea class="text-editor">');
    property_editor = $('<div class="property-editor">');
    node_lookup = $('<div class="node-lookup">');
    node_selector = $('<input class="selector">');
    var point_button = $('<button>Point</button>');
    nth_node = $('<input class="nth">');
    lookup_btn = $('<button>Lookup</button>');
    property_list = $('<div class="property-list">');
    handle = $('<div class="handle">');
    // Assemble it.
    node_lookup.append(node_selector, nth_node, point_button);
    property_editor.append(node_lookup, property_list);
    tray.append(text_editor, property_editor);
    root.append(tray, handle);

    // Set up some callbacks.
    handle.click(toggle_inspector);

    node_selector.keyup(find_node);
    nth_node.keyup(find_node);

    text_editor.keyup(update_node);

    point_button.click(start_point);
  };
  
  return exports;
};

/*****************************************************************************
 * Boot up the web inspector!
 *
 * This will enable you to COPY AND PASTE this entire file into any web page
 * to inspect it.
 *
 * XXX TODO!
 *  Change the CSS link below to point to the full URL of your CSS file!
 *
 *  You shouldn't need to touch anything else below.
 *
 *****************************************************************************/
(function() {
    var createInspector = function() {
      window.inspector = Inspector(jQuery);
      window.inspector.initialize();
    }

    // Add the CSS file to the HEAD
    var css = document.createElement('link');
    css.setAttribute('rel', 'stylesheet');
    css.setAttribute('type', 'text/css');
    css.setAttribute('href', 'web-inspector.css'); // XXX TODO CHANGEME!!
    document.head.appendChild(css);

    if ('jQuery' in window) {
      createInspector(window.jQuery);
    } else {
      // Add jQuery to the HEAD and then start polling to see when it is there
      var scr = document.createElement('script');
      scr.setAttribute('src','http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js');
      document.head.appendChild(scr);
      var t = setInterval(function() {
        if ('jQuery' in window) {
          clearInterval(t); // Stop polling 
          createInspector();
        }
      }, 50);
    }
})();
