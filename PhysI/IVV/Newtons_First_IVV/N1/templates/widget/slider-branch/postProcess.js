var callback = function (context, data, pageNumber) {
	var container = $("#" + data.id, context);
	var sliderValues = []; //% of each slider
	var adjustedSliderValues = []; // Value of the slider input based on the range in the JSON
	
	//Set up event handlers for each slider separately
	$.each(data.sliders, function(index, sliderData) {
		//Slider
		var slider = $('.slider-' + index, context);
		//Marker
		var marker = $('.slider-' + index + ' > .slider_marker', context);
		sliderValues[index] = 0;
		//boolean for sliding mouse
		var mouseDown = false;
		//If the mouse is down save that info
		slider.mousedown(function (event) {
			mouseDown = true;
		});
		
		//On mose move adjust slider if mouse is down
		slider.mousemove(function (event) {
			if(mouseDown) {
				var newSliderPercentage;
				//Get the loctaion of the mouse on the slider and update slider values accordingly 
				if(data.orientation !== "vertical") {
					newSliderPercentage = event.offsetX / slider.width() || 
										(event.clientX - $(event.target).offset().left) /slider.width();//This is for firefox
					
				} else {
					newSliderPercentage = 1 - event.offsetY / slider.height() || 
										1 - (event.clientY - $(event.target).offset().top) /slider.height();//This is for firefox
				}
				if( newSliderPercentage > 1) {
					newSliderPercentage = 1;
				}
				sliderValues[index] = newSliderPercentage;
				
				//adjust the value and add it to the adjusted values depending on the range of the slider
				var rangeDiff = sliderData.range[1] - sliderData.range[0];
				var adjustedVal = sliderData.range[0] + rangeDiff * newSliderPercentage;
				//Display the adjustedVal
				if(typeof sliderData.round_to !== "undefined" ) {
					var roundedVal =  Math.round(adjustedVal * Math.pow(10, sliderData.round_to) )/Math.pow(10, sliderData.round_to) ;
					adjustedVal = roundedVal;
				} 
				adjustedSliderValues[index] = adjustedVal;
				$('.slider-' + index +'-value', context).html(adjustedVal + " "+sliderData.units);
				//Update the slider information
				updateSliderLocation(newSliderPercentage, slider);
				  
			    // Prevent user from being able to highlight elements
			    // in the browser as he drags the mouse to scrub
			    if( event.stopPropagation ) event.stopPropagation();
			    if( event.preventDefault ) event.preventDefault();
			    event.cancelBubble = true;
			    event.returnValue = false;
			    return false;
			}
			
		});
		
		//On mouse up set the slider information(this handles clicks)
		slider.mouseup(function (event) {
			if(mouseDown) {
				var newSliderPercentage;
				//Get the loctaion of the mouse on the slider and update slider values accordingly 
				if(data.orientation !== "vertical") {
					newSliderPercentage = event.offsetX / slider.width() || 
										(event.clientX - $(event.target).offset().left) /slider.width();//This is for firefox
				} else {
					newSliderPercentage = 1- event.offsetY / slider.height() || 
										1 - (event.clientY - $(event.target).offset().top) /slider.height();//This is for firefox
				}
				if( newSliderPercentage > 1) {
					newSliderPercentage = 1;
				}
				//Update the % of the slider bar being used
				sliderValues[index] = newSliderPercentage;
				
				//adjust the value and add it to the adjusted values depending on the range of the slider
				var rangeDiff = sliderData.range[1] - sliderData.range[0];
				var adjustedVal = sliderData.range[0] + rangeDiff * newSliderPercentage;
				//Display the adjustedVal
				if(typeof sliderData.round_to !== "undefined" ) {
					var roundedVal = Math.round(adjustedVal * Math.pow(10, sliderData.round_to))/Math.pow(10, sliderData.round_to) ;
					adjustedVal = roundedVal;
				} 
				adjustedSliderValues[index] = adjustedVal;
				$('.slider-' + index +'-value', context).html(adjustedVal+ " "+sliderData.units);
				//Update Slider information
				updateSliderLocation(newSliderPercentage, slider);
			}
			//Reset Mousedown
			mouseDown = false;
		});
		
		//Prevent the marker from altering slider data
		marker.mousemove(function (event) {
			event.stopPropagation();
			  
		    // Prevent user from being able to highlight elements
		    // in the browser as he drags the mouse to scrub
		    if( event.stopPropagation ) event.stopPropagation();
		    if( event.preventDefault ) event.preventDefault();
		    event.cancelBubble = true;
		    event.returnValue = false;
		    return false;
		});
		//Maker sure mousedown is reset always
		marker.mouseup(function (event) {
			mouseDown = false;
		});
	});
	
	//Calculates the chosen branch based on the information from the sliders
	function calculateChosenBranch() {
		//Get the branch equation from the JSON
		var branchEquation = data.branch_equation;
		//Replace strings with proper data from the sliders
		$.each(data.sliders, function(index, sliderData) {
			var replaceString = "slider-" + index;
			branchEquation = branchEquation.replace(replaceString, "adjustedSliderValues[" + index + "]");
		});
		//Return the branch data(MUST BE INTEGER)
		var chosenBranch = Math.round(eval(branchEquation));
		if(chosenBranch > data.branches -1) {
			return data.branches -1;
		} else {
			return chosenBranch;
		}
	}
	
	//Updateds the position of the slider based on the percentage passed in
	function updateSliderLocation(val, slider) {
		var marker = $(".slider_marker", slider);
		if(data.orientation !== "vertical") {
			var sliderWidth = slider.width();
			var markerWidth = marker.width();
			
			//Set the slider position adjusting for the marker
			if(val < 1) {
				$(".left_slider", slider).width( sliderWidth * val - markerWidth);
			} else {
				val = 1;
				$(".left_slider", slider).width( sliderWidth * val - (markerWidth + 1));
			}
		} else {
			var sliderHeight = slider.height();
			var markerHeight = marker.height();
			if(val < 1) {
				$(".left_slider", slider).height( sliderHeight * (1 - val) - markerHeight);
			} else {
				val = 1;
				$(".left_slider", slider).height( sliderHeight * (1 - val) - markerHeight);
			}
		}
		//Get chosen Branch
		var chosenBranch = calculateChosenBranch();
		if(isNaN(chosenBranch) || typeof chosenBranch === "undefined") {
			//Update Shared Data and Chosen Branch
			SharedData.setter(data.exports_to, 0, pageNumber);
			SharedData.setter(data.exports_to + '-slider_data', [[0,0], [0,0]], pageNumber);
			VignetteController.setTargetBranch(0);
			VignetteController.setPageNode(data.exports_to);
		} else {
			//Update Shared Data and Chosen Branch
			SharedData.setter(data.exports_to, chosenBranch, pageNumber);
			SharedData.setter(data.exports_to + '-slider_data', [sliderValues, adjustedSliderValues], pageNumber);
			VignetteController.setTargetBranch(chosenBranch);
			VignetteController.setPageNode(data.exports_to);
		}
	}
	

	VignetteController.addPageFlipListener(function (event) {
		// Check answers before moving forward
		if (event.type === "flip") {
			if (event.direction === "forward") {
			

			}
		} else if(event.type === "load") {
			//On load set up slider Data
			if(typeof SharedData.getter(data.exports_to) !== "undefined") {
				//Load the sliderValues
				sliderValues = SharedData.getter(data.exports_to + '-slider_data')[0][0];
				adjustedSliderValues = SharedData.getter(data.exports_to + '-slider_data')[0][1];
				$.each(data.sliders, function(index, sliderData) {
					$('.slider-' + index +'-value', context).html(adjustedSliderValues[index] + " " + data.sliders[index].units);
					var sliderLoad = $('.slider-'+ index, context);
					updateSliderLocation(sliderValues[index], sliderLoad);
				});

			} else {
				$.each(data.sliders, function(index, sliderData) {
					$('.slider-' + index +'-value', context).html(0.0 + " " + data.sliders[index].units);
				});
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

	//Used to set the target branch properly when the page is loaded
	var updateTargetBranch = function () {
	
		// If this question has been answered before but it is now being reloaded,
		// reselect the old answer choice from SharedData
		var currentAnswer = parseInt(SharedData.getter(data.exports_to));
		if (typeof currentAnswer !== "undefined" && !isNaN(currentAnswer) && currentAnswer >= 0) {
			//set target branch
			SharedData.setter(data.exports_to, currentAnswer, pageNumber);
			VignetteController.setTargetBranch(currentAnswer);
			VignetteController.setPageNode(data.exports_to);
		}
	};
	
};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/slider-branch", callback);
};
