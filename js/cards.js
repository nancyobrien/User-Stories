function cardMgr(initBoardName) {
	var serverSavePoint = "SaveData.ashx";
	var serverGetPoint = "GetData.ashx?id=";
	var cardManager = this;
	var localStorageID = 'cards';
	var storyCardSelector = '.story-card';
	this.maxSwatches = 9;
	this.movingClass= "dragging";
	this.editClass= "editing";
	this.cardContainer = $('.story-board-content');
	this.cards = [];
	this.snapGrid = true;
	this.boardName = '';
	this.savedData = '';
	this.cardWidth = 0;

	this.init = function() {
		$(storyCardSelector).each(function(key, val) {
			var pos = $(this).offset();
			var parpos = $(this).parent().offset();
			$(this).data("left", pos.left - parpos.left);
			$(this).data("top", pos.top - parpos.top);
		})

		$(storyCardSelector).each(function(key, val) {
			$(this).css("position", "absolute");
			$(this).css("left", $(this).data("left"));
			$(this).css("top", $(this).data("top"));
		})

		document.addEventListener("cardMoveStart", cardManager.cardReset, false);
		document.addEventListener("cardMoveEnd", cardManager.endMove, false);
		document.addEventListener("cardColorStart", cardManager.cardReset, false);
		document.addEventListener("cardColorSet", cardManager.cardReset, false);
		document.addEventListener("cardColorEnd", cardManager.cardReset, false);
		document.addEventListener("cardEditStart", cardManager.cardReset, false);
		document.addEventListener("cardEditEnd", cardManager.cardReset, false);
		document.addEventListener("cardArchived", cardManager.cardReset, false);
		document.addEventListener("cardDeleted", cardManager.deleteCard, false);

		if (initBoardName) {this.restore(initBoardName);}

	}

	this.toggleSnapGrid = function() {
		this.snapGrid = !this.snapGrid;
		if (this.snapGrid) {
			this.moveCardsToGrid();
		}
	}

	this.endMove = function() {
		if (cardManager.snapGrid) {
			for (var i = cardManager.cards.length - 1; i >= 0; i--) {
				var thisCard = cardManager.cards[i];
				var position = thisCard.position;
				position = cardManager.getSnapPosition(thisCard.position);
				if ((thisCard.position.x != position.x) || (thisCard.position.y != position.y)) {
					thisCard.setPosition(position);
				}
			}
		}

		cardManager.cardReset();
	}

	this.cardReset = function() {
		clearDrag();
		clearEdit();
		clearSwatches();
		cardManager.save();
	}

	this.addCard = function() {
		var pos = {'x': 0, 'y':0};
		var maxX = 0;
		var maxY = 0;
		var offsetY = 0;
		for (var cardItem in this.cards) {
			maxX = Math.max(this.cards[cardItem].position.x, maxX);
		}
		for (var cardItem in this.cards) {
			var thisCard = this.cards[cardItem];
			if ((maxX > (thisCard.position.x-thisCard.width()/2)) && (maxX < (thisCard.position.x+thisCard.width()/2))) {
				maxY = Math.max(thisCard.position.y, maxY);
				if (thisCard.position.y == maxY) {offsetY = thisCard.height();}
			}
		}
		pos.x = maxX;
		pos.y = maxY + offsetY;

		var newCard = new card();

		this.attachCard(newCard, pos);
		this.save();
		//newCard.beginEdit();
	}


	this.deleteCard = function() {
		for (var i = cardManager.cards.length - 1; i >= 0; i--) {
			if (cardManager.cards[i].deleted) {
				cardManager.cards.splice(i, 1);
			}
		}
		cardManager.save();
		//console.log('delete card')
	}

	this.getJSON = function() {
		var jsonString = false;
		if (this.cards.length > 0) {
			var saveCards = [];
			for (var c in this.cards) {
				if (!this.cards[c].deleted) {
					saveCards.push(this.cards[c].serialObj());
				}
			}

			jsonString = JSON.stringify(saveCards);	
		}
		return jsonString;
	}

	this.save = function() {
		var jsonData = this.getJSON();
		if (jsonData) {
			localStorage.setItem(localStorageID, jsonData);	
		}
		this.saveToServer();
	}

	this.getBoardData = function() {
		var boardData = {};
		boardData.snapGrid = this.snapGrid;
		boardData.boardName = this.boardName;
		return JSON.stringify(boardData);	
	}


	this.saveToServer = function() {
		var jsonData = this.getJSON();
		var boardData = this.getBoardData();
		if (this.savedData != jsonData) {
			this.savedData = jsonData;
			$.post(serverSavePoint, { "name": this.boardName, "boardData": boardData, "data": jsonData }, function( data ) {
				if (cardManager.boardName != data) {
					cardManager.boardName = data;
					raiseEvent("cardsSaved", data);
				}
			});			
		}
	}

	this.restore = function(boardName) {
		var crdMgr = this;
		if (boardName) {
			$.get( serverGetPoint + boardName, function( data ) {
				var tmpcards = data;

				if (!tmpcards || tmpcards == '') {return;}
				for (var i = 0; i < tmpcards.length; i++) {
					var thisCard = tmpcards[i];
					crdMgr.attachCard(new card(thisCard));
				}
				crdMgr.boardName = boardName;
				crdMgr.savedData = crdMgr.getJSON();
				raiseEvent("cardsLoaded", "");
			});
		}

	}

	this.attachCard = function(thisCard, position) {
		this.cardContainer.append(thisCard.cardContainer);  //Have to add the card to DOM for it to have width in Chrome.
		this.cardWidth = thisCard.cardContainer.width() + parseFloat(thisCard.cardContainer.css('margin-left')) + parseFloat(thisCard.cardContainer.css('margin-right')) + 5;
		if (!position) {position = thisCard.position;}
		if (this.snapGrid) {position = this.getSnapPosition(position)};
		thisCard.setPosition(position)
		this.cards.push(thisCard);
	}


	this.moveCardsToGrid = function() {
		if (!this.snapGrid) {return;}
		if (this.cards.length > 0) {
			for (var c in this.cards) {
				this.snapCardToGrid(this.cards[c]);
			}
		}
		this.save();
	}

	this.snapCardToGrid = function(thisCard) {
		var position = this.getSnapPosition(thisCard.position);
		thisCard.setPosition(position)
	}

	this.getSnapPosition = function(position) {
		var newPosition = {};
		newPosition.y = position.y;
		newPosition.x = Math.round(position.x/this.cardWidth) * this.cardWidth;
		return newPosition;
	}

	this.init();


	function clearDrag() {
		$('.' + cardManager.movingClass).removeClass(cardManager.movingClass)
		$('body').unbind('mousemove');
	}

	function clearEdit() {
		$('[data-editable="true"]').attr('contenteditable', false);
		$('[data-editable="true"]').unbind('keypress');
		$('.' + editClass).removeClass(editClass);
	}

	function clearSwatches() {
		$('.swatching').removeClass('swatching');
		$('.color-palette').hide();
	}

	function endEdit(clickedElement){
		if ($(clickedElement).attr('contenteditable') === true) {
			$(document).one('click', function( e ) {
				endEdit(this)
			})
		} else {
			clearEdit();
		}
	}
}

