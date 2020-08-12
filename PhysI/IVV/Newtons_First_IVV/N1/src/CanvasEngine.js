/**
 * Copyright (c) 2014, Interactive Video Vignettes Project at Rochester Institute of Technology.
 * <ivv.rit.edu>
 * <www.compadre.org/ivv>
 * This software is licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 4.0 license
 * <http://creativecommons.org/licenses/by-nc-sa/4.0/>. You may not use this software for commercial
 * purposes without written permission from Rochester Institute of Technology; If you alter,
 * transform, or build upon this software, you may distribute the resulting software only under the same
 * or similar license to this one.
 */

 
var TrackerBase = Class.extend(

// ---- Begin TrackerBase ----
/**  @lends TrackerBase.prototype */
		{
	/**
	 * <b>Class Overview:</b><br />
	 * The base class for all Trackers.  Defines a variety of common behavior,
	 *  such as basic flipNext and drawing methods.  Also stores the arguments
	 *  provided to CanvasEngine and provided for use by all trackers.
	 * <br /><br />
	 * <b>Constructor:</b><br />
	 * This is the base initialization for Trackers.  Stores data passed in by 
	 *  the caller, does some error checking, and sets up a variety of initial 
	 *  values and defaults.
	 *
	 * @memberOf TrackerBase
	 * @constructs
	 * @param {HTMLCanvasElement} canvas the canvas to draw on
	 * @param {HTMLSpanElement} hint a span to place hint text onto
	 * @param {HTMLDivElement} instr a div to place instructions onto
	 * @param {Object} data the data given to vignettes,
	 *                  uses exports_to, tracks, & displays
	 * @param {int} pageNumber The page number to which the callback applies
	 *
	 * @property {String} warningColor the color for incorrect clicks
	 * @property {String} normalColor the color for correct clicks
	 * @property {String} currentColor the color for special frames
	 * @property {int} horizLineLength the length of horizontal lines
	 * @property {Number} lineWidth the width of lines 
	 * @property {Number} drawSize a modified used to draw bigger lines/points
	 *                     if a larger canvas is being used
	 *
	 * @property {String} exportLoc the key to export normal click data to
	 * @property {String} exportFrameLoc the key to export frame # to
	 * @property {String} exportErrorLoc the key to export errors to 
	 * @property {String} exportExtraLoc the key to export extra data to
	 *
	 * @throws {Error} if data's JSON does not contain necessary fields:
	 *                  exports_to, tracks, displays, and step_time.
	 */
	init: function (canvas, hint, instr, data, pageNumber) {
		// The magic to allow functions to be used as callbacks directly
		//  Otherwise, JS would throw errors when you try, for example,
		//   $(whateverObjects).click(myObject.function)
		// Use this in every class's init function for paranoia
		_.bindAll(this);

		if (typeof data.exports_to === "undefined") {
			throw new Error("Need somewhere to export data");
		}
		if (typeof data.tracks === "undefined") {
			throw new Error("Need a method to track:" +
				" [any|circle|multi_circle]");
		}
		if (typeof data.displays === "undefined") {
			throw new Error("Need a method to display:" +
				" [point|horizontal|vertical]");
		}
		if (typeof data.step_time === "undefined") {
			throw new Error("Need a step_time to export data.");
		}
		
		this.canvas = canvas;
		this.hint = hint;
		this.instr = instr;
		this.data = data;
		this.pageNumber = pageNumber;

		this.drawMethod = this.drawPoint;
		if (data.displays === "smallPoint") {
			this.drawMethod = this.drawSmallPoint;
		} else if (data.displays === "horizontal") {
			this.drawMethod = this.drawHorizontal;
		} else if (data.displays === "vertical") {
			this.drawMethod = this.drawVertical;
		} else if (data.displays === "measure") {
			this.drawMethod = this.drawLine;
		}

		// Setup defaults
		this.warningColor = 'yellow';
		this.normalColor = 'black';
		this.currentColor = 'pink';
		this.horizLineLength = 50;
		this.drawSize = 1.5;
		this.lineWidth = 1.5;
		this.exportLoc = data.exports_to;
		this.exportFrameLoc = data.exports_to + "_frame";
		this.exportErrorLoc = data.exports_to + "_error";
		this.exportExtraLoc = data.exports_to + "_extra";

		if (SharedData.getter(data.exports_to + "_frame") === undefined){
			SharedData.setter(this.exportFrameLoc, 0, pageNumber);
		}

		// TODO remove these, call refreshes manually?
		SharedData.addListener(this.exportLoc, this.onUpdate, pageNumber);
		SharedData.addListener(this.exportErrorLoc, this.onUpdate, pageNumber);
		SharedData.addListener(this.exportFrameLoc, this.onUpdate, pageNumber);
		
		// Initialize display settings
		if (_.has(data, "display_settings")) {
			if (_.has(data.display_settings, "hor_line_length")) {
				this.lineWidth = data.display_settings.hor_line_length;
			}
			if (_.has(data.display_settings, "warning_color")) {
				this.warningColor = data.display_settings.warning_color;
			}
			if (_.has(data.display_settings, "draw_color")) {
				this.normalColor = data.display_settings.draw_color;
			}
			if (_.has(data.display_settings, "current_draw_color")) {
				this.currentColor = data.display_settings.current_draw_color;
			}
			if (_.has(data.display_settings, "draw_width")) {
				this.lineWidth = data.display_settings.draw_width;
			}
			if (_.has(data.display_settings, "canvas_width")) {
				this.canvas.width = data.display_settings.canvas_width;
			}
			if (_.has(data.display_settings, "canvas_height")) {
				this.canvas.height = data.display_settings.canvas_height;
			}
			if (_.has(data.display_settings, "draw_mult")) {
				this.drawSize = data.display_settings.draw_mult;
			}
		}
	},
	
	setCanvas: function( newCanvas )
	{
		newCanvas.getContext('2d').strokeStyle = this.canvas.getContext('2d').strokeStyle;
		newCanvas.getContext('2d').fillStyle = this.canvas.getContext('2d').fillStyle;
		
		if( typeof this.originalWidth === "undefined" )
		{
			this.originalWidth = this.canvas.width;
			this.originalHeight = this.canvas.height;
		}
		
		newCanvas.width = newCanvas.clientWidth;
		newCanvas.height = newCanvas.clientHeight;
		
		this.scaleX = this.canvas.width / this.originalWidth;
		this.scaleY = this.canvas.height / this.originalHeight;
		
		this.canvas = newCanvas;
		
		this.redraw();
	},

	/**
	 * Sets the canvas color to the given color.
	 *
	 * @memberOf TrackerBase
	 * @function setColor
	 * @param {Color} color the color to set.  Can be a string (and normally
	 *                 is).
	 *
	 */
	setColor: function (color) {
		this.canvas.getContext('2d').strokeStyle = color;
		this.canvas.getContext('2d').fillStyle = color;
	},

	/**
	 * Clears out anything drawn on the canvas.
	 *
	 * @memberOf TrackerBase
	 * @function drawClear
	 * @param {int} x unused
	 * @param {int} y unused
	 *
	 */
	drawClear: function (x, y) {
		this.canvas.getContext('2d').clearRect(0, 0, this.canvas.width,
										   this.canvas.height);
	},

	/**
	 * Draws a horizontal line on the canvas, at the specified point.
	 *  Also draws a small point at the specified location.
	 *
	 * @memberOf TrackerBase
	 * @function drawHorizontal
	 * @param {int} x the center point to draw from on the x-axis
	 * @param {int} y the point to draw from on the y-axis
	 *
	 */
	drawHorizontal: function (x, y) {
		this.drawSmallPoint(x, y);
		this.canvas.getContext('2d').beginPath();
		var modifier = this.horizLineLength / 2;
		this.canvas.getContext('2d').moveTo(x - modifier,
										this.canvas.height - y);
		this.canvas.getContext('2d').lineTo(x + modifier,
										this.canvas.height - y);
		this.canvas.getContext('2d').stroke();
	},

	/**
	 * Draws a vertical line on the canvas, at the specified point.
	 *  Also draws a small point at the specified location.
	 *
	 * @memberOf TrackerBase
	 * @function drawHorizontal
	 * @param {int} x the point to draw from on the x-axis
	 * @param {int} y the point to draw from on the y-axis
	 *
	 */
	drawVertical: function (x, y) {
		this.drawSmallPoint(x, y);
		this.canvas.getContext('2d').beginPath();
		this.canvas.getContext('2d').moveTo(x, 0);
		this.canvas.getContext('2d').lineTo(x, this.canvas.height);
		this.canvas.getContext('2d').stroke();
	},

	/**
	 * Draws a line on the canvas, from the first specified point to the
	 *	second.
	 *
	 * @memberOf TrackerBase
	 * @function drawLine
	 * @param {int} x1 the starting point to draw from on the x-axis
	 * @param {int} y1 the starting point to draw from on the y-axis
	 * @param {int} x2 the end point to draw from on the x-axis
	 * @param {int} y2 the end point to draw from on the y-axis
	 *
	 */
	drawLine: function (x1, y1, x2, y2) {
		this.canvas.getContext('2d').beginPath();
		this.canvas.getContext('2d').moveTo(x1, this.canvas.height - y1);
		this.canvas.getContext('2d').lineTo(x2, this.canvas.height - y2);
		this.canvas.getContext('2d').stroke();
	},
	
	/**
	 * Draws a small point on the canvas, at the specified point.
	 *
	 * @memberOf TrackerBase
	 * @function drawSmallPoint
	 * @param {int} x the point to draw on the x-axis
	 * @param {int} y the point to draw on the y-axis
	 *
	 */
	drawSmallPoint: function (x, y) {
		var radius = 2 * this.drawSize;
		this.canvas.getContext('2d').beginPath();
		this.canvas.getContext('2d').arc(x, this.canvas.height - y,
									radius, 0, 2 * Math.PI, false);
		this.canvas.getContext('2d').closePath();
		this.canvas.getContext('2d').fill();
		this.canvas.getContext('2d').stroke();
	},

	/**
	 * Draws a normally sized point on the canvas, at the specified point.
	 *
	 * @memberOf TrackerBase
	 * @function drawPoint
	 * @param {int} x the point to draw on the x-axis
	 * @param {int} y the point to draw on the y-axis
	 *
	 */
	drawPoint: function (x, y) {
		var radius = 3 * this.drawSize;
		this.canvas.getContext('2d').beginPath();
		this.canvas.getContext('2d').arc(x, this.canvas.height - y,
									radius, 0, 2 * Math.PI, false);
		this.canvas.getContext('2d').closePath();
		this.canvas.getContext('2d').fill();
	},

	/**
	 * Draws an error at the specified location.
	 *  Assumes that this.drawMethod has been initialized prior to calling.
	 *  Draws a point and calls this.drawMethod(x, y).
	 *
	 * @memberOf TrackerBase
	 * @function drawError
	 * @param {int} x the point to draw on the x-axis
	 * @param {int} y the point to draw on the y-axis
	 *
	 */
	drawError: function (x, y) {
		x *= this.scaleX;
		y *= this.scaleY;
		this.drawPoint(x, y);
		this.drawMethod(x, y);
	},

	/**
	 * A helper function to check whether the given locations are
	 *  within a certain radius of each other.
	 *
	 * @memberOf TrackerBase
	 * @function checkRadius
	 * @param {int} x1 first point's x
	 * @param {int} y1 first point's y
	 * @param {int} x2 second point's x
	 * @param {int} y2 second point's y
	 * @param {int} r the allowable radius
	 *
	 * @returns {boolean} the result of the check
	 *
	 */
	checkRadius: function (x1, y1, x2, y2, r) {
		var xdiff = x1 - x2;
		var ydiff = y1 - y2;
		return xdiff * xdiff + ydiff * ydiff < r * r;
	},

	/**
	 * A helper function to replace the data for a given frame.
	 *  Handles cases where previous data doesn't exist already.
	 *
	 * @memberOf TrackerBase
	 * @function replaceFrame
	 * @param {int} frame the frame number of data to replace
	 * @param {String} key the key of exported data for SharedData
	 * @param {Object} newValue the value to put into SharedData
	 *
	 */
	replaceFrame: function (frame, key, newValue) {
		if (typeof SharedData.getter(key) === "undefined") {
			SharedData.setter(key, newValue, this.pageNumber);
			return;
		}

		var exportData = SharedData.getter(key);

		var sortFunc = function (a, b) {
			return a[0] - b[0];
		};

		var foundFrame = false;
		var self = this;
		$.each(exportData, function (index, value) {
			if (value[0] === frame) {
				SharedData.replace(key, index, newValue, sortFunc, self.pageNumber);
				foundFrame = true;
				return false;
			}
			return true;
		});

		if (!foundFrame) {
			SharedData.adder(key, newValue, sortFunc, self.pageNumber);
		}
	},

	/**
	 * A helper function to clear the data for a given frame.
	 *  Handles cases where previous data doesn't exist already.
	 *
	 * @memberOf TrackerBase
	 * @function clearFrame
	 * @param {int} frame the frame number of data to clear
	 * @param {String} key the key of exported data for SharedData
	 *
	 */
	clearFrame: function (frame, key) {
		if (typeof SharedData.getter(key) === "undefined") {
			return;
		}

		$.each(SharedData.getter(key), function (entry, index) {
			if (entry[0] === frame) {
				SharedData.clearEntry(key, index);
			}
		});
	},

	/**
	 * Clears any previous error data in SharedData, if it exists.
	 *
	 * @memberOf TrackerBase
	 * @function clearError
	 *
	 */
	clearError: function () {
		SharedData.clear(this.exportErrorLoc);
	},

	/**
	 * Redraws everything from the data located in SharedData.
	 *  Clears the canvas first, and always controls the color before
	 *   passing it onto different drawMethods.
	 *
	 * @memberOf TrackerBase
	 * @function redraw
	 *
	 */
	redraw: function () {
		// Clear out points on canvas
		this.drawClear();
		
		// set line width
		this.canvas.getContext('2d').lineWidth =
			this.lineWidth * this.drawSize;

		// find out which line to highlight
		var specialFrame = -1;
		var currFrame = SharedData.getter(this.exportFrameLoc)[0];
		$(SharedData.getter(this.exportLoc)).each(function (i, value) {
			var frame = value[0];

			if (currFrame === frame) {
				specialFrame = frame;
				return false;        // Quit the loop early
			}
			if (currFrame === frame + 1) {
				specialFrame = frame;
			}
			return true;
		});

		// Redraw good points from SharedData
		var extra = SharedData.getter(this.exportExtraLoc);
		var trackedObjects;
		
		if( typeof extra !== "undefined" && typeof extra[0] !== "undefined" ) {
			trackedObjects = extra[0].trackedObjects;
		} else {
			return;
		}
		
		// note: $.each overrides 'this', so mark it for usage in loops
		var self = this;
		$.each(trackedObjects, function (i, objName) {

			if (typeof SharedData.getter(objName) !== "undefined") {

				var normData = SharedData.getter(objName);
				
				$.each(normData, function (index, point) {
					if ((point[0]) === specialFrame) {
						self.setColor(self.currentColor);
					} else {
						self.setColor(self.normalColor);
					}
					
					var p0 = [ point[1] * self.scaleX,
							   point[2] * self.scaleY ];

					if (self.data.displays === "measure") {
							
						// if this is the second object, draw the line
						if (objName === trackedObjects[1]) {
							var prevPoint = SharedData.getter(trackedObjects[0])[index];
					
							var p0 = [ prevPoint[1] * self.scaleX,
									   prevPoint[2] * self.scaleY ];
							
							self.drawPoint(p0[0], p0[1]);
							self.drawMethod(p1[0], p1[1], p0[0], p0[1]);
						} else {
							// draw point for first object
							self.drawPoint(p0[0], p0[1]);
						}
					} else {
						self.drawMethod(p0[0], p0[1]);
					}
				});
			}
		});

		// Draw bad click, if it's there
		if (typeof SharedData.getter(this.exportErrorLoc)
				!== "undefined") {

			var errData = SharedData.getter(this.exportErrorLoc)[0];
			this.setColor(this.warningColor);
			this.drawError(errData[0], errData[1]);
		}
	},

	/**
	 * Clears any data associated with this CanvasEngine.
	 *  Note: doesn't simply clear the canvas, it actually empties
	 *   data in SharedData as well.
	 *
	 * @memberOf TrackerBase
	 * @function clear
	 */
	clear: function () {
		this.reset();
	},
	
	reset: function() {
		SharedData.clear(this.exportLoc);
		
		SharedData.clear(this.exportLoc + "_rgb");
		
		if( this.pageNumber > 0 ) {
			SharedData.setter(this.exportLoc + "_rgb", 0, this.pageNumber - 1);
		}
		if( this.pageNumber < VignetteEngine.totalPages ) {
			SharedData.setter(this.exportLoc + "_rgb", 0, this.pageNumber + 1);
		}
		
		SharedData.setter(this.exportLoc + "_rgb", 0, this.pageNumber);
		
		
		// Update the shared data for nearby pages that may already
		// be loaded
		if( this.pageNumber > 0 ) {
			SharedData.setter(this.exportLoc, 0, this.pageNumber - 1);
		}
		if( this.pageNumber < VignetteEngine.totalPages ) {
			SharedData.setter(this.exportLoc, 0, this.pageNumber + 1);
		}
		
		SharedData.setter(this.exportLoc, 0, this.pageNumber);
		
		this.drawClear();
		this.clearError();
	},

	/**
	 * Public method to redraw everything from scratch.
	 *
	 * @memberOf TrackerBase
	 * @function onUpdate
	 * @param {Object} data new data coming from SharedData
	 */
	onUpdate: function (data) {
		this.redraw();
	},

	/**
	 * Called to move back a frame.  Base behavior is to always allow
	 *  this, unless we're already at the first or last frames.
	 *
	 * @memberOf TrackerBase
	 * @function flipBack
	 *
	 */
	flipBack: function () {
		// Default behavior simply moves back one frame
		var frame = SharedData.getter(this.exportFrameLoc)[0];
		if (frame > 0) {
			frame -= 1;
		}
		this.flipTo(frame);
	},

	/**
	 * Called to move forward a frame.  Base behavior is to always allow
	 *  this, unless we're already at the first or last frames.
	 *
	 * @memberOf TrackerBase
	 * @function flipNext
	 *
	 */
	flipNext: function () {
		var frame = SharedData.getter(this.exportFrameLoc)[0];
		if (frame < this.data.frames.length - 1) {
			frame += 1;
		}
		this.flipTo(frame);
	},
	
	/**
	 * Flips the canvas engine to a desired page
	 *
	 */
	flipTo: function( frameNumber ) {
		SharedData.setter(this.exportFrameLoc, frameNumber, this.pageNumber);
		
		this.clearError();
		this.onUpdate();
	},

	/**
	 * Behavior when the user clicks on the canvas.  Must be overridden by
	 *  derived classes.
	 *
	 * @memberOf TrackerBase
	 * @function click
	 * @param {int} frame the current frame of the activity
	 * @param {int} x the location clicked on the x-axis
	 * @param {int} y the location clicked on the y-axis
	 *
	 * @throws {Error} if not overridden
	 *
	 */
	click: function (frame, x, y) {
		throw new Error("'click' Not implemented for class BaseTracker.");
	},
	
	/**
	 * Behavior when the user clicks on the canvas.  Must be overridden by
	 *  derived classes.
	 *
	 * @memberOf TrackerBase
	 * @function checkClick
	 * @param {int} frame the current frame of the activity
	 * @param {int} x the location clicked on the x-axis
	 * @param {int} y the location clicked on the y-axis
	 *
	 * @throws {Error} if not overridden
	 *
	 */
	checkClick: function(frame, x, y) {
		throw new Error("'checkClick' Not implemented for class BaseTracker.");
	},
	/**
	 * Behavior when the user hovers on the canvas.  Must be overridden by
	 *  derived classes.  If possible, should only act as a visual aid for the
	 *  user, and not modify data expected to be used by other widgets.  This
	 *  encourages behavior that works on tablet devices.
	 *
	 * @memberOf TrackerBase
	 * @function hover
	 * @param {int} frame the current frame of the activity
	 * @param {int} x the location hovered on the x-axis
	 * @param {int} y the location hovered on the y-axis
	 *
	 * @throws {Error} if not overridden
	 *
	 */
	hover: function (frame, x, y) {
		throw new Error("'hover' Not implemented for class BaseTracker.");
	},

	/**
	 * Behavior when the user enters a value manually into a text field on the
	 *  analysis widget.  Considered a primitive event, like clicks and hover.
	 *  Must be overridden by derived classes.
	 *
	 * @memberOf TrackerBase
	 * @function val
	 * @param {int} frame the current frame of the activity
	 * @param {Number} val the value the user entered
	 *
	 * @throws {Error} if not overridden
	 *
	 */
	value: function (frame, val) {
		throw new Error("'value' Not implemented for class BaseTracker.");
	}
});

