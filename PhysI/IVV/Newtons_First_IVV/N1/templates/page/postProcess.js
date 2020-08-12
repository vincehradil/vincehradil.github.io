
var callback = function (context, data, pageNumber) {

	// Number all widgets on this page with a class
	var allWidgets = $(".widget", context);
	$(allWidgets).each(function (index, widget) {
		$(widget).toggleClass("pagewidget-" + index, true);
	});

	// And label first/last mobile widgets with first/last classes
	var allMobileWidgets = $(".widget", context).not(".normal-only");
	var lMob = allMobileWidgets.length;
	if (lMob > 0) {
		$(allMobileWidgets[0]).toggleClass("first", true);
		$(allMobileWidgets[lMob - 1]).toggleClass("last", true);
	}

	VignetteController.addReportListener(function () {
		return Report.format(data, {});
	});

};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("page", callback);
};
