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
        getChart () {
            return this.$store.getters.getChart(this.dataType);
        }, 
        getTrigger () {
            return this.$store.state.trigger;
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
                            // show timestamp in minute:second format
                            var min = echarts.format.formatTime("mm", value);
                            var sec = echarts.format.formatTime("ss", value);
                            return min + ":" + sec;
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
                    if (this.dataType == "PM") {
                        document.getElementById(this.dataType + "-readout").style.color = "#38b6e6";
                    }
                } else if (newest > older) {
                    this.readout = "\u25B2" + " " + newest.toFixed(1);
                    if (this.dataType == "PM") {
                        document.getElementById(this.dataType + "-readout").style.color = "#f90000";
                    }
                } else if (newest < older) {
                    this.readout = "\u25BC" + " " + newest.toFixed(1);
                    if (this.dataType == "PM") {
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