var AnyTracker = TrackerBase.extend(

// ---- Begin AnyTracker ----
/**  @lends AnyTracker.prototype
     @augments TrackerBase */
{

	/**
	 * <b>Class Overview:</b><br />
	 * This tracker accepts any clicked location.  Click anywhere, and we move
	 *  forward a frame.  Does nothing with hover events.
	 * <br /><br />
	 * <b>Constructor:</b><br />
	 * On top of allowing TrackerBase#init to do its work, sets the
	 *  shared value trackedObjects to our one tracked object.
	 *
	 * @memberOf AnyTracker
	 * @constructs
	 * @param {HTMLCanvasElement} canvas the canvas to draw on
	 * @param {HTMLSpanElement} hint a span to place hint text onto
	 * @param {HTMLDivElement} instr a div to place instructions onto
	 * @param {Object} data the data given to vignettes,
	 *                  uses exports_to, tracks, & displays
	 */
	init: function (canvas, hint, instr, data, pageNumber) {
		// The magic to allow functions to be used as callbacks directly
		//  Otherwise, JS would throw errors when you try, for example,
		//   $(whateverObjects).click(myObject.function)
		// Use this in every class's init function for paranoia
		_.bindAll(this);
		this._super(canvas, hint, instr, data, pageNumber);

		SharedData.setter(this.exportExtraLoc, {
			trackedObjects: [this.exportLoc]
			}, pageNumber);
	},
	click: function (frame, x, y) {
		var time = frame * this.data.step_time;
		var newData = [frame, x, y, time];
		this.replaceFrame(frame, this.exportLoc, newData);
		this.flipNext();
		return true;
	},
	checkClick: function (frame, x, y) {
		return true;
	},
	hover: function (frame, x, y) {
	},
	value: function (frame, val) {
	}
});

