/**
 * jqPlot
 * Pure JavaScript plotting plugin using jQuery
 *
 * Version: 1.0.8
 * Revision: 1250
 *
 * Copyright (c) 2009-2013 Chris Leonello
 * jqPlot is currently available for use in all personal or commercial projects 
 * under both the MIT (http://www.opensource.org/licenses/mit-license.php) and GPL 
 * version 2.0 (http://www.gnu.org/licenses/gpl-2.0.html) licenses. This means that you can 
 * choose the license that best suits your project and use it accordingly. 
 *
 * Although not required, the author would appreciate an email letting him 
 * know of any substantial use of jqPlot.  You can reach the author at: 
 * chris at jqplot dot com or see http://www.jqplot.com/info.php .
 *
 * If you are feeling kind and generous, consider supporting the project by
 * making a donation at: http://www.jqplot.com/donate.php .
 *
 * sprintf functions contained in jqplot.sprintf.js by Ash Searle:
 *
 *     version 2007.04.27
 *     author Ash Searle
 *     http://hexmen.com/blog/2007/03/printf-sprintf/
 *     http://hexmen.com/js/sprintf.js
 *     The author (Ash Searle) has placed this code in the public domain:
 *     "This code is unrestricted: you are free to use it however you like."
 * 
 * Edit 4/20/2014 - handles dragging and click and placing
 */
