// global var (i know, i know) for delaying ajax calls
var timeout;
var tabPress = false;

// and this is here bcs the author is stupid faggot unable to properly write
// this shit, meh
var suggestions = [];
var suggestIndex = 0;

// copy content of editor to shadow editor
function copyContent(content, el) {
	$("#" + el).html(content);
}

// split the text to words
function sliceContent(editorText) {
	var lines = editorText.split("<br>");
	var line = lines[lines.length-2]
					.replace(/(\&nbsp\;)/gm, " ")
					.replace(/(<.*?>)/gm, "");
	var words = line.split(/[ ,-]+/);
	
	// in case the line ended w/ space this is to get rid of 
	// the empty item on the end of array and to add item w/ space
	if (line.lastIndexOf(" ") == line.length - 1) {
		words.pop();
		words.push(" ");
	}

	// if there has been space(s) at the start of text field, word[0] is empty,
	// which breaks the string sent to server (plus on the beginning causes
	// empty server response); thus we have to remove the empty element
	if (words[0] == "") {
		words.shift();
	}

	return words;
}

// prepare string for server (URL) and make ajax call
function getSuggestions(words, amount, coalback) {
	var stringForServer = ""
	var delay = 250 // ajax delay
	
	if (words.length <= amount) {
		amount = words.length;
	}
	
	stringForServer = encodeURI(
		words.
		slice(words.length-amount, words.length).
		join("+")
		);

	clearTimeout(timeout);
	timeout = setTimeout(function() {
		$.ajax({
			url: 
				"http://nlp.fi.muni.cz/projekty/predictive/predict.py?input=" + 
				stringForServer,
			
			// using supposedly depricated success, error, complete instead of
			// new done, fail, always because.. well, the new ones dont fire
			// anything.. (http://api.jquery.com/jquery.ajax/)
			success: coalback,
			error: function() {
				console.log("Way hay, what shall we do with the drunken sailor?")
			},
			complete: function(e, xhr, settings) {
				console.log("status code: ", e.status )
			},
		});
	}, delay);
}

// insert completion (or suggestion in case of shadow editor) to appropriate
// editor
function printCompletion(el, text) {
	
	// this conditioning for editor is very retarded. However, it's needed since
	// we cant restore position to shadow editor which would then took focus
	if (el == "editor1") {
		var position = savePosition($("#" + el));
		var pos = position.startOffset;
	}

	// this will break if the editor will somehow be in plain text mode
	var activeLine = document.getElementById(el).lastChild;
	activeLine.innerHTML = activeLine.innerHTML.replace("<br>", text + "<br>");
	
	if (pos) {
		restorePosition(pos+text.length, document.getElementById(el));
	}

}

// callback function for ajax to deal with the suggestions server returns
function handleSuggestion(currentWord, suggestFromText, editorId, shadowId, press, serverResponse) {
	// console.log(suggestFromText);

	// copy editor text to shadow editor again to prevent chaing new suggests
	// after previous suggestions (little inefficient, i know)
	editorText = $("#" + editorId).html();
	copyContent(editorText, shadowId);

	// discard anything in suggestions (yea, using global vars sux hard, need to
	// fix this shit)
	suggestions = [];

	serverResponse = serverResponse.split("\t");

	// the first suggest is usually infested with a newline for some reason
	serverResponse[0] = serverResponse[0].replace(/\n/g, "");
	
	// discard words shorter than a few characters
	// some conditioning might be appropriate to avoid exceptions
	var temp = []
	for (i = 0; i <= 4; i++) {
		if (serverResponse[i].length >= 3) {
			suggestions.push(serverResponse[i])
		}
	}

	// if there has been word which can be completion to current word previously
	// in text, put it on the beginning of the array and discard the last
	// suggestion from server
	if (suggestFromText) {
		suggestions.unshift(suggestFromText);
		suggestions.pop();
	}

	// check if the suggestion actually is the beggining of the word (safety
	// measure) and there hasn't been a space at the end of line
	if (suggestions[0].indexOf(currentWord) >= 0 && currentWord != " ") {
		
		//not entirely bullet proof - can replace sth else in the word
		var completion = suggestions[0].replace(currentWord, "");
		printCompletion(shadowId, completion);
	}

	else if (currentWord == " ") {
		var completion = suggestions[0]; // just to make this less confusing
		printCompletion(shadowId, completion);
	}

	showAlternatives(editorId);
	return completion;
}

function lastWord(t) {
	return t.split(/[ ,-]+/).pop();
}

// this runs on <TAB> keydown (accepting the completion) and relies on the fact
// that the completion is displayed in the shadow editor (so it copies it from
// there and inserts it to the actual editor)
function insertCompletion(editorId, shadowId) {
	suggestion = lastWord($('#' + shadowId).text());
	currentWord = lastWord($('#' + editorId).text());
	completion = suggestion.replace(currentWord, "");
	printCompletion(editorId, completion);
	return completion;
}

function savePosition(el) {
	return window.getSelection().getRangeAt(0);
}

function restorePosition(pos, el) {
	var startNode = el.firstChild.firstChild;
	var endNode = el.childNodes[0].firstChild;

	var range = document.createRange();
	range.setStart(startNode, pos);
	range.setEnd(endNode, pos);
	// range.collapse(true); //to start; not needed obviously, dunno
	
	var sel = window.getSelection();
	sel.removeAllRanges();
	sel.addRange(range);
}

