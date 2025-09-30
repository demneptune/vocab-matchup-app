// Classes.js


//NEW CODE FROM NEW CONVERSATION

//StateVariables is for all state variables
//@StateVariables
class StateVariables {
	#isExerciseLoaded;
	constructor() {
		this.#isExerciseLoaded = false;
	}
	getIsExerciseLoaded() { return this.#isExerciseLoaded; }
	setIsExerciseLoaded(val) { this.#isExerciseLoaded = !!val; }
}




class ColumnManager {
    constructor() {
        this.minColumnWidth = 150;
        this.gap = 12; // gap between columns
        this.currentLayout = {
            vocabColumns: 1,
            definitionColumns: 1
        };
    }
    
    init() {
        this.checkSpaceAndRedistribute();
        $(window).on('resize', () => this.checkSpaceAndRedistribute());
    }
    
	
	//redistributing clears items first (both vocab and definition columns
    checkSpaceAndRedistribute() {
        const availableWidth = this.getAvailableVocabWidth();
        this.calculateOptimalColumns(availableWidth);
        this.updateColumnVisibility();
        this.redistributeItems();
    }
    
    calculateOptimalColumns(availableWidth) {
        // Calculate how many columns can fit in the available space
        // Each column needs minColumnWidth + gap space
        const maxColumnsPerSide = Math.floor((availableWidth - this.gap) / (2 * (this.minColumnWidth + this.gap)));
        
        // Determine column layout based on available space
        if (maxColumnsPerSide >= 2) {
            // Enough space for 2 columns each (4 total)
            this.currentLayout.vocabColumns = 2;
            this.currentLayout.definitionColumns = 2;
        } else if (maxColumnsPerSide >= 1.5) {
            // Enough space for 3 columns total - give extra column to taller side
            const vocabHeight = $('#vocabCol1 .vocab-word-column').height();
            const defHeight = $('#defCol1 .definition-column').height();
            
            if (vocabHeight > defHeight) {
                this.currentLayout.vocabColumns = 2;
                this.currentLayout.definitionColumns = 1;
            } else {
                this.currentLayout.vocabColumns = 1;
                this.currentLayout.definitionColumns = 2;
            }
        } else {
            // Only enough space for 1 column each (2 total)
            this.currentLayout.vocabColumns = 1;
            this.currentLayout.definitionColumns = 1;
        }
    }
    
    updateColumnVisibility() {
        // Show/hide vocab columns based on current layout
        $('#vocabCol1').show(); // Always show first column
        $('#vocabCol2').toggle(this.currentLayout.vocabColumns === 2);
        
        // Show/hide definition columns based on current layout
        $('#defCol1').show(); // Always show first column
        $('#defCol2').toggle(this.currentLayout.definitionColumns === 2);
    }
    
	//this clears columns in prep for redistribution
    redistributeItems() {
        this.redistributeVocabItems();
        this.redistributeDefinitionItems();
    }
    
    redistributeVocabItems() {
        const allItems = $('.vocab-word-item').detach();
        const columns = this.currentLayout.vocabColumns;
        const itemsPerColumn = Math.ceil(allItems.length / columns);
        
        // Clear existing columns
		if (appState.getIsExerciseLoaded()) {
			$('#vocabCol1 .vocab-word-column, #vocabCol2 .vocab-word-column').empty();
		}
        
        // Distribute items to visible columns
        for (let i = 0; i < columns; i++) {
            const startIndex = i * itemsPerColumn;
            const endIndex = startIndex + itemsPerColumn;
            const columnItems = allItems.slice(startIndex, endIndex);
            
            if (i === 0) {
                columnItems.appendTo('#vocabCol1 .vocab-word-column');
            } else if (i === 1) {
                columnItems.appendTo('#vocabCol2 .vocab-word-column');
            }
        }
    }
    
    redistributeDefinitionItems() {
        const allItems = $('.definition-item').detach();
        const columns = this.currentLayout.definitionColumns;
        const itemsPerColumn = Math.ceil(allItems.length / columns);
        
        // Clear existing columns
		if (appState.getIsExerciseLoaded()) {
			$('#defCol1 .definition-column, #defCol2 .definition-column').empty();
		}
        
        // Distribute items to visible columns
        for (let i = 0; i < columns; i++) {
            const startIndex = i * itemsPerColumn;
            const endIndex = startIndex + itemsPerColumn;
            const columnItems = allItems.slice(startIndex, endIndex);
            
            if (i === 0) {
                columnItems.appendTo('#defCol1 .definition-column');
            } else if (i === 1) {
                columnItems.appendTo('#defCol2 .definition-column');
            }
        }
    }
    
    getAvailableVocabWidth() {
        return $('#vocabColumnsContainer').width() || 400;
    }
    
    // Call this after loading new exercise
    refreshColumns() {
        this.checkSpaceAndRedistribute();
    }
}


//END NEW CODE




class ExerciseParser {

    parseInput(rawText) {
        if (!rawText.trim()) return { valid: false, error: 'Empty input' };
        
        const lines = rawText.split('\n');
        
        // FIX: Find the VOCAB: marker instead of empty line
        const vocabStartIndex = lines.findIndex(line => line.trim().toUpperCase().startsWith('VOCAB:'));
        
        if (vocabStartIndex === -1) return { valid: false, error: 'Missing VOCAB: section' };
        
        // Text section is everything before VOCAB:
        const textSection = lines.slice(0, vocabStartIndex).join('\n');
        const vocabSection = lines.slice(vocabStartIndex);
        
        try {
            const vocabulary = this.parseVocabSection(vocabSection);
            const processedText = this.processTextAnnotations(textSection, vocabulary);
            
            return {
                valid: true,
                text: processedText,
                vocabulary: vocabulary,
                rawText: textSection
            };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
    
    processTextAnnotations(text, vocabulary) {
        const annotationRegex = /\[([^\]]+?)(\d+)\]/g;
        
        // Replace line breaks with <br>
        const textWithLineBreaks = text.replace(/\n/g, '<br>');
        
        const processedText = textWithLineBreaks.replace(annotationRegex, (fullMatch, word, id) => {
            const vocabItem = vocabulary.find(item => item.id === parseInt(id));
            return vocabItem ? `<span class="text-word" data-id="${id}">${word}</span>` : word;
        });
        
        return processedText;
    }
    
    parseVocabSection(lines) {
        const vocabulary = [];
        const vocabStart = lines.findIndex(line => line.trim().toUpperCase().startsWith('VOCAB:'));
        
        if (vocabStart === -1) throw new Error('Missing VOCAB: section');
        
        const vocabLines = lines.slice(vocabStart + 1);
        
        vocabLines.forEach((line) => {
            line = line.trim();
            if (!line) return;
            
            const match = line.match(/^(\d+)\s+(.+?)\s*[-—]\s*(.+)$/);
            if (match) {
                const [, id, word, translation] = match;
                vocabulary.push({
                    id: parseInt(id),
                    word: word.trim(),
                    translation: translation.trim()
                });
            }
        });
        
        if (vocabulary.length === 0) throw new Error('No valid vocabulary items found');
        return vocabulary;
    }
    

}


class UIManager {
	constructor() {
        this.elements = {
            textColumn: $('#textColumn .sentence'),
            // FIXED: Target the specific column content areas in our fixed HTML structure
            vocabCol1Content: $('#vocabCol1 .vocab-word-column'),
            vocabCol2Content: $('#vocabCol2 .vocab-word-column'), 
            defCol1Content: $('#defCol1 .definition-column'),
            defCol2Content: $('#defCol2 .definition-column'),
            completedTop: $('#completedTop'),
            completedBottom: $('#completedBottom'),
            textPreview: $('#textPreview'),
            vocabPreview: $('#vocabPreview')
        };
    }

	clearAll() {
		// Use the new column content element names that match your constructor
		this.elements.vocabCol1Content.empty();
		this.elements.vocabCol2Content.empty();
		this.elements.defCol1Content.empty();
		this.elements.defCol2Content.empty();
		this.elements.completedTop.empty();
		this.elements.completedBottom.empty();
		this.elements.textColumn.html('');
		this.clearAllHighlighting();
	}
    
    renderExercise(exerciseData) {
        this.clearAll();
        this.renderText(exerciseData.text);
        this.renderVocabLists(exerciseData.vocabulary);
    }
    
    renderText(processedText) {
        this.elements.textColumn.html(processedText);
    }

	renderVocabLists(vocabulary) {
        
        // Clear all column content areas
        this.elements.vocabCol1Content.empty();
        this.elements.vocabCol2Content.empty();
        this.elements.defCol1Content.empty();
        this.elements.defCol2Content.empty();
        
        // Put ALL vocab items in first column initially (ColumnManager will redistribute)
        vocabulary.forEach(item => {
            this.elements.vocabCol1Content.append(`
                <div class="matchable-item vocab-word-item" data-id="${item.id}">
                    <div class="vocab-word-text">${item.word}</div>
                </div>
            `);
        });

        // Put ALL definition items in first column initially (ColumnManager will redistribute)
        const shuffled = this.shuffleArray([...vocabulary]);
        shuffled.forEach(item => {
            this.elements.defCol1Content.append(`
                <div class="matchable-item definition-item" data-id="${item.id}">
                    <div class="def">${item.translation}</div>
                </div>
            `);
        });
        
        // Trigger column redistribution after content is loaded
        if (window.vocabApp && window.vocabApp.columnManager) {
            setTimeout(() => {
                window.vocabApp.columnManager.refreshColumns();
            }, 100);
        }
    }

    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

	highlightWord(wordId, wordType, isReadonlyHighlight = false) {
		let elements;
		if (isReadonlyHighlight) {
			// Context highlighting (completed items) - different class
			elements = $(`.text-word[data-id="${wordId}"], .completed-matchable-item[data-id="${wordId}"]`);
			elements.toggleClass('readonly-highlighted');
		} else {
			// Regular highlighting for active matching
			elements = wordType === 'vocabWord' ? 
				$(`.vocab-word-item[data-id="${wordId}"], .text-word[data-id="${wordId}"]`) :
				$(`.definition-item[data-id="${wordId}"]`);
			elements.toggleClass('highlighted');
		}
		
		return isReadonlyHighlight ? !elements.hasClass('readonly-highlighted') : !elements.hasClass('highlighted');
	}

	clearHighlighting(wordType = 'all') {
		if (wordType === 'vocabWord' || wordType === 'all') {
			$('.vocab-word-item, .text-word').removeClass('highlighted');
			$('.completed-matchable-item, .text-word').removeClass('readonly-highlighted');
		}
		if (wordType === 'definition' || wordType === 'all') {
			$('.definition-item').removeClass('highlighted');
		}
	}
    
    clearAllHighlighting() {
        $('.matchable-item, .text-word').removeClass('highlighted');
    }
    
	//NEW CODE TO FIX THE UNDO FEATURE, EXTRA CHANGE TO ADD HIGHLIGHTING OF COMPLETED WORDS
		addToCompleted(matchData, userAnswerId = null) {
			const itemHtml = `
				<li class="completed-matchable-item" 
					data-vocab-word-id="${matchData.vocabWordItem.id}" 
					data-definition-id="${matchData.definitionItem.id}"
					data-id="${matchData.vocabWordItem.id}">
					<span class="completed-word-text">${matchData.vocabWordItem.word}</span> - ${matchData.definitionItem.translation}
					<button class="undo-btn" title="Return to vocab lists">↶</button>
				</li>
			`;
			
			this.elements.completedTop.append(itemHtml);
			this.elements.completedBottom.append(itemHtml);
		}
	//END NEW CODE
    
    getWordTranslation(wordId) {
        const item = $(`.matchable-item[data-id="${wordId}"]`);
        return item.length ? item.find('.def').text() : 'Unknown';
    }
    
    removeFromCompleted(matchId) {
        $(`[data-match-id="${matchId}"]`).remove();
    }
    
    showVocabItem(wordId, show = true) {
        $(`.matchable-item[data-id="${wordId}"]`).toggle(show);
    }
    
    // Only called when checking answers
    showAnswerResults(results, vocabulary) {
        this.clearAllHighlighting();
        
        // Mark correct answers in green
        results.correct.forEach(wordId => {
            $(`.matchable-item[data-id="${wordId}"]`).addClass('correct-answer');
            $(`.text-word[data-id="${wordId}"]`).addClass('correct-answer');
        });
        
        // Mark incorrect answers in red and show correct answer
        results.incorrect.forEach(incorrect => {
            $(`.matchable-item[data-id="${incorrect.wordId}"]`).addClass('incorrect-answer');
            $(`.text-word[data-id="${incorrect.wordId}"]`).addClass('incorrect-answer');
            
            // Update completed list to show correction
            const correctTranslation = this.getWordTranslation(incorrect.wordId);
            $(`[data-match-id="${incorrect.wordId}"]`)
                .addClass('incorrect-completed')
                .html(`
                    ${this.getWordFromId(incorrect.wordId)} - ${this.getWordTranslation(incorrect.userAnswerId)}
                    <span class="correction">(Correct: ${correctTranslation})</span>
                    <button class="undo-btn" title="Return to vocab lists">↶</button>
                `);
        });
        
        // Show missing answers in the vocab lists
        results.missing.forEach(wordId => {
            $(`.matchable-item[data-id="${wordId}"]`).addClass('missing-answer');
            $(`.text-word[data-id="${wordId}"]`).addClass('missing-answer');
        });
    }
    
    getWordFromId(wordId) {
        const item = $(`.vocab-word-item[data-id="${wordId}"]`);
        return item.length ? item.find('.vocab-word-text').text() : 'Unknown';
    }
    
    showPreview(parsedData) {
        if (parsedData.valid) {
            this.elements.textPreview.html(parsedData.text);
            this.elements.vocabPreview.html(
                parsedData.vocabulary.map(item => 
                    `<div>${item.id}. ${item.word} - ${item.translation}</div>`
                ).join('')
            );
        } else {
            this.elements.textPreview.text('Invalid format');
            this.elements.vocabPreview.text('');
        }
    }
}

class AnswerChecker {
    constructor(vocabulary) {
        this.vocabulary = vocabulary;
    }
    
    checkAnswers(matchedPairs) {
        const results = {
            correct: [],
            incorrect: [], // {wordId, userAnswerId}
            missing: []
        };
        
        this.vocabulary.forEach(item => {
            const userMatch = matchedPairs.get(item.id);
            if (userMatch) {
                if (userMatch.userAnswerId === item.id) {
                    results.correct.push(item.id);
                } else {
                    results.incorrect.push({
                        wordId: item.id,
                        userAnswerId: userMatch.userAnswerId
                    });
                }
            } else {
                results.missing.push(item.id);
            }
        });
        
        return results;
    }
}

class VocabularyMatcher {
    constructor(exerciseData, uiManager) {
        this.exerciseData = exerciseData;
        this.uiManager = uiManager;
        this.answerChecker = new AnswerChecker(exerciseData.vocabulary);
        this.currentVocabWordId = null;
        this.currentDefinitionId = null;
        this.matchedPairs = new Map();
    }
    
    init() {
        this.setupClickHandlers();
    }
	
	destroy() {
        // Remove all event listeners
        $('.text-word, .matchable-item, .undo-btn').off('click');
        // Clear any intervals/timeouts
        // Nullify references
        this.matchedPairs.clear();
    }

	setupClickHandlers() {
		$('.text-word, .matchable-item, .undo-btn').off('click');
		// vocabWord words click handler - ADD completed-matchable-item
		$(document).on('click', '.text-word, .vocab-word-item, .completed-matchable-item', (e) => {
			e.preventDefault();
			const target = $(e.target).closest('[data-id]');
			if (target.length) {
				const wordId = target.data('id');
				const source = $(e.target).hasClass('text-word') ? 'text' : 
							  ($(e.target).hasClass('completed-matchable-item') ||
								$(e.target).hasClass('completed-word-text'))
								? 'completed' : 'vocab';
				this.handleVocabWordClick(wordId, source);
			}
		});
		// Definition words click handler
		$(document).on('click', '.definition-item', (e) => {
			e.preventDefault();
			const wordId = $(e.target).closest('[data-id]').data('id');
			this.handleDefinitionClick(wordId);
		});
		
		// Undo buttons click handler - fix the reference
		$(document).on('click', '.undo-btn', (e) => {
			e.preventDefault();
			e.stopPropagation();
			const matchElement = $(e.target).closest('li');
			this.undoMatch(matchElement);
		});
	}
		
	handleVocabWordClick(wordId, source) {
		
		//FIX: check if word is in completed list
		const isAlreadyMatched = this.matchedPairs.has(wordId);
		
		// Immediately highlight the clicked word
		this.uiManager.clearHighlighting('vocabWord');
		this.uiManager.highlightWord(wordId, 'vocabWord', isAlreadyMatched);
		
		// If this is a second click on the same word, toggle off
		if (this.currentVocabWordId === wordId) {
			this.currentVocabWordId = null;
			this.uiManager.clearHighlighting('vocabWord');
			return;
		}
		
		//Only set currentVocabWordId for clicks from text or vocab list, AND if not already matched
		if (source !== 'completed' && !isAlreadyMatched) {
			this.currentVocabWordId = wordId;
		} else {
			this.currentVocabWordId = null;
		}
		
		if (source === 'text' || source === 'completed') {
			this.uiManager.clearHighlighting('definition');
			this.currentDefinitionId = null;
		}
		
		if (this.currentDefinitionId !== null) {
			this.createMatch(wordId, this.currentDefinitionId);
		}
	}
		
	handleDefinitionClick(wordId) {
		// Immediately highlight the clicked word
		this.uiManager.clearHighlighting('definition');
		this.uiManager.highlightWord(wordId, 'definition');
		
		// If this is a second click on the same word, toggle off
		if (this.currentDefinitionId === wordId) {
			this.currentDefinitionId = null;
			this.uiManager.clearHighlighting('definition');
			return;
		}
		
		this.currentDefinitionId = wordId;
		
		if (this.currentVocabWordId !== null) {
			this.createMatch(this.currentVocabWordId, wordId);
		}
	}
		
	createMatch(vocabWordId, definitionId) {
		const vocabWordVocabItem = this.exerciseData.vocabulary.find(item => item.id === vocabWordId);
		const definitionVocabItem = this.exerciseData.vocabulary.find(item => item.id === definitionId);
		
		this.matchedPairs.set(vocabWordId, {
			userAnswerId: definitionId,
			vocabWordItem: vocabWordVocabItem,
			definitionItem: definitionVocabItem
		});
		
		// Hide the matched words
		$(`.vocab-word-item[data-id="${vocabWordId}"]`).hide();
		$(`.definition-item[data-id="${definitionId}"]`).hide();
		
		this.uiManager.addToCompleted({
			vocabWordItem: vocabWordVocabItem,
			definitionItem: definitionVocabItem
		});
		
		this.clearCurrentSelection();
	}



	undoMatch(matchElement) {
		//console.log("in undoMatch, matchElement: ", matchElement);
		
		const vocabWordId = matchElement.data('vocabWordId');
		const definitionId = matchElement.data('definitionId');
		
		if (this.matchedPairs.has(vocabWordId)) {
			// Show both words back in their lists
			$(`.vocab-word-item[data-id="${vocabWordId}"]`).show();
			$(`.definition-item[data-id="${definitionId}"]`).show();
			
			// Remove from completed lists
			matchElement.remove();
			$(`[data-vocab-word-id="${vocabWordId}"]`).remove();
			
			this.matchedPairs.delete(vocabWordId);
		}
	}
		
    
    clearCurrentSelection() {
        this.currentVocabWordId = null;
        this.currentDefinitionId = null;
        this.uiManager.clearHighlighting('all');
    }
	

	checkAnswers() {
		const results = this.answerChecker.checkAnswers(this.matchedPairs);
		
		// Clear the completed sections first
		this.uiManager.elements.completedTop.empty();
		this.uiManager.elements.completedBottom.empty();
		
		// Show ALL answers in the completed top section
		this.exerciseData.vocabulary.forEach(item => {
			const userMatch = this.matchedPairs.get(item.id);
			const isCorrect = userMatch && userMatch.userAnswerId === item.id;
			const userAnswerId = userMatch ? userMatch.userAnswerId : null;
			
			let displayText = item.word + ' - ';
			
			if (isCorrect) {
				// Correct answer
				displayText += item.translation;
			} else if (userAnswerId) {
				// Wrong answer - show what user chose and correct answer
				const userAnswerItem = this.exerciseData.vocabulary.find(v => v.id === userAnswerId);
				const userAnswerText = userAnswerItem ? userAnswerItem.translation : 'Unknown';
				displayText += `<span class="wrong-answer">${userAnswerText}</span>`;
				displayText += ` <span class="correct-answer">(Correct: ${item.translation})</span>`;
			} else {
				// Missing answer
				displayText += `<span class="missing-answer">[Not answered]</span>`;
				displayText += ` <span class="correct-answer">(Correct: ${item.translation})</span>`;
			}
			
			const itemHtml = `
				<li class="answer-result ${isCorrect ? 'correct' : userAnswerId ? 'incorrect' : 'missing'}">
					${displayText}
				</li>
			`;
			
			this.uiManager.elements.completedTop.append(itemHtml);
			this.uiManager.elements.completedBottom.append(itemHtml);
		});

		// Mark the text and vocab lists with colors
		this.markTextAndVocabWithAnswers(results);

		// Disable further interaction
		this.disableInteraction();

		return results;
	}

	markTextAndVocabWithAnswers(results) {
		// Mark correct answers in green
		results.correct.forEach(wordId => {
			$(`.text-word[data-id="${wordId}"]`).addClass('correct-answer');
			$(`.vocab-word-item[data-id="${wordId}"]`).addClass('correct-answer');
		});
		
		// Mark incorrect answers in red
		results.incorrect.forEach(incorrect => {
			$(`.text-word[data-id="${incorrect.wordId}"]`).addClass('incorrect-answer');
			$(`.vocab-word-item[data-id="${incorrect.wordId}"]`).addClass('incorrect-answer');
		});
		
		// Mark missing answers in yellow
		results.missing.forEach(wordId => {
			$(`.text-word[data-id="${wordId}"]`).addClass('missing-answer');
			$(`.vocab-word-item[data-id="${wordId}"]`).addClass('missing-answer');
		});
	}

	disableInteraction() {
		// Remove all click handlers to prevent further interaction
		$('.text-word, .matchable-item, .undo-btn').off('click');
		
		// Grey out the interface to indicate it's finished
		$('.matchable-item, .text-word').css('opacity', '0.6');
		$('.matchable-item, .text-word').css('pointer-events', 'none');
	}
}


//assumes valid data
class ExerciseLoader {
    loadExercise(parsedData, uiManager) {
        const setSize = parseInt($('#setSizeSelect').val());
        let vocabulary = parsedData.vocabulary;
        
        if (setSize > 0 && setSize < vocabulary.length) {
            vocabulary = vocabulary.slice(0, setSize);
        }
        const exerciseData = {
            ...parsedData,
            vocabulary: vocabulary
        };
		appState.setIsExerciseLoaded(true);
        uiManager.renderExercise(exerciseData);
        return new VocabularyMatcher(exerciseData, uiManager);
    }
}

// Main application controller
class VocabularyMatchupApp {
    constructor() {
        this.parser = new ExerciseParser();
        this.uiManager = new UIManager();
        this.exerciseLoader = new ExerciseLoader();
		this.columnManager = new ColumnManager();
        this.matcher = null;
    }
    
    init() {
        this.setupEventListeners();
        this.setupPreview();
		this.columnManager.init(); //NEW CODE
    }
    
    setupEventListeners() {
        $('#loadExerciseBtn').click(() => this.loadExercise());
        $('#answerBtn').click(() => this.checkAnswers());
        $('#completedTopWrapper .btn').click(() => this.toggleCompletedTop());
        
        $('#sizeRange').on('input', (e) => {
            $('#textColumn').css('font-size', e.target.value + 'px');
        });
		// Add to setupEventListeners() in VocabularyMatchupApp class:
		$('#copyPromptBtn').click(() => {
			const promptText = $('#aiPrompt');
			promptText.select();
			document.execCommand('copy');
			
			// Show feedback
			const originalText = $('#copyPromptBtn').text();
			$('#copyPromptBtn').text('Copied!');
			setTimeout(() => {
				$('#copyPromptBtn').text(originalText);
			}, 2000);
		});
    }
    
    setupPreview() {
        $('#exerciseInput').on('input', () => {
            const parsed = this.parser.parseInput($('#exerciseInput').val());
            this.uiManager.showPreview(parsed);
        });
    }
    
    loadExercise() {
        const inputText = $('#exerciseInput').val();
        const parsedData = this.parser.parseInput(inputText);
        
        if (parsedData.valid) {
			if (this.matcher) {
				this.matcher.destroy(); // Add destroy method
			}
            this.matcher = this.exerciseLoader.loadExercise(parsedData, this.uiManager);
            this.matcher.init();
			this.columnManager.checkSpaceAndRedistribute(); //NEW CODE
        } else {
            alert('Error: ' + parsedData.error);
        }
    }
    
    checkAnswers() {
        if (this.matcher) {
            this.matcher.checkAnswers();
        }
    }
    
    toggleCompletedTop() {
        $('#completedTop').toggle();
    }
}

$(document).ready(function() {
	window.appState = new StateVariables();
    window.vocabApp = new VocabularyMatchupApp();
    window.vocabApp.init();
});

