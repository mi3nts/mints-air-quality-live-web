import echarts from "echarts";

export default {
    props: [
        "dataType",
        "sidebarOpen",
    ],
    data: () => ({
        chart: null,
        currentVal: null,
        readout: null,
        testVal: (Math.random() * 10) + 1, // used for testing with simulated payloads
        timer: null,
    }),
    mounted: function () {
        // subscribe to MQTT stream
        console.log(this.$mqtt.subscribe('#'));
        this.initChart();
        this.timer = setInterval(this.simulatePayload, 1000);
    },
    watch: {
        sidebarOpen() {
            this.resizeHandle();
        }
    },
    mqtt: {
        '+/calibrated'(payload) {
            if (payload != null) {
                try {
                    if (JSON.parse(payload.toString())) {
                        payload = JSON.parse(payload.toString());
                    }
                } catch (error) {
                    // handle NaN errors
                    payload = JSON.parse(payload.toString().replace(/NaN/g, "\"NaN\""))
                }
                // this.addValues(payload);
            }
        }
    },
    beforeDestroy: function () {
        clearInterval(this.timer);
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
                    text: this.dataType,
                    left: "center",
                    padding: [30, 0, 0, 0]
                },
                xAxis: {
                    type: "time",
                    splitLine: {
                        show: false
                    },
                    axisLabel: {
                        margin: 8,
                        formatter: function (value) {
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
                            color: "#999999",
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
            if (this.dataType == "pm2_5" || this.dataType == "pm1" || this.dataType == "pm10") {
                this.chart.setOption({
                    visualMap: {
                        show: false,
                        pieces: [{
                            gt: 0,
                            lt: 10,
                            // color: "#33cc33",
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
                    data.timestamp,
                    data[this.dataType]
                ]
            })

            if (this.$store.getters.getChart(this.dataType).length > 100) {
                this.$store.commit('shiftPoints', this.dataType)
            }

            // update current value and live readout
            // reflect trends on PM values
            if (data[this.dataType] == this.currentVal) {
                this.currentVal = data[this.dataType]
                this.readout = this.currentVal.toFixed(1);
                if (this.dataType == "pm2_5" || this.dataType == "pm1" || this.dataType == "pm10") {
                    document.getElementById("readout").style.color = "#a6a6a6";
                }
            } else if (data[this.dataType] > this.currentVal) {
                this.currentVal = data[this.dataType];
                this.readout = "\u25B2" + " " + this.currentVal.toFixed(1);
                if (this.dataType == "pm2_5" || this.dataType == "pm1" || this.dataType == "pm10") {
                    document.getElementById("readout").style.color = "#f90000";
                }
            } else if (data[this.dataType] < this.currentVal) {
                this.currentVal = data[this.dataType];
                this.readout = "\u25BC" + " " + this.currentVal.toFixed(1);
                if (this.dataType == "pm2_5" || this.dataType == "pm1" || this.dataType == "pm10") {
                    document.getElementById("readout").style.color = "#00b300";
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
        /**
         * Simulate MQTT payload for testing purposes.
         */
        simulatePayload: function () {
            // used to add an extra 0 in from of single digit values
            // so echarts is able to use timestamps
            // ex: 1:27:2 is changed to 01:27:02
            function addZero(i) {
                if (i < 10) {
                    i = "0" + i;
                }
                return i;
            }

            // generate a increment to add/subtract from testVal
            var rand = (Math.random() * 8) - 4.5;
            this.testVal += rand;

            // add upper and lower bounds
            // prevent negative values
            if (this.testVal < 0 || this.testVal > 120) {
                this.testVal += -2 * rand;
            }

            var d = new Date();
            var year = d.getFullYear();
            var month = addZero(d.getMonth() + 1);
            var date = addZero(d.getDate());
            var hour = addZero(d.getHours());
            var min = addZero(d.getMinutes());
            var sec = addZero(d.getSeconds());
            var time = year + "-" + month + "-" + date + " " + hour + ":" + min + ":" + sec;

            var payload = {
                timestamp: time,
                sensor_id: "000000000000",
                pm1: this.testVal,
                pm2_5: this.testVal,
                pm10: this.testVal,
                latitude: 0,
                longitude: 0,
                dewpoint: this.testVal,
                humidity: this.testVal,
                pressure: this.testVal,
                temperature: this.testVal,
            }
            this.addValues(payload);
        },
        resizeHandle: function () {
            this.chart.resize();
        },
        testFunction: function () {
            console.log("function called");
        }
    }
}