// http://stackoverflow.com/a/6847328/2216968
function getSelectionCoords(win) {
    win = win || window;
    var doc = win.document;
    var sel = doc.selection, range, rects, rect;
    var x = 0, y = 0;
    if (sel) {
        if (sel.type != "Control") {
            range = sel.createRange();
            range.collapse(true);
            x = range.boundingLeft;
            y = range.boundingTop;
        }
    } else if (win.getSelection) {
        sel = win.getSelection();
        if (sel.rangeCount) {
            range = sel.getRangeAt(0).cloneRange();
            if (range.getClientRects) {
                range.collapse(true);
                rects = range.getClientRects();
                if (rects.length > 0) {
                    rect = rects[0];
                }
                x = rect.left;
                y = rect.top;
            }
            // Fall back to inserting a temporary element
            if (x == 0 && y == 0) {
                var span = doc.createElement("span");
                if (span.getClientRects) {
                    // Ensure span has dimensions and position by
                    // adding a zero-width space character
                    span.appendChild( doc.createTextNode("\u200b") );
                    range.insertNode(span);
                    rect = span.getClientRects()[0];
                    x = rect.left;
                    y = rect.top;
                    var spanParent = span.parentNode;
                    spanParent.removeChild(span);

                    // Glue any broken text nodes back together
                    spanParent.normalize();
                }
            }
        }
    }
    return { x: x, y: y };
}

function findLastSimiliarWord(arr, substr, minLen) {
	
	// iterate in the text from the end (and leave out the last word, which is
	// actually the current one)
	for (i = arr.length-2; i >= 0; i--) {
		if (arr[i].indexOf(substr) == 0 && arr[i].length >= minLen) {
			return arr[i];
		}
	}
}

// main function that runs on every keyup (except on <TAB>)
function doStuffOnKeyUp(editorId, shadowId, press) {
	var amount = 3;
	var editorText = $("#" + editorId).html();
	var suggestFromText = "";

	destroyAlternatives()
	copyContent(editorText, shadowId);
	var words = sliceContent(editorText);
	var currentWord =  words[words.length-1];

	// search for similiar words already written if current word is at least 3
	// chars long
	if (currentWord.length > 2) {
		
		// minimal lenght of word to select to suggestions
		var minLen = 4;
		suggestFromText = findLastSimiliarWord(words, currentWord, minLen);
	}

	getSuggestions(
		words, 
		amount, 
		handleSuggestion.bind(
			null, 
			currentWord, 
			suggestFromText,
			editorId, 
			shadowId, 
			press
			)
		);
}

// create the alternatives box
function showAlternatives(editorId) {
	
	// reset alternatives (prevents chaining of new and old ones in some cases)
	destroyAlternatives();

	caretPos = getSelectionCoords();
	var styles = {
		display: "block",
		top: caretPos.y + 30 + "px",
		left: caretPos.x + "px"
	}
	$('#alternatives').css(styles);
	for (i = 0; i <= suggestions.length-1; i++) {
		$('#alternatives').append('<span id="altr-' + i + '">' + suggestions[i] + '</span>');
		// $('#alternatives #altr-0').css("display", "none");
	}
	$('#altr-' + 0).addClass("current");
}

// delete the alternatives box's contents when not needed
function destroyAlternatives() {
	$('#alternatives').empty().css("display", "none");

}

// replace the current completion with the nex one
function replaceCompletion(completion, editorId, shadowId) {
	editorText = editorId.html();
	n = editorText.lastIndexOf(" ");

	// for some reason this works even with n == -1 ..dont ask me how	
	editorText = editorText.substring(0, n+1) + completion + "<br>"
	editorId.html(editorText);
	copyContent(editorText, shadowId);
}

$( document ).ready(function() {
	var editorId = 'editor1';
	var shadowId = 'shadow1';

	document.getElementById('editor1').addEventListener("keydown", onKeyDown);
	document.getElementById('editor1').addEventListener("keyup", onKeyUp);

	function onKeyDown(e) {
		if (e.keyCode == 9 && tabPress == true) {
			e.preventDefault();
			
			// setting the correct item as current (in #alternatives)
			if (suggestIndex >= suggestions.length - 1) {
				suggestIndex = -1;
			}

			suggestIndex++;

			// this is sooo retarded, Y U no add up normally?
			// since can't compute this in the string addition, we have to do it
			// beforehand
			previous = suggestIndex>0 ? suggestIndex - 1 : 3;

			$('#altr-' + previous).removeClass("current");
			$('#altr-' + suggestIndex).addClass("current");

			replaceCompletion(suggestions[suggestIndex], $('#' + editorId), shadowId)
			restorePosition($('#' + editorId).text().length, document.getElementById(editorId));
		}

		else if (e.keyCode == 9) {
			e.preventDefault();
			var completion = insertCompletion(editorId, shadowId);
			tabPress = true;
		};
	};

	function onKeyUp(e) {
		if (e.keyCode != 9) {
			tabPress = false;
			doStuffOnKeyUp(editorId, shadowId, e);
		};
	};
});