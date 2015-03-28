
// function for getting word under caret - supplies it to ajax
function getCaretWord(ctrl) {
	var sel = window.getSelection();
	var word = {text: "", index: 0, selection: ""};

	// get contents of the element, remove all new lines and stuff and split it to array by spaces
	var text_array = sel.anchorNode.textContent.replace(/(\r\n|\n|\r)/gm,"").split(" ")
	console.log(text_array);

	// get position of the caret relative to the selection start
	var offset = sel.anchorOffset

	var text_len = 0;

	// - for loop takes words out of the array, concats them to string and compares its length with offset
	// once it's greater, the current word is returned (which is obviously the word from under caret)
	// - offset-((text_array.length)-1) - this is compensation for spaces, which are not present in the 
	// array
	for (i in text_array) {
		if ((text_len + text_array[i].length) >= offset-((text_array.length)-1)) {
			// console.log(
			// 	"text_array: " + text_array, 
			// 	"\nlen " + text_len, 
			// 	"word " + text_array[i].replace(/\s+/g, ''), 
			// 	text_array[i].length, 
			// 	"offset " + offset, 
			// 	"text_a.len " + text_array.length, 
			// 	offset-((text_array.length)-1)
			// 	);
			word.text = text_array[i];
			word.index = i;
			word.selection = text_array;
			return(word);
		}
		else {
			text_len += text_array[i].length;
		}
	}
	return(-1) //dunno what to do here
}

// function for getting caret position in pixels
// and nope, I don't understand it. /edison
// src: http://stackoverflow.com/a/13084499/2216968 (slightly edited)
var getCaretPixelPos = function ($node, offsetx, offsety){
    offsetx = offsetx || 0;
    offsety = offsety || 0;

    var nodeLeft = 0,
        nodeTop = 0;
    if ($node){
        nodeLeft = $node.offsetLeft;
        nodeTop = $node.offsetTop;
    }

    var pos = {left: '0px', top: '0px'};

    if (document.selection){
        var range = document.selection.createRange();
        pos.left = range.offsetLeft + offsetx - nodeLeft;
        pos.top = range.offsetTop + offsety - nodeTop;
    }else if (window.getSelection){
        var sel = window.getSelection();
        var range = sel.getRangeAt(0).cloneRange();
        try{
            range.setStart(range.startContainer, range.startOffset-1);
        }catch(e){}
        var rect = range.getBoundingClientRect();
        if (range.endOffset == 0 || range.toString() === ''){
            // first char of line
            if (range.startContainer == $node){
                // empty div
                if (range.endOffset == 0){
                    pos.top = '0';
                    pos.left = '0';
                }else{
                    // firefox needs this
                    var range2 = range.cloneRange();
                    range2.setStart(range2.startContainer, 0);
                    var rect2 = range2.getBoundingClientRect();
                    pos.left = rect2.left + offsetx - nodeLeft;
                    pos.top = rect2.top + rect2.height + offsety - nodeTop;
                }
            }else{
                pos.top = range.startContainer.offsetTop;
                pos.left = range.startContainer.offsetLeft;
            }
        }else{
            pos.left = rect.left + rect.width + offsetx - nodeLeft;
            pos.top = rect.top + offsety - nodeTop;
        }
    }
    return pos;
};

var $edit = $('#wrapper1');
var el = document.getElementById("editor1");

