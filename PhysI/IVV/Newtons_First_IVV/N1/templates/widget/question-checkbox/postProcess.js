
var callback = function (context, data, pageNumber) {
	var container = $("#" + data.id, context);
	
	// Once the user has selected an answer, indicate & export
	$('.question_answer_button', context).click(function (event) {
		//Find the check boxes that are checked and then pass them to the shared data
		var boxes = [];
		
		container.find( '.question_answer_button' ).each( function(index,element)
		{
			if(element.checked) {
				boxes.push(element.value);
			}
		});
		
		container.addClass("completed");
		//send the boxes that were checked to the shared data
		SharedData.setter(data.exports_to, boxes, pageNumber);
	});

	VignetteController.addPageFlipListener(function (event) {
		// Check answers before moving forward
		if (event.type === "flip") {
		//Check if any of the boxes are checked, if so then they may proceed, if not then alert them that at least one answer must be selected
			completed = false;
			container.find( '.question_answer_button' ).each( function(index,element)
			{
				if(element.checked) {
					completed = true;
				}
				else {
					completed = false;
				}
				if(completed) {
					return false;
				}
			});
			if (completed) {
				container.addClass("completed"); 
			}
			else {
				container.removeClass("completed");
			}
			
			
			if (event.direction === "forward") {
				var isCompleted = container.hasClass("completed");
				if (isCompleted) {
					container.removeClass("error");
				} else {
					container.addClass("error");
				}
				return isCompleted;
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
	// reselect the old answer choice(s) from SharedData
	var currentAnswer = SharedData.getter(data.exports_to);
	if (typeof currentAnswer !== "undefined") {
		// For each check box set its value correctly
		for (var i = 0; i < currentAnswer[0].length; i++) {
			container.find( '.question_answer_button' )[currentAnswer[0][i]].checked = true;
		}

		// Mark the question as completed
		container.addClass("completed");
	}
};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/question-checkbox", callback);
};