var CircleTracker = TrackerBase.extend(

// ---- Begin CircleTracker ----
/**  @lends CircleTracker.prototype
     @augments TrackerBase */
{

	/**
	 * <b>Class Overview:</b><br />
	 * This tracker accepts locations for one object.  Click it, and we move
	 *  forward a frame.  Does nothing with hover events.
	 * <br /><br />
	 * <b>Constructor:</b><br />
	 * On top of allowing TrackerBase#init to do its work, sets the
	 *  shared value trackedObjects to our one tracked object.
	 *
	 * @memberOf CircleTracker
	 * @constructs
	 * @param {HTMLCanvasElement} canvas the canvas to draw on
	 * @param {HTMLSpanElement} hint a span to place hint text onto
	 * @param {HTMLDivElement} instr a div to place instructions onto
	 * @param {Object} data the data given to vignettes,
	 *                  uses exports_to, tracks, & displays
	 */
	init: function (canvas, hint, instr, data, pageNumber) {
		// The magic to allow functions to be used as callbacks directly
		//  Otherwise, JS would throw errors when you try, for example,
		//   $(whateverObjects).click(myObject.function)
		// Use this in every class's init function for paranoia
		_.bindAll(this);
		this._super(canvas, hint, instr, data, pageNumber);

		SharedData.setter(this.exportExtraLoc, {
			trackedObjects: [this.exportLoc]
			}, pageNumber);
	},
	click: function (frame, x, y) {
		this.clearFrame(frame, this.exportLoc);

		var x2 = this.data.track_locations[frame].x;
		var y2 = this.data.track_locations[frame].y;
		var r = this.data.track_locations[frame].r;

		// Check whether the click was valid
		var clickedOnObject = this.checkRadius(x, y, x2, y2, r);

		if (clickedOnObject) {
			// If so, replace any old data, if it exists
			var time = frame * this.data.step_time;
			var newData = [frame, x2, y2, time];
			this.replaceFrame(frame, this.exportLoc, newData);
			this.flipNext();
		}

		return clickedOnObject;
	},
	checkClick: function (frame, x, y) {

		var x2 = this.data.track_locations[frame].x;
		var y2 = this.data.track_locations[frame].y;
		var r = this.data.track_locations[frame].r;

		// Check whether the click was valid
		var clickedOnObject = this.checkRadius(x, y, x2, y2, r);

		if( !clickedOnObject )
		{
			// Otherwise, notify of error
			var msg = "Please click closer to the target object.";
			SharedData.setter(this.exportErrorLoc, [x, y, msg], this.pageNumber);
		}
		
		return clickedOnObject;
	},
	hover: function (frame, x, y) {
	},
	value: function (frame, val) {
	}
});

