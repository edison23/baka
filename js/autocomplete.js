// global var (i know, i know) for delaying ajax calls
var timeout;

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

	return words;
}

// prepare string for server (URL) and make ajax call
function getSuggestions(words, amount, coalback) {
	var stringForServer = ""
	var delay = 250 // ajax delaytak to ti 
	
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
			// anything.. (http://api.jquery.com/jquery.ajax/)he
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
function handleSuggestion(currentWord, editorId, shadowId, press, suggestions) {

	// copy editor text to shadow editor again to prevent chaing new suggests
	// after previous suggestions (little inefficient, i know)
	editorText = $("#" + editorId).html();
	copyContent(editorText, shadowId);

	suggestions = suggestions.split("\t");
	
	// discard words shorter than a few characters
	while (suggestions[0].length < 4) {
		suggestions = suggestions.slice(1,suggestions.length);
	}

	// for now only one completion supported
	suggestion = suggestions[0].replace(/\n/g, "");


	// check if the suggestion actually is the beggining of the word (safety
	// measure) and there hasn't been a space at the end of line
	if (suggestion.indexOf(currentWord) >= 0 && currentWord != " ") {
		//not entirely bullet proof - can replace sth else in the word
		var completion = suggestion.replace(currentWord, "");
		printCompletion(shadowId, completion);
	}

	else if (currentWord == " ") {
		var completion = suggestion; // just to not make this so confusing
		printCompletion(shadowId, completion);
	}

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

// main function that runs on every keyup (except on <TAB>)
function doStuffOnKeyUp(editorId, shadowId, press) {
	var amount = 3;
	var editorText = $("#" + editorId).html();

	copyContent(editorText, shadowId);
	var words = sliceContent(editorText);
	var currentWord =  words[words.length-1];
	getSuggestions(
		words, 
		amount, 
		handleSuggestion.bind(
			null, 
			currentWord, 
			editorId, 
			shadowId, 
			press
			)
		);
}

$( document ).ready(function() {
	var editorId = 'editor1';
	var shadowId = 'shadow1';

	document.getElementById('editor1').addEventListener("keydown", onKeyDown);
	document.getElementById('editor1').addEventListener("keyup", onKeyUp);

	function onKeyDown(e) {
		if (e.keyCode == 9) {
			e.preventDefault();
			var position = savePosition($("#" + editorId));
			var pos = position.startOffset;
			var completion = insertCompletion(editorId, shadowId);
			restorePosition(pos+completion.length, document.getElementById(editorId));
		};
	};

	function onKeyUp(e) {
		if (e.keyCode != 9) {
			doStuffOnKeyUp(editorId, shadowId, e);
		};
	};
});