// do weird stuff on keyup
$edit.keyup(function (e) {
	var pos = getCaretPixelPos($edit[0]);

	var charPos = getCaretCharacterOffsetWithin(el);
		console.log(charPos);
	
	// debug (caret position output, no real meaning)
    $x = $('#xpos'),
    $y = $('#ypos');
    $x.html(pos.left);
    $y.html(pos.top);
	
	// just hide the suggestions div in case the position is 0 from the left (which is at the begining of each line usually)
	// else show the suggestions (bellow the line, thus +20 px)
	if (pos.left == 0) {
		$('#suggests').css({'visibility': 'hidden' })
	}
	else {
		$('#suggests').css({ 'top': pos.top+20, 'left': pos.left, 'visibility': 'visible' });
	}

	// totally from old completion - key dependent events
	if (e.keyCode == 40) { // keydown
		e.preventDefault();
		var active = -1;
		$(".completion").each(function(index){
				if ($(this).hasClass("active")){
					 $(this).removeClass("active");
					 active = index;
				}
		});
		$(".completion").each(function(index){
				if (index == active+1 && active<$(".completion").length){
					$(this).addClass( "active");
				}
		});
	}
	
	if (e.keyCode == 38) { // keyup
		e.preventDefault();
		var active = -1;
		$(".completion").each(function(index){
				if ($(this).hasClass("active")){
					 $(this).removeClass("active");
					 active = index;
				}
		});
		$(".completion").each(function(index){
				if (index == active-1 && active>0){
					$(this).addClass( "active");
				}
		});
	}

	// on tab select the choice and insert it to div
	if (e.keyCode == 9) { //tab
		$(".completion").each(function(index){
			e.preventDefault();
			if ($(this).hasClass("active")){
				insert_suggest(this.textContent, charPos);
  	};
		});
	};

	// this is supposed to move caret to the end of the content (or rather to the place where it was before, ideally),
	// bud doesnt really work, no idea why.
	// src: http://stackoverflow.com/a/10782169/2216968
	function moveCaret(win, charCount) {
	    var sel, range;
	    if (win.getSelection) {
	        sel = win.getSelection();
            sel.collapseToEnd();
	        // if (sel.rangeCount > 0) {
	        //     var editor_content_len = $("#editor1").text().length;
	        //     var textNode = sel.focusNode;
	        //     var newOffset = editor_content_len;
	        //     // sel.collapse(textNode, Math.min(textNode.length, newOffset));
	        //     sel.collapseToEnd();
	        // }
	    } else if ( (sel = win.document.selection) ) {
	        if (sel.type != "Control") {
	            range = sel.createRange();
	            range.move("character", charCount);
	            range.select();
	        }
	    }
}

	// function getCaretIndex(editor) {
	// 	console.log(editor);
	// 	var bookmarks = editor.getSelection().createBookmarks2();
	// 	console.log(bookmarks);
	// 	// console.log(editor.getSelection().selectBookmarks(bookmarks));
	// }

	function getCaretCharacterOffsetWithin(element) {
    var caretOffset = 0;
    var doc = element.ownerDocument || element.document;
    var win = doc.defaultView || doc.parentWindow;
    var sel;
    if (typeof win.getSelection != "undefined") {
        sel = win.getSelection();
        if (sel.rangeCount > 0) {
            var range = win.getSelection().getRangeAt(0);
            var preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(element);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            caretOffset = preCaretRange.toString().length;
        }
    } else if ( (sel = doc.selection) && sel.type != "Control") {
        var textRange = sel.createRange();
        var preCaretTextRange = doc.body.createTextRange();
        preCaretTextRange.moveToElementText(element);
        preCaretTextRange.setEndPoint("EndToEnd", textRange);
        caretOffset = preCaretTextRange.text.length;
    }
    return caretOffset;
	}

	function replaceWordUnderCaret(string, i, newWord) {
		console.log(string, i, newWord)
		var orig = string;
		first = orig.substr(0, orig.substr(0, i).lastIndexOf(" "));
		// console.log(first);

		wordEndChars = [" ", ".", ",", "!", ":"]; // anything left out?
		first = orig.substr(0, orig.substr(0, i).lastIndexOf(" "));
		// console.log(first);

		for (i; i <= orig.length; i++) {
			console.log("char " + orig[i])
			if (wordEndChars.indexOf(orig[i]) != -1 || orig[i] == null) {
				second = orig.substr(i, orig.length)
				// console.log(second)
				break;
			}
		}
		var newString = first.concat(" ", newWord, second)
		// console.log(newString);
		return newString
	}

	var savedRange,isInFocus;
	function saveSelection()
	{
	    if(window.getSelection)//non IE Browsers
	    {
	        savedRange = window.getSelection().getRangeAt(0);
	        return savedRange;
	    }
	    else if(document.selection)//IE
	    { 
	        savedRange = document.selection.createRange();  
	        return savedRange;
	    } 
	}

	function restoreSelection(savedRange)
	{
	    isInFocus = true;
	    document.getElementById("editor1").focus();
	    if (savedRange != null) {
	        if (window.getSelection)//non IE and there is already a selection
	        {
	            var s = window.getSelection();
	            if (s.rangeCount > 0) 
	                s.removeAllRanges();
	            s.addRange(savedRange);
	        }
	        else if (document.createRange)//non IE and no selection
	        {
	            window.getSelection().addRange(savedRange);
	        }
	        else if (document.selection)//IE
	        {
	            savedRange.select();
	        }
	    }
	}
	// insert selected suggestion to the div
	// gets selection, caret position and index of last space, then replaces
	// the last word with the suggestion
	// problem: .focus() places caret to the begining of the div's content
	// can insert only to the end of text
	function insert_suggest(suggest, charPos) {
		savedRange = saveSelection();
		afterSuggestInsert = replaceWordUnderCaret(document.getElementById("editor1").innerHTML, charPos, suggest);
		document.getElementById("editor1").innerHTML = afterSuggestInsert;
		// get caret pos
		// sel = window.getSelection();
		// range = document.createRange();
		// range.setStart(sel.anchorNode, sel.anchorOffset);
		// console.log(range);
		
		// focus div
		// $("#editor1").focus();
		console.log(savedRange);
		restoreSelection(savedRange);
		
		// set caret pos

	}

});

// and magic again - from Python workshop 2014
// I apparently wrote parts of it, but not many I guess
$(document).ready(function() {
	var keystrokes = 0;
	var tlen = 0;
	var field = $("#editor1");
	field.bind("input paste", function(event) {
		
		// field has to be filled again to refresh the contents (after it was typed)
		field = $("#editor1");
		var current = getCaretWord(this);
		// console.log(word)
		$.ajax({
			
			// spaces replaced for "%20" bcs URLs can't have spaces in it (also could use plus sign instead of %20)
			url: "http://nlp.fi.muni.cz/projekty/predictive/predict.py?input=" + current.text.replace(" ", "%20"),
			word: {},
			success: function( suggests ) {
				// split the returned array by tabs and leave only 5 results
				suggests_array = suggests.split("\t").slice(0,6);
			
				// reset the completations
				$("#suggests").empty();
				$.each(suggests_array, function(index, value) {
					
					// if it's the 1st button, let's make it active by default
					var active = "";
					if (index == 0) {
						active = ' active';
					}

					// fill in the buttons with completations (trim value bcs some of them contain new line)
					if (value.trim() != "") {
						$("#suggests").append("<button type=\"button\" class=\"completion btn btn-primary get-out"+ active + "\" id=\"" + index + "\">" + value.trim() + "</button>");
					}
				});
			},
			error: function ( xhr, status, error ) {
				console.log(status);
			}
		});
		
	});
});