var MultiTracker = TrackerBase.extend(

// ---- Begin MultiTracker ----
/**  @lends MultiTracker.prototype
     @augments TrackerBase */
{

	/**
	 * <b>Class Overview:</b><br />
	 * This tracker accepts locations for many objects. It does this by
	 *  expecting an array of arrays, of object locations and details that
	 *  we can iterate over. To move frames, we move forward in the inner
	 *  array, then the outer array, as necessary.
	 * <br /><br />
	 * <b>Constructor:</b><br />
	 * On top of allowing TrackerBase#init to do its work, sets the
	 *  shared value trackedObjects to our many tracked objects.
	 *
	 * @memberOf MultiTracker
	 * @constructs
	 * @param {HTMLCanvasElement} canvas the canvas to draw on
	 * @param {HTMLSpanElement} hint a span to place hint text onto
	 * @param {HTMLDivElement} instr a div to place instructions onto
	 * @param {Object} data the data given to vignettes,
	 *                  uses exports_to, tracks, & displays
	 */
	init: function (canvas, hint, instr, data, pageNumber) {
		// The magic to allow functions to be used as callbacks directly
		//  Otherwise, JS would throw errors when you try, for example,
		//   $(whateverObjects).click(myObject.function)
		// Use this in every class's init function for paranoia
		_.bindAll(this);
		this._super(canvas, hint, instr, data, pageNumber);

		this.clear();
		$(this.hint).html(this.data.track_locations[0][0].hint);
	},
	clear: function () {
		this.reset();

		// $.each overrides 'this', so mark it for usage in loops
		var self = this;
		var allTrackedObjects = [];
		$(this.data.all_objects).each(function (index, objName) {
			allTrackedObjects.push(self.exportLoc + objName);
			SharedData.clear(self.exportLoc + objName);
		});
		SharedData.setter(self.exportExtraLoc, {
			inner: 0,
			outer: 0,
			trackedObjects: allTrackedObjects
			}, self.pageNumber);
	},
	flipBack: function () {
		var extraData = SharedData.getter(this.exportExtraLoc)[0];
		var inner = extraData.inner;
		var outer = extraData.outer;

		// By default, remain on current frame
		var nextFrame = SharedData.getter(this.exportFrameLoc)[0];

		if (inner > 0) {
			// There is another frame for the inner index

			inner -= 1;
			extraData.inner = inner;

			nextFrame = this.data.track_locations[outer][inner].f;
		} else if (outer > 0) {
			// There is another frame for the outer index

			outer -= 1;
			extraData.outer = outer;
			inner = this.data.track_locations[outer].length - 1;
			extraData.inner = inner;

			nextFrame = this.data.track_locations[outer][inner].f;
		}

		$(this.hint).html(this.data.track_locations[outer][inner].hint);
		this.flipTo(nextFrame);
	},
	flipNext: function () {
		var extraData = SharedData.getter(this.exportExtraLoc)[0];
		var inner = extraData.inner;
		var outer = extraData.outer;

		// By default, remain on current frame
		var nextFrame = SharedData.getter(this.exportFrameLoc)[0];

		if (inner < this.data.track_locations[outer].length - 1) {

			// There is another frame for the inner index

			inner += 1;
			extraData.inner = inner;

			nextFrame = this.data.track_locations[outer][inner].f;

		} else if (outer < this.data.track_locations.length - 1) {

			// There is another frame for the outer index

			outer += 1;
			extraData.outer = outer;
			inner = 0;
			extraData.inner = inner;

			nextFrame = this.data.track_locations[outer][inner].f;

		}

		$(this.hint).html(this.data.track_locations[outer][inner].hint);
		this.flipTo(nextFrame);
	},

	click: function (frame, x, y) {
		Debug.log("Clicked x: " + x + ", y: " + y);

		// Ignore frame, use outer/inner indices from extraData
		var extraData = SharedData.getter(this.exportExtraLoc)[0];

		// The object #, if you're looping over each frame of one
		//  object before moving onto the other.
		// Otherwise, it's the frame #.
		var outer = extraData.outer;

		// Essentially the opposite of the above.
		var inner = extraData.inner;

		var trackData = this.data.track_locations[outer][inner];

		// Ignore frames meant for grabbing user-entered values
		if (trackData.click === "ignore") {
			return false;
		}

		var x2 = trackData.x;
		var y2 = trackData.y;
		var r = trackData.r;
		var time = frame * this.data.step_time;

		Debug.log("Expected x: " + x2 + ", y: " + y2);

		var clickedOnObject = this.checkRadius(x, y, x2, y2, r);
		if (trackData.loc === "any") {
			clickedOnObject = true;
		}

		if (clickedOnObject) {
			var objName = trackData.name;

			var exportLoc = this.exportLoc + objName;
			var newData = [frame, x2, y2, time];
			if (_.has(trackData, "export")) {
				newData.push(eval(trackData["export"]));
			}
			this.replaceFrame(frame, exportLoc, newData);

			this.flipNext();

			outer = extraData.outer;
			inner = extraData.inner;
			trackData = this.data.track_locations[outer][inner];
			objName = trackData.name;

			if (typeof trackData.help !== "undefined") {
				this.instr.html(trackData.help);
				this.instr.show();
			}

			if (trackData.type === "reveal") {
				var revealLoc =  this.exportLoc + objName;
				frame = trackData.f;
				x2 = trackData.x;
				y2 = trackData.y;
				time = frame * this.data.step_time;

				var revealData = [frame, x2, y2, time];
				this.replaceFrame(frame, revealLoc, revealData);
				this.onUpdate();
			}

		}

		return clickedOnObject;
	},
	checkClick: function (frame, x, y) {

		// Ignore frame, use outer/inner indices from extraData
		var extraData = SharedData.getter(this.exportExtraLoc)[0];

		// The object #, if you're looping over each frame of one
		//  object before moving onto the other.
		// Otherwise, it's the frame #.
		var outer = extraData.outer;

		// Essentially the opposite of the above.
		var inner = extraData.inner;

		var trackData = this.data.track_locations[outer][inner];

		// Ignore frames meant for grabbing user-entered values
		if (trackData.click === "ignore") {
			return false;
		}

		var x2 = trackData.x;
		var y2 = trackData.y;
		var r = trackData.r;

		Debug.log("Expected x: " + x2 + ", y: " + y2);

		var clickedOnObject = this.checkRadius(x, y, x2, y2, r);
		if (trackData.loc === "any") {
			clickedOnObject = true;
		}
		
		if( !clickedOnObject )
		{
			// Otherwise, clear old data and notify of error
			this.clearFrame(frame, this.exportLoc + trackData.name);
			var msg = "Please click closer to the object";
			if (_.has(trackData, "hint")) {
				msg += ": " + trackData.hint;
			}
			SharedData.setter(this.exportErrorLoc, [x, y, msg], this.pageNumber);
		}
		
		return clickedOnObject;
	},
	hover: function (frame, x, y) {
	},
	value: function (frame, val) {
		// Ignore frame, use outer/inner indices from extraData
		var extraData = SharedData.getter(this.exportExtraLoc)[0];

		// The object #, if you're looping over each frame of one
		//  object before moving onto the other.
		// Otherwise, it's the frame #.
		var outer = extraData.outer;

		// Essentially the opposite of the above.
		var inner = extraData.inner;

		var trackData = this.data.track_locations[outer][inner];

		if (trackData.on_value === "accept") {
			var exportLoc = this.exportLoc + "_value";

			var newData = [frame, parseFloat(val), 0,frame * this.data.step_time];
			this.replaceFrame(frame, exportLoc, newData);

			this.flipNext();
		}
	}
});

