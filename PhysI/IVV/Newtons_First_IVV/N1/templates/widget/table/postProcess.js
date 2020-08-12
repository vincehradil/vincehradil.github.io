
var callback = function (context, data, pageNumber) {
	// Store the table we make, so datatable.js doesn't complain
	var table = $("table", context).dataTable({
		//"sScrollY" : "100%",
		"bPaginate" : false,
		"bInfo" : false,
		"bFilter" : false,
		"bSearchable" : false
	});
	
	var refreshTable = function()
	{
		if( table.width() !== $(".table_div", context).width() )
		{
			table.width( $(".table_div", context).width() );
			window.setTimeout( refreshTable, 40 );
		}
	}
	
	SharedData.addListener(data.imports_from, function (values) {
		setRows();
	}, pageNumber);
	
	VignetteController.addPageFlipListener(function (event) {
		if (event.type === "flip") {
			
		} else if (event.type === "load") {
			setRows();
			window.setTimeout( refreshTable, 40 );
		}
		return true;
	});
	VignetteController.addResizeFunction(function () {
		window.setTimeout( refreshTable, 40 );
	});
	// Add rows as needed
	var setRows = function () {
		var imports_from = data.imports_from;
		table.fnClearTable(true);
		// Get data
		var allValues = SharedData.getter(imports_from);
		
		if( typeof allValues !== "undefined" ) {
			for( var i = allValues.length - 1; i >= 0; i-- )
			{
				if( allValues[i] === 0 )
				{	
					allValues.splice( i, 1 );
				}
			}
		}
		
		var colorValues;
		if(typeof SharedData.getter(imports_from + "_rgb") !== "undefined") {
			colorValues = SharedData.getter(imports_from + "_rgb");
		}
			
		if( typeof colorValues !== "undefined" ) {
			for( var i = 0; i < colorValues[0].length; i++ )
			{
				if( colorValues[0][i] === 0 || typeof colorValues[0][i] === "undefined" )
				{
					colorValues[0][i] = [0,0,0];
				}
			}
		}
		
		if (typeof allValues === "undefined") {
			return true;
		}
		
		$(allValues).each(function (index, value) {
			// Format of value:
			// [ index of frame in x-y-analysis,
			//	 x-coord of mouse click on the canvas (in x-y- analysis),
			//	 y-coord of mouse click on the canvas (in x-y- analysis),
			//	 time value pertaining to current frame in x-y-analysis ]
		
			var x;
			var y;
			var red = 0;
			var green = 0;
			var blue = 0;
			var frame = allValues[index][0];
			var time = allValues[index][3];
			//make the new row
			var newRow = [];
			var adjustedValues = false;
				
			// Get X and Y co-ordinates
			x = value[1];
			y = value[2];
		
			//Set the colors if there are any
			if(typeof colorValues !== "undefined") 
			{
				if( typeof colorValues[0] === "undefined" || typeof colorValues[0][frame] === "undefined" )
				{
					return;
				}
				if( typeof colorValues[0][frame] !== "undefined" && colorValues[0][frame] === 0 )
				{
					return;
				}
				red   = colorValues[0][frame][0];
				green = colorValues[0][frame][1];
				blue  = colorValues[0][frame][2];
			}
			// By evaluating the instructions in our JSON
			$(data.equations).each(function (equ, equDat) {
				
				newRow.push(eval(equDat));
				adjustedValues = true;
			});
			//Push the data to the table
			if( adjustedValues )
			{
				table.fnAddData(newRow, true);
				table.fnAdjustColumnSizing(true);
			}
		});
	};
	
};



var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/table", callback);
};