function card(cardData) {
	var thisCard = this;
	var swatchString = '';
	var handleSelector = '.story-card-handle';
	var paletteFlag = 'paletted';
	var categoryFlag = 'category';
	var editFlag = 'editable';
	var paletteString = 'color-swatch-';
	var titleSelector = '.story-title';
	var contentSelector = '.story-content';
	var archiveSelector ='.button--archive';
	var movingClass = 'dragging';
	var deletingClass = 'deleting';
	var archiveClass = 'archived';
	var editConfirmClass = 'edit-confirm';
	var editTriggerClass = 'triggerEdit';

	this.initialized = false;
	this.deleted = false;
	this.paletteElement = false;
	this.paletteTemplate = $('#colorpalette-template').html();
	this.template = $('#storycard-template').html();
	this.defaults = {'title': 'Story Title', 'content': 'As a story card, I want to tell a story so that I can be useful.'}
	this.title = this.defaults.title;
	this.content = this.defaults.content;
	this.html = '';
	this.cardContainer = false;
	this.handle = false;
	this.position = {'x': 0, 'y':0};
	this.selectingColor = false;
	this.archived = false;
	this.revertedData = {'title': '', 'content': ''};

	this.palette = 'palette-01';
	this.swatch = paletteString + "00";
	this.category = paletteString + "00";

	this.serialObj = function() {
		this.updateHTML();

		var $card = $(this.cardContainer);
		var serObj = {};
		//serObj.html = '';
		serObj.title = $card.find(titleSelector).text();
		serObj.content = $card.find(contentSelector).text();
		serObj.position = {};
		serObj.position.x = this.position.x;
		serObj.position.y = this.position.y;
		serObj.palette = this.getPalette();
		serObj.category = this.getSwatchColor(categoryFlag);
		serObj.swatch = this.getSwatchColor(paletteFlag);
		serObj.archived = this.cardContainer.hasClass(archiveClass);
		return serObj;
	}

	this.defineEvents = function() {
		var element = this;
		this.getHTML();
		var $card = $(this.cardContainer);
		var $title = $card.find(titleSelector);
		var $content = $card.find(contentSelector);
		var $colorCtrl = $card.find('.story-color');
		var $editCtrl = $card.find('.story-edit');
		var $delCtrl = $card.find('.story-delete');
		var $cancelEditCtrl = $card.find('.js-cancel-edit');
		var $acceptEditCtrl = $card.find('.js-story-accept');

		var $archiveBtn = $card.find(archiveSelector);

		$title.addClass(editTriggerClass);
		$content.addClass(editTriggerClass);

		var $editTriggers = $card.find('.' + editTriggerClass);

		/*$card.find(titleSelector).text(this.title);
		$content.text(this.content);
		$card.toggleClass(archiveClass, this.archived);
		$card.addClass(this.palette);
		$card.find('[data-' + paletteFlag + '="true"]').addClass(this.swatch);*/

		$card.find(titleSelector).focus(function() {
			var el = this;
		    window.setTimeout(function() {
		        var sel, range;
		        if (window.getSelection && document.createRange) {
		            range = document.createRange();
		            range.selectNodeContents(el);
		            range.collapse(false);
		            sel = window.getSelection();
		            sel.removeAllRanges();
		            sel.addRange(range);
		        } else if (document.body.createTextRange) {
		            range = document.body.createTextRange();
		            range.moveToElementText(el);
		            range.collapse(false);
		            range.select();
		        }
		    }, 1);
		});


		$card.find(contentSelector).focus(function() {
			var el = this;
		    window.setTimeout(function() {
		        var sel, range;
		        if (window.getSelection && document.createRange) {
		            range = document.createRange();
		            range.selectNodeContents(el);
		            range.collapse(false);
		            sel = window.getSelection();
		            sel.removeAllRanges();
		            sel.addRange(range);
		        } else if (document.body.createTextRange) {
		            range = document.body.createTextRange();
		            range.moveToElementText(el);
		            range.collapse(false);
		            range.select();
		        }
		    }, 1);
		});

		$card.mousedown(function(ev) {
			popToTop($card);
		})

		this.handle.mouseup(function() {
			if ($card.hasClass(editClass)) {return;}  //Don't move if editing card.
			raiseEvent("cardMoveEnd", "");
			$card.removeClass(movingClass);

			//$card.css('opacity', 1);
		});


		this.handle.mousedown(function(ev) {
			if ($card.hasClass(editClass)) {return;}  //Don't move if editing card.
			raiseEvent("cardMoveStart", "");
			//popToTop($card);
			$card.addClass(movingClass);
			//$card.css('opacity', .5);
			var offsetX = ev.pageX - ($card.offset().left - $card.parent().offset().left - parseFloat($card.css('margin-left'))/2)
			var offsetY = ev.pageY - ($card.offset().top - $card.parent().offset().top  - parseFloat($card.css('margin-top'))/2)

			//console.log(ev.pageX + " " + ev.clientX + " " + $card.position().left + " " + $card.css('left') + " " + $card.offset().left + " " + $card.parent().scrollLeft())

			if (Math.abs(ev.pageY - $card.offset().top) <= parseFloat($card.css('margin-top'))) {return;}

			$('body').mousemove(function(event) {
				
				var scroll = {'left': $card.parent().scrollLeft(), 'top':  $card.parent().scrollTop()};
				var win = $card.parent();
				var viewport = {
					top : win.scrollTop(),
					left : win.scrollLeft()
				};
				viewport.right = viewport.left + win.width();
				viewport.bottom = viewport.top + win.height();
				//console.log(event.pageX    + " " + event.clientX    + " " + offsetX + " " + (event.pageX - offsetX) )
				var yMin = event.pageY - offsetY; //Math.max(event.pageY - offsetY, 0);
				var newPos = {'left': event.pageX - offsetX + scroll.left, 'top': event.pageY - offsetY + scroll.top};
				newPos.right = (newPos.left + $card.width());
				newPos.bottom = (newPos.top + $card.height());

				element.setPosition({'x': newPos.left, 'y': newPos.top})
				var edgeDist = viewport.right - newPos.right;
				var vertDist = viewport.bottom - newPos.bottom ;
				//console.log((newPos.left + $card.width()) + " x " + viewport.right + " y " + $card.parent().width() + " z " + $card.parent().offset().left + " a " + $card.offset().left);

				if (edgeDist < -100) {
					win.scrollLeft(newPos.right + 35);
				}
				if (vertDist < -100) {
					win.scrollTop(newPos.bottom + 35);
				}
			});
		})

		$editCtrl.click(function(e){
			e.preventDefault();
			e.stopPropagation();
			element.beginEdit();
		});

		$delCtrl.click(function(e){
			e.preventDefault();
			e.stopPropagation();
			element.title = $card.find(titleSelector).text();
			element.content = $card.find(contentSelector).text();
			if ((element.title == element.defaults.title) && (element.content == element.defaults.content)) {
				element.deleted = true;
				$card.remove();
				raiseEvent("cardDeleted");
			} else {
				$card.addClass(deletingClass);

				$(document).one('click', function( e ) {
					$card.removeClass(deletingClass);
				})				
			}
		});

		$cancelEditCtrl.click(function(e){
			e.preventDefault();
			element.endEdit(true);
		});

		$acceptEditCtrl.click(function(e){
			e.preventDefault();
			element.endEdit();
		});


		$archiveBtn.click(function(e) {
			element.title = $card.find(titleSelector).text();
			element.content = $card.find(contentSelector).text();
			if ((element.title == element.defaults.title) && (element.content == element.defaults.content)) {
				element.deleted = true;
				$card.remove();
				raiseEvent("cardDeleted");
			} else {
				$card.addClass(archiveClass);	
				raiseEvent("cardArchived", "");
			}
		})

		$colorCtrl.click(function(e){
			e.preventDefault();
			e.stopPropagation();
			if (!element.paletteElement) {
				element.paletteElement = $(element.paletteTemplate);
				$card.append(element.paletteElement);
			}
			var $palette = element.paletteElement;
			raiseEvent("cardColorStart", "");
			element.selectingColor = true;
			$card.addClass('swatching');

			var placeX = '-9.5rem'; // ($(this).offset().left +  $(this).width())
			var placeY = '1rem'; // ($(this).offset().top + $(this).height())

			$palette.css('z-index', 5000);
			$palette.css('right', placeX);
			$palette.css('top', placeY);
			$palette.show();

			element.popToTop();

			$palette.find('.card-label').click(function(e){
				$('.card-label').unbind('click');
				var paletteClass = element.getPalette();
				element.clearSwatch();
				$card.find('[data-' + paletteFlag + '="true"]').addClass(element.getSwatchColor(this));
				$card.addClass(paletteClass);
				raiseEvent("cardColorSet", "");
			})

			$palette.find('.card-category').click(function(e){
				$('.card-category').unbind('click');
				var paletteClass = element.getPalette();
				element.clearCategory();
				$card.find('[data-' + categoryFlag + '="true"]').addClass(element.getSwatchColor(this));
				$card.addClass(paletteClass);
				raiseEvent("cardColorSet", "");
			})

			$(document).one('click', function( e ) {
				element.selectingColor = false;
				raiseEvent("cardColorEnd", "");
			})
		});

		$editTriggers.dblclick(function(e) {
			if (!$card.hasClass(editClass)) {
				element.beginEdit(e.target);	
			}
		});
	}


	this.getHTML = function() {

		this.cardContainer = $(this.template);
		this.handle = $(this.cardContainer).find(handleSelector);
		var $card = $(this.cardContainer);
		var $content = $card.find(contentSelector);

		$card.find(titleSelector).text(this.title);
		$content.text(this.content);
		$card.toggleClass(archiveClass, this.archived);
		$card.addClass(this.palette);
		$card.find('[data-' + paletteFlag + '="true"]').addClass(this.swatch);
		$card.find('[data-' + categoryFlag + '="true"]').addClass(this.category);

	}

	this.beginEdit = function(selectedElement) {
		var element = this;
		var $card = $(this.cardContainer);
		var $content = $card.find(contentSelector);
		var $title = $card.find(titleSelector);
		this.revertedData.title = $title.text();
		this.revertedData.content = $content.text();

		raiseEvent("cardEditStart", "");


		$card.addClass(editClass);
		$card.find('[data-editable="true"]').attr('contenteditable', true);

		var $focusTarget = $title;
		var isDefaultContent = (this.revertedData.title == this.defaults.title);
		if ($(selectedElement).hasClass(contentSelector.replace(".", ''))) {
			$focusTarget = $content;
			isDefaultContent = (this.revertedData.content == this.defaults.content);
		}

		setTimeout(function () {
			$focusTarget.focus();
			if (isDefaultContent) {
				$focusTarget.contentSelect();
			} 
			
		}, 10);

		$title.keydown(function (e) {
			var code = e.keyCode || e.which;
			if (code == "9") {
				$content.focus();
				if ($content.text() == element.defaults.content) {$content.contentSelect();}
				return false;
			}
			if (e.ctrlKey && (code == 13 || code == 10)) {
				//Chrome returns a 10 when the ctrl key is also pressed, but other browsers return 13.
				element.endEdit();
				return false;
			}
		})

		$content.keydown(function (e) {
			var code = e.keyCode || e.which;
			if (code == "9") {
				$title.focus();
				if ($title.text() == element.defaults.title) {$title.contentSelect();}
				return false;
			}
			if (e.ctrlKey && (code == 13 || code == 10)) {
				element.endEdit();
				return false;
			}
		})

		$(document).on('click', function( e ) {
			if ($(e.target).closest('.' + editClass).length == 0) {
				element.confirmEdit();
				//$card.addClass(editConfirmClass);
				
			}
		})
	}

	this.confirmEdit = function() {
		var $card = $(this.cardContainer);
		var $title = $card.find(titleSelector);
		var $content = $card.find(contentSelector);

		if (($title.text() != this.revertedData.title) || ($content.text() != this.revertedData.content)) {
			$card.addClass(editConfirmClass);
		} else {
			this.endEdit();
		}

	}

	this.endEdit = function(revertChanges) {
		var $card = $(this.cardContainer);
		var $content = $card.find(contentSelector);
		if(revertChanges) {
			$card.find(titleSelector).text(this.revertedData.title);
			$content.text(this.revertedData.content);
		} else {
			this.title = $card.find(titleSelector).text();
			this.content = $card.find(contentSelector).text();
		}
		$(document).unbind('click');
		$card.removeClass(editClass);
		$card.removeClass(editConfirmClass);
		raiseEvent("cardEditEnd", "");
	}

	this.reinit = function() {
		this.defineEvents();
	}

	this.height = function() {
		return this.cardContainer.height() + parseFloat(this.cardContainer.css('margin-top')) + parseFloat(this.cardContainer.css('margin-bottom'));
	}

	this.width = function() {
		return this.cardContainer.width() + parseFloat(this.cardContainer.css('margin-left')) + parseFloat(this.cardContainer.css('margin-right'));
	}

	this.setPosition = function(position) {
		this.position = position;
		this.cardContainer.css('left', this.position.x);
		this.cardContainer.css('top', this.position.y);
	}

	this.clearSwatch = function() {
		this.clearSwatchClass(paletteFlag);
	}


	this.clearCategory = function() {
		this.clearSwatchClass(categoryFlag);
	}

	this.clearSwatchClass = function(dataFlag) {
		var $card = this.cardContainer;
		$card.find('[data-' + dataFlag + '="true"]').each(function(index, value){
			var $element = $(this);
			var classes = $(this).classes();
			for (var i = 0; i < classes.length; i++){
				var thisClass = classes[i];
				if (thisClass.indexOf(paletteString) > -1) {
					$element.removeClass(thisClass);
				}
			}
		})
	}

	this.getSwatchColor = function(thisElement) {
		var $card = this.cardContainer;
		if (!thisElement) {thisElement = paletteFlag;}

		if ($(thisElement).length > 0) {
			//Check to see if a valid element was sent (clicked on a swatch)
			return this.getSwatchClass(thisElement);
		} else if ($card.find('[data-' + thisElement + '="true"]').length > 0) {
			//Check to see if a valid data flag was sent
			return this.getSwatchClass($card.find('[data-' + thisElement + '="true"]'));
		} else {
			//Default to the palette flag if nothing else worked.
			return this.getSwatchClass($card.find('[data-' + paletteFlag + '="true"]'));
		}
	}

	this.getSwatchClass = function(thisSwatch) {
		var swatch = ''
		if (!thisSwatch) {thisSwatch = $(this.cardContainer).find('[data-' + paletteFlag + '="true"]')}
		var classes = $(thisSwatch).classes();
		for (var i = 0; i < classes.length; i++){
			var thisClass = classes[i];
			if (thisClass.indexOf(paletteString) > -1){
				swatch = thisClass;
			}
		}
		return swatch;
	}

	this.getPalette = function() {
		var $palette = this.cardContainer;
		var paletteClass = '';
		var classes = $palette.classes();
		for (var i = 0; i < classes.length; i++){
			var thisClass = classes[i];
			if (thisClass.indexOf('palette-') > -1){
				paletteClass = thisClass;
			}
		}
		return paletteClass;
	}

	this.updateHTML = function() {
		this.html = this.cardContainer[0].outerHTML;
	}

	this.init = function(initEdit) {
		this.cardContainer = $(this.template);
		this.handle = $(this.cardContainer).find(handleSelector);
		
		this.defineEvents();
		if(initEdit) this.beginEdit();
	}

	var editCard = true;
	if (cardData) {
		for (var propt in cardData) {
			if (propt) {
				this[propt] = cardData[propt]
			}
		}
		editCard = false;
	} 

	this.init(editCard);

	this.setSwatch = function(swatch) {
		this.cardContainer.find('[data-paletted="true"]').removeClass(this.swatch).addClass(swatch);
		this.swatch = swatch;
	}

	this.setPalette = function(palette) {
		this.cardContainer.removeClass(this.palette).addClass(palette);
		this.palette = palette;
	}

	this.popToTop = function() {
		$('.story-card').css('z-index', '');
		this.cardContainer.css('z-index', 900);
	}

	function popToTop(thisCard) {
		$('.story-card').css('z-index', '');
		$(thisCard).css('z-index', 900);
	}

}
function raiseEvent(eventName, eventDescription, eventElement) {
	var event = new CustomEvent(
		eventName, 
		{
			detail: {
				message: eventDescription,
				time: new Date(),
			},
			bubbles: true,
			cancelable: true
		}
	);
	if (!eventElement) {
		eventElement = $('body')[0];
	}
	eventElement.dispatchEvent(event);
}


