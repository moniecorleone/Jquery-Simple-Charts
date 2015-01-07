//Author: Monie Corleone
//Purpose: To draw line chart in canvas element
; (function ($, window, document, undefined) {
    var pluginName = "LineChart";
    var defaults = {
        xPadding: 60,
        yPadding: 50,
        topmargin: 25,
        rightmargin: 20,
        data: null,
        toolwidth: 300,
        toolheight: 300,
        axiscolor: "#333",
        font: "italic 10pt sans-serif",
        headerfontsize: "14px",
        axisfontsize: "12px",
        textAlign: "center",
        textcolor: "#E6E6E6",
        showlegends: true,
        legendposition: 'bottom',
        legendsize: '100',
        xaxislabel: null,
        yaxislabel: null,
        title: null,
        LegendTitle: "Legend"
    };

    function Plugin(element, options) {
        this.element = element;
        this.options = $.extend({}, defaults, options);
        this.init();
    }

    Plugin.prototype = {
        init: function () {

            var that = this, xelementarray = new Array(),
           config = that.options;
            var graph = $(that.element).addClass("LineChart").append("<canvas class='linechartcanvas'></canvas>").find('canvas').css({
                float: (config.legendposition == 'right' || config.legendposition == 'left') ? 'left' : '',
                'margin-top': config.topmargin,
                'margin-right': config.rightmargin
            });
            var ctx = graph[0].getContext("2d");
            graph[0].width = $(that.element).width() - (config.showlegends ? ((config.legendposition == 'right' || config.legendposition == 'left') ? config.legendsize + config.xPadding : 0) : 0) - config.rightmargin;
            graph[0].height = $(that.element).height() - (config.showlegends ? ((config.legendposition == 'bottom' || config.legendposition == 'top') ? config.legendsize : 0) : 0) - config.topmargin;
            var tipCanvas = $(that.element).append("<canvas id='tip'></canvas><div class='down-triangle'></div>").find("#tip").attr('width', config.toolwidth).attr('height', config.toolheight);
            var tipCtx = tipCanvas[0].getContext("2d");
            var c = graph[0].getContext('2d');
            var canvasOffset = $(graph).offset();
            var offsetX = canvasOffset.left;
            var offsetY = canvasOffset.top;
            var highlighter = $(that.element).append("<canvas id='highlighter'></canvas>").find('#highlighter').attr('width', "18").attr('height', "18");
            var higlightctx = highlighter[0].getContext("2d");
            var tipbaloontip = $(that.element).find('.down-triangle');            
            $(graph[0]).on("mousemove", function (e) {
                drawToolTiponHover(e);
            });
            c.lineWidth = 2;
            c.strokeStyle = config.axiscolor;
            c.font = config.font;
            c.textAlign = config.textAlign;

            
            c.beginPath();
            c.moveTo(config.xPadding, 0);
            c.lineTo(config.xPadding, graph.height() - config.yPadding);
            c.lineTo(graph.width(), graph.height() - config.yPadding);
            c.stroke();

            c.fillStyle = config.textcolor;
            
            for (var i = 0; i < config.data.length; i++) {
                for (var j = 0; j < config.data[i].values.length; j++) {
                    if (xelementarray.indexOf(config.data[i].values[j].X) < 0) {
                        xelementarray.push(config.data[i].values[j].X);
                        c.fillText(config.data[i].values[j].X, that.pixelX(j, i), graph.height() - config.yPadding + 20);
                    }
                }
            }
            c.save();
            var fontArgs = c.font.split(' ');
            c.font = config.axisfontsize + ' ' + fontArgs[fontArgs.length - 1];
            if (config.xaxislabel) {
                c.fillText(config.xaxislabel, graph.width() / 2, graph.height());
            }
            if (config.yaxislabel) {
                c.save();
                c.translate(0, graph.height() / 2);
                c.rotate(-Math.PI / 2);
                c.fillText(config.yaxislabel, 0, 15);
                c.restore();
            }            
            if (config.title) {
                $("<div class='line-chart-Header' />").appendTo($(that.element)).html(config.title).css({
                    left: graph.width() / 2 - ($(that.element).find('.line-chart-Header').width() / 2),
                    top: 5
                });                
            }
            c.restore();           

            c.textAlign = "right"
            c.textBaseline = "middle";

            var maxY = that.FindYMax();
            var incrementvalue = "";
            for (var i = 0 ; i < Math.ceil(maxY).toString().length - 1; i++) {
                incrementvalue += "0";
            }
            incrementvalue = "1" + incrementvalue;
            incrementvalue = Math.ceil(maxY / parseInt(incrementvalue)) * Math.pow(10, (Math.ceil(maxY / 10).toString().length - 1));
            for (var i = 0; i < that.FindYMax() ; i += parseInt(incrementvalue)) {
                c.fillStyle = config.textcolor;
                c.fillText(i, config.xPadding - 10, that.pixelY(i));
                c.fillStyle = config.axiscolor;
                c.beginPath();
                c.arc(config.xPadding, that.pixelY(i), 6, 0, Math.PI * 2, true);
                c.fill();
            }

            for (var i = 0; i < config.data.length; i++) {
                c.strokeStyle = config.data[i].linecolor;                
                c.beginPath();
                c.moveTo(that.pixelX(0, i), that.pixelY(config.data[i].values[0].Y));
                for (var j = 1; j < config.data[i].values.length; j++) {
                    c.lineTo(that.pixelX(j, i), that.pixelY(config.data[i].values[j].Y));
                }
                c.stroke();                
                c.fillStyle = config.data[i].linecolor;
                for (var j = 0; j < config.data[i].values.length; j++) {
                    c.beginPath();
                    c.arc(that.pixelX(j, i), that.pixelY(config.data[i].values[j].Y), 4, 0, Math.PI * 2, true);
                    c.fill();
                }
            }
            
            var linepoints = [];
            for (var i = 0; i < config.data.length; i++) {
                for (var j = 0; j < config.data[i].values.length; j++) {
                    linepoints.push({
                        x: that.pixelX(j, i),
                        y: that.pixelY(config.data[i].values[j].Y),
                        r: 4,
                        rXr: 16,
                        tip: config.data[i].values[j].Y,
                        color: config.data[i].linecolor
                    });
                }
            }
            
            function drawToolTiponHover(e) {
                mouseX = parseInt(e.clientX - offsetX);
                mouseY = parseInt(e.clientY - offsetY);
                var hit = false;
                for (var i = 0; i < linepoints.length; i++) {
                    var dot = linepoints[i];
                    var dx = mouseX - dot.x;
                    var dy = mouseY - dot.y;
                    if (dx * dx + dy * dy < dot.rXr) {
                        tipCanvas[0].style.left = (dot.x - (tipCanvas[0].width / 2)) + 5 + "px";
                        tipCanvas[0].style.top = (dot.y - 13 - tipCanvas[0].height) + config.topmargin + "px";
                        tipCtx.clearRect(0, 0, tipCanvas[0].width, tipCanvas[0].height);
                        tipCtx.fillText(dot.tip, 5, 15);
                        tipbaloontip[0].style.left = (dot.x) - 0 + "px";
                        tipbaloontip[0].style.top = (dot.y + config.topmargin) - 12 + "px";
                        highlighter[0].style.left = (dot.x) - 1 + "px";
                        highlighter[0].style.top = (dot.y + config.topmargin) - 1 + "px";
                        higlightctx.clearRect(0, 0, highlighter.width(), highlighter.height());
                        higlightctx.strokeStyle = dot.color;
                        higlightctx.beginPath();
                        higlightctx.arc(9, 9, 7, 0, 2 * Math.PI);
                        higlightctx.lineWidth = 2;
                        higlightctx.stroke();
                        hit = true;
                    }
                }
                if (!hit) {
                    tipCanvas[0].style.left = "-400px";
                    highlighter[0].style.left = "-400px";
                    tipbaloontip[0].style.left = "-400px";
                }
            }

            //show legend
            if (config.showlegends) {
                var _legends = $("<div class='line-chart-legends' />", { id: "legendsdiv" }).css({
                    width: (config.legendposition == 'right' || config.legendposition == 'left') ? (config.legendsize - 5) : '',
                    height: (config.legendposition == 'top' || config.legendposition == 'bottom') ? (config.legendsize - 5) : '',
                    float: (config.legendposition == 'right' || config.legendposition == 'left') ? 'left' : ''
                }).appendTo($(that.element));
                var _ul = $(_legends).append("<span>" + config.LegendTitle + "</span>").append("<ul />").find("ul")
                for (var i = 0; i < config.data.length; i++) {
                    $("<li />", { class: "legendsli" }).append("<span />").find('span').addClass("legendindicator").append('<span class="line" style="background:' + config.data[i].linecolor + '"></span><span class="circle" style="background:' + config.data[i].linecolor + '"></span>').parent().append("<span>" + config.data[i].title + "</span>").appendTo(_ul);
                }
                if (config.legendposition == 'top' || config.legendposition == 'left') {
                    $(_legends).insertBefore($(that.element).find('.linechartcanvas'));
                }
                if (config.legendposition == 'right' || config.legendposition == 'left') {
                    $(_legends).addClass('vertical')
                }
                else {
                    $(_legends).addClass('horizontal');
                }
            }
        },
        reload: function () {
            $(this.element).empty();
            this.init();
        },
        destroy: function () {
            $(this.element).empty();
        },

        FindYMax: function () {
            config = this.options;
            var max = 0;
            for (var i = 0; i < config.data.length; i++) {
                for (var j = 0; j < config.data[i].values.length; j++) {
                    if (config.data[i].values[j].Y > max) {
                        max = config.data[i].values[j].Y;
                    }
                }
            }
            max += 10 - max % 10;
            return max;
        },

        pixelX: function (val, i) {
            config = this.options;
            var graph = $(this.element).find('.linechartcanvas');
            return ((graph.width() - config.xPadding) / config.data[i].values.length) * val + (config.xPadding * 1.5);
        },

        pixelY: function (val) {
            config = this.options;
            var graph = $(this.element).find('.linechartcanvas');
            return graph.height() - (((graph.height() - config.yPadding) / this.FindYMax()) * val) - config.yPadding;
        }
    }


    $.fn[pluginName] = function (options) {
        if (typeof options === "string") {
            var args = Array.prototype.slice.call(arguments, 1);
            this.each(function () {
                var plugin = $.data(this, 'plugin_' + pluginName);
                if (plugin[options]) {
                    plugin[options].apply(plugin, args);
                } else {
                    plugin['options'][options] = args[0];
                }
            });
        } else {
            return this.each(function () {
                if (!$.data(this, 'plugin_' + pluginName)) {
                    $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
                }
            });
        }
    }
})(jQuery, window, document, undefined);