function copyContent(editorText, shadowId) {
	$("#" + shadowId).html(editorText);
}

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

function getSuggestions(words, amount, coalback) {
	var stringForServer = ""
	if (words.length <= amount) {
		amount = words.length;
	}
	stringForServer = words.slice(words.length-amount, words.length).join("+");

	$.ajax({
		url: "http://nlp.fi.muni.cz/projekty/predictive/predict.py?input=" + stringForServer,
		// using supposedly depricated done, error, complete instead of new done, fail, always
		// because.. well, the new ones dont fire anything.. (http://api.jquery.com/jquery.ajax/)
		success: coalback,
		error: function() {
			console.log("error in ajax...")
		},
		complete: function(e, xhr, settings) {
			// console.log(stringForServer);
			// console.log("status code: ", e.status )
		},
	});
	// return ["radši", "radil", "raději", "rada", "radosti", "radost", "radnice", "radu", "rady", "rad", "ranní"];
}

function printCompletion(el, text) {
	// this conditioning for editor is very retarded. However, it's needed
	// since we cant restore position to shadow editor which would then took
	// focus
	if (el == "editor1") {
		var position = savePosition($("#" + el));
		var pos = position.startOffset;
	}
	
	var activeLine = document.getElementById(el).lastChild;
	activeLine.innerHTML = activeLine.innerHTML.replace("<br>", text + "<br>");
	
	if (pos) {
		restorePosition(pos+text.length, document.getElementById(el));
	}

}

function handleSuggestion(currentWord, editorId, shadowId, press, suggestions) {

	console.log(suggestions);
	suggestions = suggestions.split("\t");
	// discard words shorter than a few characters
	while (suggestions[0].length < 4) {
		suggestions = suggestions.slice(1,suggestions.length);
	}

	// for now only one completion supported
	// working with [1], bcs there's a weird newline in the string i can't get rid of (TODO)
	suggestion = suggestions[0].replace(/\n/g, "");


	// if the suggestion actually is the beggining of the work (safety measure)
	// and there hasn't been a space at the end of line
	if (suggestion.indexOf(currentWord) >= 0 && currentWord != " ") {
		//not entirely bullet proof - can replace sth else in the word
		var completion = suggestion.replace(currentWord, "");
		printCompletion(shadowId, completion);
		if (press.keyCode == 9) {
			printCompletion(editorId, completion);
		}
	}

	else if (currentWord == " ") {
		var completion = suggestion; // just to not make this so confusing
		printCompletion(shadowId, completion);
		if (press.keyCode == 9) {
			printCompletion(editorId, completion);
		}
	}

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
	// range.collapse(true); //to start
	
	var sel = window.getSelection();
	sel.removeAllRanges();
	
	sel.addRange(range);
}

function main(editorId, shadowId, press) {
	var amount = 3;
	var editorText = $("#" + editorId).html();

	copyContent(editorText, shadowId);
	var words = sliceContent(editorText);
	var currentWord =  words[words.length-1];
	getSuggestions(words, amount, handleSuggestion.bind(null, currentWord, editorId, shadowId, press));
	// return 0;
	// var completion = selectSuggestion(suggestions, words[words.length-1], shadowId, press);
	// return completion;
}

$( document ).ready(function() {
	var completion;
	var editorId = 'editor1';
	var shadowId = 'shadow1';

	document.getElementById('editor1').addEventListener("keydown", onKeyDown);
	document.getElementById('editor1').addEventListener("keyup", onKeyUp);

	function onKeyDown(e) {
		if (e.keyCode == 9) {
			var position = savePosition($("#" + editorId));
			var pos = position.startOffset;
			e.preventDefault();
			// insertCompletion(editorId, completion);
			// restorePosition(pos+completion.length, document.getElementById(editorId));
		};
	};

	function onKeyUp(e) {
		main(editorId, shadowId, e)
	};

});