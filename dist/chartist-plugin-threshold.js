(function (root, factory) {
  if (root === undefined && window !== undefined) root = window;
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module unless amdModuleId is set
    define(["chartist"], function (a0) {
      return (root['Chartist.plugins.ctThreshold'] = factory(a0));
    });
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require("chartist"));
  } else {
    root['Chartist.plugins.ctThreshold'] = factory(root["Chartist"]);
  }
}(this, function (Chartist) {

/**
 * Chartist.js plugin to display a data label on top of the points in a line chart.
 *
 */
/* global Chartist */
(function (window, document, Chartist) {
  'use strict';

  var defaultOptions = {
    threshold: 0,
    maskPadding: 10,
    prefix: 'ct-threshold-',
    classNames: {
      aboveThreshold: 'above',
      prefixThreshold: 'area-',
      belowThreshold: 'below'
    },
    maskNames: {
      aboveThreshold: 'mask-above',
      prefixThreshold: 'mask-area-',
      belowThreshold: 'mask-below'
    }
  };

  function createMasks(data, options) {
    // Select the defs element within the chart or create a new one
    var defs = data.svg.querySelector('defs') || data.svg.elem('defs');
    // Project the threshold value on the chart Y axis
    var thresholds = options.thresholds;
    // Convert threshold values to projected values
    function projectedThreshold(threshold) {
      return data.chartRect.height() - data.axisY.projectValue(threshold) + data.chartRect.y2;
    }
    var width = data.svg.width();
    var height = data.svg.height();

    var aboveThresholdValue = projectedThreshold(thresholds[0]);
    var belowThresholdValue = projectedThreshold(thresholds[thresholds.length - 1]);

    // Create mask for upper part above threshold
    defs
      .elem('mask', {
        x: 0,
        y: -1 * options.maskPadding,
        width: width,
        height: height + options.maskPadding,
        id: options.prefix + options.maskNames.aboveThreshold
      })
      .elem('rect', {
        x: 0,
        y: -1 * options.maskPadding,
        width: width,
        height: aboveThresholdValue + options.maskPadding,
        fill: 'white'
      });

    // Create mask for lower part below threshold
    defs
      .elem('mask', {
        x: 0,
        y: -1 * options.maskPadding,
        width: width,
        height: height + options.maskPadding,
        id: options.prefix + options.maskNames.belowThreshold
      })
      .elem('rect', {
        x: 0,
        y: belowThresholdValue,
        width: width,
        height: height - belowThresholdValue + options.maskPadding,
        fill: 'white'
      });

    // Add all other thresholds
    for(var i = 1; i <= thresholds.length - 1; ++i) {
      var currThreshold = projectedThreshold(thresholds[i]);
      var prevThreshold = projectedThreshold(thresholds[i - 1]);
      defs
        .elem('mask', {
          x: 0,
          y: 0,
          width: width,
          height: height,
          id: options.prefix + options.maskNames.prefixThreshold + (i - 1)
        })
        .elem('rect', {
          x: 0,
          y: prevThreshold,
          width: width,
          height: currThreshold - prevThreshold,
          fill: 'white'
        });
    }

    return defs;
  }

  Chartist.plugins = Chartist.plugins || {};
  Chartist.plugins.ctThreshold = function (options) {

    options = Chartist.extend({}, defaultOptions, options);
    // Single threshold should be converted
    if (!options.thresholds) {
        options.thresholds = [options.threshold];
    }

    return function ctThreshold(chart) {
      if (chart instanceof Chartist.Line || chart instanceof Chartist.Bar) {
        chart.on('draw', function (data) {
          if (data.type === 'point') {
            // For points we can just use the data value and compare against the threshold in order to determine
            // the appropriate class

            if (data.value.y >= options.thresholds[0]){
              data.element.addClass(options.prefix + options.classNames.aboveThreshold);
            } else if (data.value.y < options.thresholds[options.thresholds.length - 1]) {
              data.element.addClass(options.prefix + options.classNames.belowThreshold);
            // Multiple thresholds
            } else {
              for(var i = 1; i <= options.thresholds.length - 1; ++i) {
                // if value is larger that threshold we are done
                if (data.value.y >= options.thresholds[i]){
                    data.element.addClass(options.prefix + options.classNames.prefixThreshold + (i - 1));
                    break;
                }
              }
            }
          } else if (data.type === 'line' || data.type === 'bar' || data.type === 'area') {
            // Cloning the original line path, mask it with the upper mask rect above the threshold and add the
            // class for above threshold
            data.element
              .parent()
              .elem(data.element._node.cloneNode(true))
              .attr({
                mask: 'url(#' + options.prefix + options.maskNames.aboveThreshold + ')'
              })
              .addClass(options.prefix + options.classNames.aboveThreshold);

            // Add class for other thresholds
            for(var j = 1; j <= options.thresholds.length - 1; ++j) {
              data.element
                .parent()
                .elem(data.element._node.cloneNode(true))
                .attr({
                  mask: 'url(#' + options.prefix + options.maskNames.prefixThreshold + (j-1) + ')'
                })
                .addClass(options.prefix + options.classNames.prefixThreshold + (j-1));
            }

            // Use the original line path, mask it with the lower mask rect below the threshold and add the class
            // for blow threshold
            data.element
              .attr({
                mask: 'url(#' + options.prefix + options.maskNames.belowThreshold + ')'
              })
              .addClass(options.prefix + options.classNames.belowThreshold);
          }
        });

        // On the created event, create the two mask definitions used to mask the line graphs
        chart.on('created', function (data) {
          createMasks(data, options);
        });
      }
    };
  };
}(window, document, Chartist));

return Chartist.plugins.ctThreshold;

}));
