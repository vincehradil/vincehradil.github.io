
var callback = function (context, data, pageNumber) {
	var container = $("#" + data.id, context);

	//Holder variables for if the button has been clicked, the answer chosen, 
	// and text for the radioButton chosen by the user
	var radioClicked;
	var radioAns;
	var radioText;
	// Once the user has selected an answer, indicate 
	$('.question_answer_button', context).click(function (event) {
		radioClicked = true;
		radioAns = event.target.title;
		radioText = event.target.parentElement.textContent;
	});
	// Once the user has submitted an answer, indicate & export
	function attemptSubmit() {
		SharedData.setter(data.exports_to, [radioAns, radioText, $('.answer_text', context).val().trim()], pageNumber);
		
		// Check if the user has input an answer before moving forward
		var answeredQuestion = $('.answer_text', context).val().trim() !== '';
		//set the page to completed when the button has been clicked and the text area has input
		if (answeredQuestion && radioClicked) {
			container.removeClass("error");
			container.addClass("completed");
		} else {
			container.addClass("error");
			container.removeClass("completed");
		}
		
		return answeredQuestion && radioClicked;
	};
		
	// Submit the answer if the user presses the enter key while
	// the text field is focused
	$('form', context).submit(function (event) {		
		/**
		 * Uncomment if you want the Enter key to also submit the form
		var submitResult = attemptSubmit();
		
		// Force page flip if an answer was typed and the user
		// pressed the Enter key instead of clicking "Next Page"
		if (submitResult === true) {
			VignetteController.nextPage();
		}
		*/
		
		// Prevent submission of form from redirecting and refreshing the page
		return false;
	});
	
	VignetteController.addPageFlipListener(function (event) {
		// Check answers before moving forward
		if (event.type === "flip") {
			if (event.direction === "forward") {
				var submitResult = attemptSubmit();
				return submitResult;
			}
		}

		// And ignore other events
		return true;
	});

	// Setup reporting for questions
	//  Only exports a #
	VignetteController.addReportListener(function () {
		var result = {};
		if (typeof SharedData.getter(data.exports_to) !== "undefined") {
			result = Report.format(data, {
				answer: SharedData.getter(data.exports_to)[0]
			
			});
		}
		return result;
	});

	// If this question has been answered before but it is now being reloaded,
	// reselect the old answer choice from SharedData
	var currentAnswer = SharedData.getter(data.exports_to);
	if (typeof currentAnswer !== "undefined") {
		// Get the radio button for the user's old answer choice and check it
		$('.question_answer_button', context).eq(currentAnswer[0][0]).attr('checked', 'checked');
		//set the radio button to checked
		radioClicked = true;
		radioAns = currentAnswer[0][1];
		radioText = currentAnswer[0][2];
		// Set the input text field to the previous answer
		$('.answer_text', context).val(currentAnswer[0][2].trim());
		// Mark the question as completed
		container.addClass("completed");
	}
};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/question-text-radio", callback);
};