var MeasureTracker = TrackerBase.extend(

// ---- Begin MeasureTracker ----
/**  @lends MeasureTracker.prototype
     @augments TrackerBase */

{
	/**
	 * <b>Class Overview:</b><br />
	 * This tracker accepts locations for many objects. It does this by
	 *  expecting an array of arrays, of object locations and details that
	 *  we can iterate over. To move frames, we move forward in the inner
	 *  array, then the outer array, as necessary.
	 * <br /><br />
	 * <b>Constructor:</b><br />
	 * On top of allowing TrackerBase#init to do its work, sets the
	 *  shared value trackedObjects to our many tracked objects.
	 *
	 * @memberOf MeasureTracker
	 * @constructs
	 * @param {HTMLCanvasElement} canvas the canvas to draw on
	 * @param {HTMLSpanElement} hint a span to place hint text onto
	 * @param {HTMLDivElement} instr a div to place instructions onto
	 * @param {Object} data the data given to vignettes,
	 *                  uses exports_to, tracks, & displays
	 */
	init: function (canvas, hint, instr, data, pageNumber) {
		// The magic to allow functions to be used as callbacks directly
		//  Otherwise, JS would throw errors when you try, for example,
		//   $(whateverObjects).click(myObject.function)
		// Use this in every class's init function for paranoia
		_.bindAll(this);
		this._super(canvas, hint, instr, data, pageNumber);

		this.clear();
		$(this.hint).html(this.data.track_locations[0][0].hint);
	},
	clear: function () {
		this.reset();

		// $.each overrides 'this', so mark it for usage in loops
		var self = this;
		var allTrackedObjects = [];
		$(this.data.all_objects).each(function (index, objName) {
			allTrackedObjects.push(self.exportLoc + objName);
			SharedData.clear(self.exportLoc + objName);
		});
		SharedData.setter(self.exportExtraLoc, {
			inner: 0,
			outer: 0,
			trackedObjects: allTrackedObjects
			}, self.pageNumber);
	},
	flipBack: function () {
		var extraData = SharedData.getter(this.exportExtraLoc)[0];
		var inner = extraData.inner;
		var outer = extraData.outer;

		// By default, remain on current frame
		var nextFrame = SharedData.getter(this.exportFrameLoc)[0];

		if (inner > 0) {
			// There is another frame for the inner index

			inner -= 1;
			extraData.inner = inner;

			nextFrame = this.data.track_locations[outer][inner].f;
		} else if (outer > 0) {
			// There is another frame for the outer index

			outer -= 1;
			extraData.outer = outer;
			inner = this.data.track_locations[outer].length - 1;
			extraData.inner = inner;

			nextFrame = this.data.track_locations[outer][inner].f;
		}

		$(this.hint).html(this.data.track_locations[outer][inner].hint);
		this.flipTo(nextFrame);
	},
	flipNext: function () {
		var extraData = SharedData.getter(this.exportExtraLoc)[0];
		var inner = extraData.inner;
		var outer = extraData.outer;
		var innerLength = this.data.track_locations[outer].length;
		var outerLength = this.data.track_locations.length;

		// By default, remain on current frame
		var nextFrame = SharedData.getter(this.exportFrameLoc)[0];

		if (outer == (outerLength - 1) && inner == (innerLength - 1)) {

			// At the last frame for both outer and inner

			inner = 0;
			extraData.inner = inner;
		} else if (inner < (innerLength - 1)) {

			// There is another frame for the inner index

			inner += 1;
			extraData.inner = inner;
		} else if (outer < (outerLength - 1)) {

			// There is another frame for the outer index

			outer += 1;
			extraData.outer = outer;
			inner = 0;
			extraData.inner = inner;
		}
		
		nextFrame = this.data.track_locations[outer][inner].f;
		$(this.hint).html(this.data.track_locations[outer][inner].hint);
		this.flipTo(nextFrame);
	},
	click: function (frame, x, y) {
		// Ignore frame, use outer/inner indices from extraData
		var extraData = SharedData.getter(this.exportExtraLoc)[0];

		// The object #, if you're looping over each frame of one
		//  object before moving onto the other.
		// Otherwise, it's the frame #.
		var outer = extraData.outer;

		// Essentially the opposite of the above.
		var inner = extraData.inner;

		var trackData = this.data.track_locations[outer][inner];
		
		// Ignore frames meant for grabbing user-entered values
		if (trackData.click === "ignore") {
			return false;
		}

		var x2 = trackData.x;
		var y2 = trackData.y;
		var r = trackData.r;
		var time = frame * this.data.step_time;

		var clickedOnObject = this.checkRadius(x, y, x2, y2, r);
		if (trackData.loc === "any") {
			clickedOnObject = true;
		}

		if (clickedOnObject) {
			var objName = trackData.name;

			var exportLoc = this.exportLoc + objName;

			// only export on second object
			if (inner === 1) {
				var prevData = this.data.track_locations[outer][0];
				var x1 = prevData.x;
				var y1 = prevData.y;

				var newData = [frame, x2, y2, time];
				if (_.has(trackData, "export")) {
					newData.push(eval(trackData["export"]));
				}
				this.replaceFrame(frame, exportLoc, newData);
			} else {
				var newData = [frame, x2, y2, time, 0];
				this.replaceFrame(frame, exportLoc, newData);
			}
			this.flipNext();

			trackData = this.data.track_locations[outer][inner];
			objName = trackData.name;

			if (typeof trackData.help !== "undefined") {
				this.instr.html(trackData.help);
				this.instr.show();
			}

			if (trackData.type === "reveal") {
				var revealLoc =  this.exportLoc + objName;
				frame = trackData.f;
				x2 = trackData.x;
				y2 = trackData.y;
				time = frame * this.data.step_time;

				var revealData = [frame, x2, y2, time];
				this.replaceFrame(frame, revealLoc, revealData);
				this.onUpdate();
			}

		} else {
			// Otherwise, clear old data and notify of error
			this.clearFrame(frame, this.exportLoc + trackData.name);
			var msg = "Please click closer to the object";
			if (_.has(trackData, "hint")) {
				msg += ": " + trackData.hint;
			}
			SharedData.setter(this.exportErrorLoc, [x, y, msg], this.pageNumber);
		}

		return clickedOnObject;
	},
	checkClick: function (frame, x, y) {
		// Ignore frame, use outer/inner indices from extraData
		var extraData = SharedData.getter(this.exportExtraLoc)[0];

		// The object #, if you're looping over each frame of one
		//  object before moving onto the other.
		// Otherwise, it's the frame #.
		var outer = extraData.outer;

		// Essentially the opposite of the above.
		var inner = extraData.inner;

		var trackData = this.data.track_locations[outer][inner];
		
		// Ignore frames meant for grabbing user-entered values
		if (trackData.click === "ignore") {
			return false;
		}

		var x2 = trackData.x;
		var y2 = trackData.y;
		var r = trackData.r;

		var clickedOnObject = this.checkRadius(x, y, x2, y2, r);
		if (trackData.loc === "any") {
			clickedOnObject = true;
		}
		
		return clickedOnObject;
	},
	hover: function (frame, x, y) {
		// Find out which object it is the current one.
		var extraData = SharedData.getter(this.exportExtraLoc)[0];
		//Debug.log("i: " + extraData.inner + " o: " + extraData.outer);
		// Only show hover line on second object
		if (extraData.inner === 1) {
			var trackedObjects =
				SharedData.getter(this.exportExtraLoc)[0].trackedObjects;
			var prevPoint = SharedData.getter(trackedObjects[0])[frame];

			this.redraw();
			this.drawLine(prevPoint[1], prevPoint[2], x, y);
		}
	},
	value: function (frame, val) {
		// Ignore frame, use outer/inner indices from extraData
		var extraData = SharedData.getter(this.exportExtraLoc)[0];

		// The object #, if you're looping over each frame of one
		//  object before moving onto the other.
		// Otherwise, it's the frame #.
		var outer = extraData.outer;

		// Essentially the opposite of the above.
		var inner = extraData.inner;

		var trackData = this.data.track_locations[outer][inner];

		if (trackData.on_value === "accept") {
			var exportLoc = this.exportLoc + "_value";

			var newData = [frame, parseFloat(val), 0, frame * this.data.step_time];
			this.replaceFrame(frame, exportLoc, newData);

			this.flipNext();
		}
	}
});

