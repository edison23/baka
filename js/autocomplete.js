function copyContent(editorText, shadowId) {
	$("#" + shadowId).html(editorText);
}

function sliceContent(editorText) {
	var lines = editorText.split("<br>");
	var words = lines[lines.length-2]
					.replace(/(\&nbsp\;)/gm, " ")
					.replace(/(<.*?>)/gm, "")
					.split(/[\s,]+/);
	return words;
}

function getSuggestions(words, amount) {
	// hic sunt leones...ehm, ajaxes
	return ["radši", "radil", "raději", "rada", "radosti", "radost", "radnice", "radu", "rady", "rad", "ranní"];
}

function printCompletion(el, text) {
	var activeLine = document.getElementById(el).lastChild;
	activeLine.innerHTML = activeLine.innerHTML.replace("<br>", text + "<br>");
}

function selectSuggestion(suggestions, currentWord, shadowId, press) {
	// var longest = arr.reduce(function (a, b) { return a.length > b.length ? a : b; });
	var maxLenI = 0, curLen = 0;
	
	for (var i = 0; i < suggestions.length; i++) {
		curLen = suggestions[i].length;
		maxLen = suggestions[maxLenI].length;
		if (curLen > maxLen) {
			maxLenI = i;
		};
	};
	
	var suggestion = suggestions[maxLenI];

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
	var amount = 1;
	var editorText = $("#" + editorId).html();

	copyContent(editorText, shadowId);
	var words = sliceContent(editorText);
	var suggestions = getSuggestions(words, amount);
	var completion = selectSuggestion(suggestions, words[words.length-1], shadowId, press);
	return completion;
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
		completion = main(editorId, shadowId, e)
	}

});