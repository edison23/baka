function copyContent(editorText, shadowId) {
	$("#" + shadowId).html(editorText);
}

function sliceContent(editorText) {
	var lines = editorText.split("<br>");
	var line = lines[lines.length-2]
					.replace(/(\&nbsp\;)/gm, " ")
					.replace(/(<.*?>)/gm, "");
	var words = line.split(/[ ,-]+/);
	
	// this is to get rid of the empty item on the eng of array 
	// and to add item w/ space in case the line ended w/ space
	if (line.lastIndexOf(" ") == line.length - 1) {
		words.pop();
		words.push(" ");
	}
	return words;
}

function getSuggestions(words, amount) {
	var stringForServer = ""
	stringForServer = words.slice(0,amount).join("+");

	$.ajax({
		url: "http://nlp.fi.muni.cz/projekty/predictive/predict.py?input=" + stringForServer,
		// using supposedly depricated done, error, complete instead of new done, fail, always
		// because.. well, the new ones dont fire anything.. (http://api.jquery.com/jquery.ajax/)
		success: function(suggests) {
			suggests = suggests.split("\t").slice(0,2)
			// console.log(suggests);
			justBcsFuckinCallbacks(suggests);
		},
		error: function() {
			console.log("error in ajax...")
		},
		complete: function(e, xhr, settings) {
			console.log("status code: ", e.status )
		},
	});
	// return ["radši", "radil", "raději", "rada", "radosti", "radost", "radnice", "radu", "rady", "rad", "ranní"];
}

function justBcsFuckinCallbacks(suggests) {
	// for now the first suggestion, bcs it's the most frequent a/w
	selectSuggestion(suggests[0]);
}

function printCompletion(el, text) {
	var activeLine = document.getElementById(el).lastChild;
	activeLine.innerHTML = activeLine.innerHTML.replace("<br>", text + "<br>");
}

function selectSuggestion(suggestion, currentWord, shadowId) {

	console.log("beeeeeeeeeee",currentWord);
	// suggestion = "hladce"
	if (suggestion.indexOf(currentWord) == 0 && currentWord != "") {
		var completion = suggestion.replace(currentWord, ""); //not entirely bullet proof - can replace sth else
		printCompletion(shadowId, completion);
	}

	else if (currentWord == "") {
		var completion = suggestion; // just to not make this so confusing
		printCompletion(shadowId, completion);
	}

	return completion;
}

function insertCompletion(editorId, completion) {
	printCompletion(editorId, completion);
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
	getSuggestions(words, amount, currentWord, shadowId);
	// console.log(suggestions);
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
			insertCompletion(editorId, completion);
			restorePosition(pos+completion.length, document.getElementById(editorId));
		}
	}

	function onKeyUp(e) {
		main(editorId, shadowId, e)
	}

});