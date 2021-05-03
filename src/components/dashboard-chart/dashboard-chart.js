import echarts from "echarts";

export default {
    props: [
        "dataType",
        "name",
        "sidebarOpen", // tracks sidebar status
    ],
    data: () => ({
        chart: null,
        previousTwoValues: null,
        readout: null,
    }),
    mounted: function () {
        this.initChart();
        this.updateChart();
    },
    computed: {
        // get the last version of the chart stored in VueX if possible
        getChart() {
            return this.$store.getters.getChart(this.dataType);
        },
        getTrigger() {
            return this.$store.state.triggerCharts;
        }
    },
    watch: {
        sidebarOpen() {
            this.resizeHandle();
        },
        getTrigger() {
            this.updateChart();
        }
    },

    methods: {
        // Echart initiatation
        initChart: function () {
            var chartOptionsLine = {
                title: {
                    text: this.name,
                    left: "center",
                },
                xAxis: {
                    type: "time",
                    splitLine: {
                        show: false
                    },
                    axisLabel: {
                        margin: 8,
                        formatter: function (value) {
                            // show timestamp in hour:minute:second format
                            var hour = echarts.format.formatTime("hh", value);
                            var minSec = echarts.format.formatTime(":mm:ss", value);
                            var amPm = hour >= 12 ? "PM" : "AM";

                            // convert hour 12 hour format
                            hour = hour % 12;
                            hour = hour ? hour : 12;

                            return hour + minSec + " " + amPm;
                        }
                    }
                },
                yAxis: {
                    type: "value",
                    boundaryGap: false,
                    min: 0,
                    splitLine: {
                        show: false
                    },
                    axisLabel: {
                        fontSize: 16,
                    }
                },
                grid: {
                    show: true,
                    backgroundColor: "#cccccc",
                    left: 70,
                    top: 30,
                    right: 200,
                    bottom: 30
                },
                series: [{
                    name: 'Values',
                    type: "line",
                    color: "#38b6e6",
                    lineStyle: {
                        width: 4,
                    },
                    markLine: {
                        silent: true,
                        symbol: "none",
                        lineStyle: {
                            color: "#777777",
                            width: 2
                        },
                        label: {
                            show: false
                        }
                    },
                    showSymbol: false,
                    hoverAnimation: false,
                    animation: false,
                    useUTC: false,
                    data: this.getChart,
                }],
            };
            // create echart
            this.chart = echarts.init(document.getElementById(this.dataType));
            this.chart.setOption(chartOptionsLine);
            // resize chart with window
            window.addEventListener("resize", this.resizeHandle);

            // define color ranges for each data type
            // TODO: define color ranges for other data types
            if (this.dataType == "PM") {
                this.chart.setOption({
                    visualMap: {
                        show: false,
                        pieces: [{
                            gt: 0,
                            lt: 10,
                            color: "#ffff44"
                        }, {
                            gt: 10,
                            lt: 20,
                            color: "#ff5500"
                        }, {
                            gt: 20,
                            lt: 50,
                            color: "#cc0000"
                        }, {
                            gt: 50,
                            lt: 100,
                            color: "#990099"
                        }, {
                            gt: 100,
                            color: "#aa2626"
                        }],
                    },
                })
            } 
            if (this.dataType == "BC") {
                
                this.chart.setOption({
                    visualMap: {
                        show: false,
                        pieces: [{
                            gt: 0,
                            lt: 10,
                            color: "#ffff44"
                        }, {
                            gt: 10,
                            lt: 20,
                            color: "#ff5500"
                        }, {
                            gt: 20,
                            lt: 50,
                            color: "#cc0000"
                        }, {
                            gt: 50,
                            lt: 100,
                            color: "#990099"
                        }, {
                            gt: 100,
                            color: "#aa2626"
                        }],
                    },
                })
            }
            
            //blue to red scale for temperature, pressure, and humidity
            //TO-DO: Find the appropriate min and max values for pressure and humidity
            
            /*
            if (this.dataType == "temperature") {
                //this returns an array of 70 colors from blue (#4100FF) to red (#cc0000). put the difference between min and max as the third argument in the generateColor function
                var colorArray = this.generateColor.call('#4100FF','#cc0000', 70);
                this.chart.setOption({
                    visualMap: {
                        show: false,
                        pieces: [{
                            //place a value lower than the minimum for that data type
                            gt: -20,
                            //this standardizes the readouts to align with a value in the array
                            color: colorArray[this.readout + 20],
                        },],
                    },
                })
            }
            */

            if (this.dataType == "temperature") {
                this.chart.setOption({
                    visualMap: {
                        show: false,
                        pieces: [{
                            gt: -10,
                            lt: 0,
                            color: "#4100FF"
                        }, {
                            gt: 0,
                            lt: 10,
                            color: "#00B3FF"
                        }, {
                            gt: 10,
                            lt: 20,
                            color: "#00FF33"
                        }, {
                            gt: 20,
                            lt: 30,
                            color: "#FFDB00"
                        }, {
                            gt: 30,
                            lt: 40,
                            color: "#F0661C"
                        }, {
                            gt: 40,
                            color: "#cc0000"
                        },],
                    },
                })
            }
            if (this.dataType == "pressure") {
                this.chart.setOption({
                    visualMap: {
                        show: false,
                        pieces: [{
                            lt: 975,
                            color: "#4100FF"
                        }, {
                            gt: 975,
                            lt: 990,
                            color: "#00B3FF"
                        }, {
                            gt: 990,
                            lt: 1005,
                            color: "#00FF33"
                        }, {
                            gt: 1005,
                            lt: 1015,
                            color: "#FFDB00"
                        }, {
                            gt: 1015,
                            lt: 1030,
                            color: "#F0661C"
                        }, {
                            gt: 1030,
                            color: "#cc0000"
                        },],
                    },
                })
            }
            if (this.dataType == "humidity") {
                this.chart.setOption({
                    visualMap: {
                        show: false,
                        pieces: [{
                            gt: 0,
                            lt: 10,
                            color: "#4100FF"
                        }, {
                            gt: 10,
                            lt: 20,
                            color: "#00B3FF"
                        }, {
                            gt: 10,
                            lt: 20,
                            color: "#00FF33"
                        }, {
                            gt: 20,
                            lt: 30,
                            color: "#FFDB00"
                        }, {
                            gt: 30,
                            lt: 40,
                            color: "#F0661C"
                        }, {
                            gt: 40,
                            color: "#cc0000"
                        },],
                    },
                })
                
            }
        },

        //
        //solution taken from https://stackoverflow.com/questions/3080421/javascript-color-gradient
        hex: function(c) {
            var s = "0123456789abcdef";
            var i = parseInt (c);
            if (i == 0 || isNaN (c))
              return "00";
            i = Math.round (Math.min (Math.max (0, i), 255));
            return s.charAt ((i - i % 16) / 16) + s.charAt (i % 16);
        },

        /* Convert an RGB triplet to a hex string */
        convertToHex: function(rgb) {
            return this.hex.call(rgb[0]) + this.hex.call(rgb[1]) + this.hex.call(rgb[2]);
        },
        
        /* Remove '#' in color hex string */
        trim: function (s) { 
            return (s.charAt(0) == '#') ? s.substring(1, 7) : s 
        },
        
        /* Convert a hex string to an RGB triplet */
        convertToRGB: function (hex) {
            var color = [];
            color[0] = parseInt ((hex.trim()).substring (0, 2), 16);
            color[1] = parseInt ((hex.trim()).substring (2, 4), 16);
            color[2] = parseInt ((hex.trim()).substring (4, 6), 16);
            return color;
        },
        
        generateColor: function (colorStart,colorEnd,colorCount){
        
            // The beginning of your gradient
            var start = this.convertToRGB.call(colorStart);    
        
            // The end of your gradient
            var end   = this.convertToRGB.call(colorEnd);    
        
            // The number of colors to compute
            var len = colorCount;
        
            //Alpha blending amount
            var alpha = 0.0;
        
            var colors = [];
            
            for (var i = 0; i < len; i++) {
                var c = [];
                alpha += (1.0/len);
                
                c[0] = start[0] * alpha + (1 - alpha) * end[0];
                c[1] = start[1] * alpha + (1 - alpha) * end[1];
                c[2] = start[2] * alpha + (1 - alpha) * end[2];
        
             colors.push(this.convertToHex.call(c));   
            }
            return colors; 
        },

        /**
         * Add stored values to the chart and update live readout
         */
        updateChart: function () {
            this.previousTwoValues = this.$store.getters.getPreviousTwoValues(this.dataType);
            
            // update current value and live readout
            // reflect trends on PM values
            // TODO: consider making the live readout an SVG with d3 (see sensor-chart legends for reference)
            // TODO: round values based on number of digits to make the readout fit within the box
            let newest = this.previousTwoValues[0];
            let older = this.previousTwoValues[1];

            // check that there is a value before attempting comparisons
            if (newest) {
                if (older == null) {
                    // only one value (no older value)
                    this.readout = newest.toFixed(1);
                } else if (newest == older) {
                    this.readout = newest.toFixed(1);
                    if (this.dataType == "PM" || this.dataType == "BC" ) {
                        document.getElementById(this.dataType + "-readout").style.color = "#38b6e6";
                    }
                } else if (newest > older) {
                    this.readout = "\u25B2" + " " + newest.toFixed(1);
                    if (this.dataType == "PM" || this.dataType == "BC" ) {
                        document.getElementById(this.dataType + "-readout").style.color = "#f90000";
                    }
                } else if (newest < older) {
                    this.readout = "\u25BC" + " " + newest.toFixed(1);
                    if (this.dataType == "PM" || this.dataType == "BC" ) {
                        document.getElementById(this.dataType + "-readout").style.color = "#00b300";
                    }
                }

                this.chart.setOption({
                    series: [{
                        data: this.getChart,
                        markLine: {
                            data: [{
                                yAxis: newest,
                            }]
                        }
                    }]
                })
            }
        },
        // function for resize chart with window
        resizeHandle: function () {
            this.chart.resize();
        },
    }
}
