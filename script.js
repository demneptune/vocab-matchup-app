



//to do
	//top set of answers: in the order in which they were answered
	//bottom set: in the order per original text
	//allow double columns: 4 cols for the words
	//explicit grouping according to brackets [word12] produces "word" that links to vocab item 12
	//click a word in the answers to highlight that word in text




$(document).ready(function() {
  // Dummy: change text size
  $('#sizeRange').on('input', function() {
    $('#textColumn').css('font-size', $(this).val() + 'px');
  });

	$(function() {
		  var $resizer = $('#columnResizer');
		  var $leftCol = $('#textColumn');
		  var $rightCol = $('.vocab-columns-area').parent(); // Target the container that holds the vocab columns area
		  var isResizing = false;

		  $resizer.on('mousedown', function(e) {
			isResizing = true;
			$('body').css('cursor', 'col-resize');
		  });

		  $(document).on('mousemove', function(e) {
			if (!isResizing) return;

			var containerOffsetLeft = $leftCol.parent().offset().left;
			var containerWidth = $leftCol.parent().width();

			var newLeftWidth = e.clientX - containerOffsetLeft;
			var minWidth = containerWidth * 0.2; // 20% minimum
			var maxWidth = containerWidth * 0.8; // 80% maximum

			if (newLeftWidth < minWidth) newLeftWidth = minWidth;
			if (newLeftWidth > maxWidth) newLeftWidth = maxWidth;

			$leftCol.css('flex', '0 0 ' + newLeftWidth + 'px');
			$rightCol.css('flex', '1 1 400px');


			// After resizing, redistribute columns
			if (window.vocabApp && window.vocabApp.columnManager) {
				window.vocabApp.columnManager.checkSpaceAndRedistribute();
			}

		  });

		  $(document).on('mouseup', function(e) {
			if (isResizing) {
			  isResizing = false;
			  $('body').css('cursor', '');
			}
		  });
		});


});
