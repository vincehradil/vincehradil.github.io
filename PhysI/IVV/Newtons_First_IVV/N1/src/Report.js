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

 
 /**
 * The Report(ing) singleton.
 *  Provides formatters for Widgets/Pages,
 *   and allows Vignette to override defaults to send.
 * 
 * @class Report
 * @property {int} lastRequestTime the time, in milliseconds, the last
 *                  message was sent to the server.
 * @property {Object} options internal store for the current Reporting options
 */
var Report = {

	// The last time a report was sent to the server.
	lastRequestTime: -1,

	// The current options for reporting.
	options: {
		// TODO disable by default, rely on config(data) method
		sendReport: false,
		url: "report.php",
		defaults: {}
	},

	/**
	 * Configures options for subsequent reporting calls.
	 * 
	 * @param {Object} data an object containing the options to be set
	 *
	 */
	config: function (data) {
		if (typeof data.report_url !== "undefined") {
			Report.options.sendReport = true;
			Report.options.url = data.report_url;
		}

		if (typeof data.report_defaults !== "undefined") {
			Report.options.defaults = data.report_defaults;
		}
	},

	/**
	 * The available formatters for reporting data.
	 *
	 * Each formatter takes in three objects:
	 *  output (Object) a simple hash to put data into (gets modified)
	 *  reporting (Object) the options for reporting specified in widget JSON
	 *  data (Object) the entire hash of data provided by widget to format
	 */
	formatters: {
		// Whatever is reported is directly injected into reported data
		unchanged: function (output, reporting, data) {
			output[reporting.to_report_field] =
				data[reporting.from_export_field];
		},

		// Whatever is in .data of the reporting object is directly injected
		//  into reported data
		data: function (output, reporting, data) {
			output[reporting.to_report_field] = reporting.data;
		},

		//
		// Legacy formatters
		//

		// Takes 0/1/2/3 and converts that into a buttonA/B/C/D string
		legacyAnswer: function (output, reporting, data) {
			var temp = ["buttonA", "buttonB", "buttonC", "buttonD", "buttonE"];
			output[reporting.to_report_field] =
				temp[data[reporting.from_export_field]];
		}
	},

	/**
	 * Formats the given data according to instructions contained in widget
	 *  JSON.  Uses report.formatters internally to do so.
	 *
	 * @param {Object} widgetJSON the instructions for formatting
	 * @param {Object} data the data to be formatted
	 *
	 */
	format: function (widgetJSON, data) {
		if (!Report.options.sendReport) { return {}; }
		if (typeof widgetJSON.reporting === "undefined") { return {}; }

		var reportingJSON = widgetJSON.reporting;
		var output = {};

		$.each(reportingJSON, function (index, reporting) {
			if (reporting.format === "data" ||
					typeof data[reporting.from_export_field] !== "undefined") {

				// Let the formatter modify our output
				Report.formatters[reporting.format](output, reporting, data);
			}
		});

		return output;
	},

	/**
	 * Updates the timestamp since last report sent to server.
	 *  Directly injects that value into reported data.
	 *
	 * @param {Object} data the report to inject into
	 *
	 */
	updateDur: function (data) {
		// Yes, this gets a timestamp of now
		var currentTime = +(new Date());

		// If this is the initializing request, send 0, otherwise a timediff
		if (Report.lastRequestTime === -1) {
			data.dur = 0;
		} else {
			data.dur = currentTime - Report.lastRequestTime;
		}

		Report.lastRequestTime = currentTime;
	},

	/**
	 * Public method to send reports to the server.
	 *  Takes in several reports which must be merged into one,
	 *  as well as a list of raw data to override everything.
	 *
	 * @param {Array<Object>} reports the reports to be merged and sent
	 * @param {Array<Object>} rawReports the raw data to report directly
	 *
	 */
	sendReport: function (reports, rawReports) {
		if (!Report.options.sendReport) { return; }

		var data = {};

		$.extend(data, Report.options.defaults);
		Report.updateDur(data);

		$.each(reports, function (index, report) {
			$.extend(data, report);
		});

		$.each(rawReports, function (index, report) {
			$.extend(data, report);
		});

		// Data is ready, do the actual report
		Report.doSend(data);
	},

	/**
	 * Internal method to actually send data to server.
	 *
	 * @param {Object} data the data to POST with jQuery
	 *
	 */
	doSend: function (data) {
		if (!Report.options.sendReport) { return; }

		Debug.log("Sending data...");
		Debug.log(data);
		try {
			$.ajax({
				type: 'POST',
				url: Report.options.url,
				data: data,
				success: function (respData) {
					Debug.log(respData);
				}
			});
		} catch (err) {
			Debug.log(err);
			Debug.log(err.message + " when attempting to report.");
		}
	}
};