(function($){$.jqplot.Dragable=function(options){this.markerRenderer=new $.jqplot.MarkerRenderer({shadow:false});this.shapeRenderer=new $.jqplot.ShapeRenderer();this.isDragging=false;this.isHeld=false;this.isOver=false;this._ctx;this._elem;this._point;this._gridData;this.color;this.constrainTo='none';$.extend(true,this,options)};function DragCanvas(){$.jqplot.GenericCanvas.call(this);this.isDragging=false;this.isHeld=false;this.isOver=false;this._neighbor;this._cursors=[]}DragCanvas.prototype=new $.jqplot.GenericCanvas();DragCanvas.prototype.constructor=DragCanvas;$.jqplot.Dragable.parseOptions=function(defaults,opts){var options=opts||{};this.plugins.dragable=new $.jqplot.Dragable(options.dragable);this.isDragable=$.jqplot.config.enablePlugins};$.jqplot.Dragable.postPlotDraw=function(){if(this.plugins.dragable&&this.plugins.dragable.highlightCanvas){this.plugins.dragable.highlightCanvas.resetCanvas();this.plugins.dragable.highlightCanvas=null}this.plugins.dragable={previousCursor:'auto',isOver:false};this.plugins.dragable.dragCanvas=new DragCanvas();this.eventCanvas._elem.before(this.plugins.dragable.dragCanvas.createElement(this._gridPadding,'jqplot-dragable-canvas',this._plotDimensions,this));var dctx=this.plugins.dragable.dragCanvas.setContext()};$.jqplot.preParseSeriesOptionsHooks.push($.jqplot.Dragable.parseOptions);$.jqplot.postDrawHooks.push($.jqplot.Dragable.postPlotDraw);$.jqplot.eventListenerHooks.push(['jqplotMouseMove',handleMove]);$.jqplot.eventListenerHooks.push(['jqplotMouseDown',handleDown]);$.jqplot.eventListenerHooks.push(['jqplotMouseUp',handleUp]);function initDragPoint(plot,neighbor){var s=plot.series[neighbor.seriesIndex];var drag=s.plugins.dragable;var smr=s.markerRenderer;var mr=drag.markerRenderer;mr.style=smr.style;mr.lineWidth=smr.lineWidth+2.5;mr.size=smr.size+5;if(!drag.color){var rgba=$.jqplot.getColorComponents(smr.color);var newrgb=[rgba[0],rgba[1],rgba[2]];var alpha=(rgba[3]>=0.6)?rgba[3]*0.6:rgba[3]*(2-rgba[3]);drag.color='rgba('+newrgb[0]+','+newrgb[1]+','+newrgb[2]+','+alpha+')'}mr.color=drag.color;mr.init();var start=(neighbor.pointIndex>0)?neighbor.pointIndex-1:0;var end=neighbor.pointIndex+2;drag._gridData=s.gridData.slice(start,end)}function handleMove(ev,gridpos,datapos,neighbor,plot){var dc=plot.plugins.dragable.dragCanvas;if(dc.isDragging){var dp=dc._neighbor;var s=plot.series[dp.seriesIndex];var drag=s.plugins.dragable;var gd=s.gridData;var x=(drag.constrainTo=='y')?dp.gridData[0]:gridpos.x;var y=(drag.constrainTo=='x')?dp.gridData[1]:gridpos.y;var xu=s._xaxis.series_p2u(x);var yu=s._yaxis.series_p2u(y);var ctx=dc._ctx;ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);if(dp.pointIndex>0){drag._gridData[1]=[x,y]}else{drag._gridData[0]=[x,y]}plot.series[dp.seriesIndex].draw(dc._ctx,{gridData:drag._gridData,shadow:false,preventJqPlotSeriesDrawTrigger:true,color:drag.color,markerOptions:{color:drag.color,shadow:false},trendline:{show:false}});plot.target.trigger('jqplotSeriesPointChange',[dp.seriesIndex,dp.pointIndex,[xu,yu],[x,y]]);dc.isHeld=true}else if(neighbor!=null){var series=plot.series[neighbor.seriesIndex];if(series.isDragable){var dc=plot.plugins.dragable.dragCanvas;if(!dc.isOver){dc._cursors.push(ev.target.style.cursor);ev.target.style.cursor="pointer"}dc.isOver=true}}else if(neighbor==null){var dc=plot.plugins.dragable.dragCanvas;if(dc.isOver){ev.target.style.cursor=dc._cursors.pop();dc.isOver=false}}}function handleDown(ev,gridpos,datapos,neighbor,plot){var dc=plot.plugins.dragable.dragCanvas;if(dc.isDragging){var ctx=dc._ctx;ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);dc.isDragging=false;var dp=dc._neighbor;var s=plot.series[dp.seriesIndex];var drag=s.plugins.dragable;var x=(drag.constrainTo=='y'||drag.constrainTo=='both')?dp.data[0]:datapos[s.xaxis];var y=(drag.constrainTo=='x'||drag.constrainTo=='both')?dp.data[1]:datapos[s.yaxis];s.data[dp.pointIndex][0]=x;s.data[dp.pointIndex][1]=y;plot.drawSeries({preventJqPlotSeriesDrawTrigger:true},dp.seriesIndex);dc._neighbor=null;ev.target.style.cursor=dc._cursors.pop();plot.target.trigger('jqplotDragStop',[ev,gridpos,datapos,neighbor,plot])}else{dc._cursors.push(ev.target.style.cursor);if(neighbor!=null){var s=plot.series[neighbor.seriesIndex];var drag=s.plugins.dragable;if(s.isDragable&&!dc.isDragging){dc._neighbor=neighbor;dc.isDragging=true;initDragPoint(plot,neighbor);drag.markerRenderer.draw(s.gridData[neighbor.pointIndex][0],s.gridData[neighbor.pointIndex][1],dc._ctx);ev.target.style.cursor="move";plot.target.trigger('jqplotDragStart',[neighbor.seriesIndex,neighbor.pointIndex,gridpos,datapos])}}else{var ctx=dc._ctx;ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);dc.isDragging=false}}}function handleUp(ev,gridpos,datapos,neighbor,plot){var dc=plot.plugins.dragable.dragCanvas;if(dc.isHeld){var ctx=dc._ctx;ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);dc.isHeld=false;dc.isDragging=false;if(dc._neighbor!=null){var dp=dc._neighbor;var s=plot.series[dp.seriesIndex];var drag=s.plugins.dragable;var x=(drag.constrainTo=='y'||drag.constrainTo=='both')?dp.data[0]:datapos[s.xaxis];var y=(drag.constrainTo=='x'||drag.constrainTo=='both')?dp.data[1]:datapos[s.yaxis];s.data[dp.pointIndex][0]=x;s.data[dp.pointIndex][1]=y;plot.drawSeries({preventJqPlotSeriesDrawTrigger:true},dp.seriesIndex);}dc._neighbor=null;ev.target.style.cursor=dc._cursors.pop();plot.target.trigger('jqplotDragStop',[ev,gridpos,datapos,neighbor,plot])}}})(jQuery);