var CanvasEngine = Class.extend(

// ---- Begin CanvasEngine ----
/**  @lends CanvasEngine.prototype */
{

	/**
	 * <b>Class Overview:</b><br />
	 * This class is a helper for widgets that need to control an HTML5 Canvas.
	 *  See widget/x-y-analysis for usage.
	 * <br /><br />
	 * <b>Constructor:</b><br />
	 * Based on data.tracks, defers to one of several trackers to perform all
	 *  expected functions.  See TrackerBase, AnyTracker, CircleTracker, and
	 *  MultiTracker.
	 *
	 * @memberOf CanvasEngine
	 * @constructs
	 * @param {HTMLCanvasElement} canvas the canvas to draw on
	 * @param {HTMLSpanElement} hint a span to place hint text onto
	 * @param {HTMLDivElement} instr a div to place instructions onto
	 * @param {Object} data the data given to vignettes,
	 *                  uses exports_to, tracks, & displays
	 * @param {int} pageNumber The page number to which the callback applies
	 */
	init: function (canvas, hint, instr, data, pageNumber) {
		// The magic to allow functions to be used as callbacks directly
		//  Otherwise, JS would throw errors when you try, for example,
		//   $(whateverObjects).click(myObject.function)
		// Use this in every class's init function for paranoia
		_.bindAll(this);
		
		if (data.tracks === "any") {
			this.tracker = new AnyTracker(canvas, hint, instr, data, pageNumber);
		} else if (data.tracks === "circle") {
			this.tracker = new CircleTracker(canvas, hint, instr, data, pageNumber);
		} else if (data.tracks === "multi_circle") {
			this.tracker = new MultiTracker(canvas, hint, instr, data, pageNumber);
		} else if (data.tracks === "measure") {
			this.tracker = new MeasureTracker(canvas, hint, instr, data, pageNumber);
		}
	},

	flipBackMethod: function () {
		return this.tracker.flipBack();
	},

	flipNextMethod: function () {
		return this.tracker.flipNext();
	},

	click: function (x, y) {
		x /= this.tracker.scaleX;
		y /= this.tracker.scaleY;
		
		var frame = SharedData.getter(this.tracker.exportFrameLoc)[0];
		return this.tracker.click(frame, x, y);
	},
	checkClick: function (x, y) {
		x /= this.tracker.scaleX;
		y /= this.tracker.scaleY;
	
		var frame = SharedData.getter(this.tracker.exportFrameLoc)[0];
		return this.tracker.checkClick(frame, x, y);
	},
	hover: function (x, y) {
		x /= this.tracker.scaleX;
		y /= this.tracker.scaleY;
		
		var frame = SharedData.getter(this.tracker.exportFrameLoc)[0];
		return this.tracker.hover(frame, x, y);
	},

	value: function (val) {
		var frame = SharedData.getter(this.tracker.exportFrameLoc)[0];
		return this.tracker.value(frame, val);
	},
	
	clear: function () {
		var frame = SharedData.getter(this.tracker.exportFrameLoc)[0];
		return this.tracker.clear();
	},

	clearError: function () {
		return this.tracker.clearError();
	},

	onUpdate: function (data) {
		return this.tracker.onUpdate(data);
	},
	
	setCanvas: function( newCanvas )
	{
		this.tracker.setCanvas( newCanvas );
	}
});