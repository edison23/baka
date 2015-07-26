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
	// console.log(window.getSelection().getRangeAt(0));
	return window.getSelection().getRangeAt(0);
}

function restorePosition(el, pos) {
	window.getSelection.addRange(pos);
}

$( document ).ready(function() {
	var completion;
	var editorId = '#editor1';
	var shadowId = '#shadow1';

	document.getElementById('editor1').addEventListener("keydown", onKeyDown);
	document.getElementById('editor1').addEventListener("keyup", onKeyUp);

	function onKeyDown(e) {
		if (e.keyCode == 9) {
			position = savePosition($(editorId));
			e.preventDefault();
			insertCompletion(editorId, completion);
			restorePosition(position);
		}
	}

	function onKeyUp(e) {
		completion = main(editorId, shadowId, e)
	}

});