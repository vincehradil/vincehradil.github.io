
var callback = function (context, data, pageNumber) {
	var container = $("#" + data.id, context);
	var selectedAnswer = -1;

	// Once the user has submitted an answer, indicate & export
	function attemptSubmit() {
		var radioButtons = $('.question_answer_button', context);
		
		for( var i = 0; i < radioButtons.length; i++ )
		{
			if( radioButtons[i].checked === true )
			{
				selectedAnswer = i;
				break;
			}
		}
	
		SharedData.setter(data.exports_to, selectedAnswer, pageNumber);
			
		// Check if the user has input an answer before moving forward
		if (selectedAnswer >= 0) {
			container.removeClass("error");
			container.addClass("completed");
		} else {
			container.addClass("error");
			container.removeClass("completed");
		}
		
		return selectedAnswer >= 0;
	};
	
	// Once the user has selected an answer, indicate & export
	$('.question_answer_button', context).click(function (event) {
		container.addClass("completed");
		SharedData.setter(data.exports_to, event.target.title, pageNumber);
		// The following was added in the summer of 2012 in order to
		// accommodate non-linear page progression(branching).
		VignetteController.setTargetBranch(event.target.title);
		VignetteController.setPageNode(data.exports_to);
		// End addition
	});

	VignetteController.addPageFlipListener(function (event) {
		// Check answers before moving forward
		if (event.type === "flip") {
			if (event.direction === "forward") {
				var submitResult = attemptSubmit();
				return submitResult;
			}
		} else if(event.type === "load") {
			updateTargetBranch();
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

	//Used to set the target branch properly when the page is loaded
	var updateTargetBranch = function () {
	
		// If this question has been answered before but it is now being reloaded,
		// reselect the old answer choice from SharedData
		var currentAnswer = parseInt(SharedData.getter(data.exports_to));
		if (typeof currentAnswer !== "undefined" && !isNaN(currentAnswer) && currentAnswer >= 0) {
			// Get the radio button for the user's old answer choice and check it
			$('.question_answer_button', context).eq(currentAnswer).attr('checked', 'checked');
			
			//set target branch
			SharedData.setter(data.exports_to, currentAnswer, pageNumber);
			VignetteController.setTargetBranch(currentAnswer);
			VignetteController.setPageNode(data.exports_to);
			
			// Mark the question as completed
			container.addClass("completed");
		}
	};
	
};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/question-branch", callback);
};
