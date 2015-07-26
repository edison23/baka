function copyContent(editorText, shadowId) {
	$(shadowId).html(editorText);
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
	return ["penis", "vagvaina"];
}

function printCompletion(el, text) {
	$(el + " p").append( document.createTextNode(text));
	$(el + " p").html($(el + " p").html().replace("<br>", "")).append("<br>");
}

function selectSuggestion(suggestions, currentWord, shadowId, press) {
	var suggestion = suggestions[1];
	var completion = suggestion.replace(currentWord, ""); //not entirely bullet proof - can replace sth else
	printCompletion(shadowId, completion)
	return completion;
}

function main(editorId, shadowId, press) {
	var amount = 1;
	var editorText = $(editorId).html();

	copyContent(editorText, shadowId);
	var words = sliceContent(editorText);
	var suggestions = getSuggestions(words, amount);
	var completion = selectSuggestion(suggestions, words[words.length-1], shadowId, press);
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

function gEl(id) {
	return getElementsById(id);
}

$( document ).ready(function() {
	var completion;
	var editorId = '#editor1';
	var shadowId = '#shadow1';

	document.getElementById('editor1').addEventListener("keydown", onKeyDown);
	document.getElementById('editor1').addEventListener("keyup", onKeyUp);

	function onKeyDown(e) {
		// console.log("le", completion.length);
		if (e.keyCode == 9) {
			var position = savePosition($(editorId));
			var pos = position.startOffset;
			e.preventDefault();
			insertCompletion(editorId, completion);
			restorePosition(pos+completion.length, document.getElementById('editor1'));
		}
	}

	function onKeyUp(e) {
		completion = main(editorId, shadowId, e)
	}

});