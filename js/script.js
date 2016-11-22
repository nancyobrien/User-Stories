var dragClass= "dragging"
var editClass= "editing";
var validPalettes = ['palette-01', 'palette-02'];
var maxSwatches = 9;
var serverGetBoardPoint = "GetBaords.ashx";

var cardManager = false;


$(document).ready(function(e){
	document.addEventListener("cardsLoaded", initializeInterface, false);
	document.addEventListener("cardsSaved", dataSaved, false);

	var boardName = false;
	if ($.QueryString["board"] && $.QueryString["board"] != '') {
		boardName = $.QueryString["board"];
	}
	cardManager = new cardMgr(boardName);

	$('#addCard').click(function(e){
		e.preventDefault();
		e.stopPropagation();
		cardManager.addCard();
	})

	

	$('#button--download').click(function(e){
		var jsonData = cardManager.getJSON();

		var blob = new Blob([jsonData], {type: "application/json"});
		var url  = URL.createObjectURL(blob);

		var a = document.createElement('a');
		a.download    = "userStories.json";
		a.href        = url;
		a.target="_blank";
		a.click();
		a.remove();

	})

	$('#button--snapGrid').click(function(e){
		e.preventDefault();
		e.stopPropagation();
		cardManager.toggleSnapGrid();
		$('.button--snapGrid').toggleClass('selected', cardManager.snapGrid);
	})



	/*$('.color-swatch').click(function(e){
		var swatch = $(this).attr('class').replace('')
		var palette = getPalette(this);
		$('.swatching').find('[data-paletted="true"]').addClass(getSwatchColor(this));
		$('.swatching').addClass(palette);
	})*/

})

function getBoards() {
	var crdMgr = this;
	if (boardName) {
		$.get( serverGetBoardPoint, function( data ) {
			
		});
	}

}

function initializeInterface() {
	if (!cardManager) {setTimeout(initializeInterface, 25 ); return;}
	$('.button--snapGrid').toggleClass('selected', cardManager.snapGrid);
	dataSaved();
}

function dataSaved() {
	if (cardManager.boardName != '') {
		$('#boardName').attr('href', "/?board=" + cardManager.boardName);
		$('#boardName').show();
	}
}

function getSwatchColor(thisSwatch) {
	var swatch = ''
	var classes = $(thisSwatch).classes();
	for (var i = 0; i < classes.length; i++){
		var thisClass = classes[i];
		if (thisClass.indexOf('color-swatch-') > -1){
			swatch = thisClass;
		}
	}
	return swatch;
}

function getPalette(thisSwatch) {
	var palette = ''
	var paletteCtrl = $(thisSwatch).closest('.color-palette');
	var classes = $(paletteCtrl).classes();
	for (var i = 0; i < classes.length; i++){
		var thisClass = classes[i];
		if (thisClass.indexOf('palette-') > -1){
			palette = thisClass;
		}
	}
	return palette;
}
