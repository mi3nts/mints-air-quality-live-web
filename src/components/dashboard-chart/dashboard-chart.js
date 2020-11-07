import echarts from "echarts";

export default {
    props: [
        "dataType",
        "name",
        "sidebarOpen",
        "data"
    ],
    data: () => ({
        chart: null,
        currentVal: null,
        readout: null,
    }),
    mounted: function () {
        this.initChart();
    },
    watch: {
        sidebarOpen() {
            this.resizeHandle();
        },
        data(data) {
            this.addValues(data);
        }
    },
    computed: {
        getChart() {
            return this.$store.getters.getChart(this.dataType);
        }
    },
    methods: {
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
            this.chart = echarts.init(document.getElementById(this.dataType));
            this.chart.setOption(chartOptionsLine);
            window.addEventListener("resize", this.resizeHandle);

            // define color ranges for each data type
            if (this.dataType == "PM") {
                this.chart.setOption({
                    visualMap: {
                        show: false,
                        pieces: [{
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
        addValues: function (data) {
            this.$store.commit('pushValue', {
                name: this.dataType,
                value: [
                    data.dateTime,
                    data[this.dataType]
                ]
            })

            if (this.$store.getters.getChart(this.dataType).length > 100) {
                this.$store.commit('shiftPoints', this.dataType)
            }

            // update current value and live readout
            // reflect trends on PM values
            if (parseFloat(data[this.dataType]) == this.currentVal) {
                this.currentVal = parseFloat(data[this.dataType])
                this.readout = this.currentVal.toFixed(1);
                if (this.dataType == "PM") {
                    document.getElementById(this.dataType + "-readout").style.color = "#a6a6a6";
                }
            } else if (parseFloat(data[this.dataType]) > this.currentVal) {
                this.currentVal = parseFloat(data[this.dataType]);
                this.readout = "\u25B2" + " " + this.currentVal.toFixed(1);
                if (this.dataType == "PM") {
                    document.getElementById(this.dataType + "-readout").style.color = "#f90000";
                }
            } else if (parseFloat(data[this.dataType]) < this.currentVal) {
                this.currentVal = parseFloat(data[this.dataType]);
                this.readout = "\u25BC" + " " + this.currentVal.toFixed(1);
                if (this.dataType == "PM") {
                    document.getElementById(this.dataType + "-readout").style.color = "#00b300";
                }
            }  
            // update chart
            this.chart.setOption({
                series: [{
                    data: this.getChart,
                    markLine: {
                        data: [{
                            yAxis: data[this.dataType],
                        }]
                    }
                }]
            })
        },
        resizeHandle: function () {
            this.chart.resize();
        },
    }
}
