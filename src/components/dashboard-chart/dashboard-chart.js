import echarts from "echarts";

export default {
    props: [
        "dataType",
    ],
    data: () => ({
        chart: null,
        // dataType: "pm2_5", // this will need to be determined by chart selection
        sensorValues: [],
        currentVal: null,
        testVal: (Math.random() * 10) + 1, // used for testing with simulated payloads
        timer: null,
    }),
    mounted: function () {
        // subscribe to MQTT stream
        console.log(this.$mqtt.subscribe('#'));
        this.initChart();
        this.timer = setInterval(this.simulatePayload, 1000);
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
        clearInterval(this.timer)
    },
    computed: {
        getChart() {
            return this.$store.getters.getChart(this.dataType)
        }
    },
    methods: {
        initChart: function () {
            var chartOptionsLine = {
                title: {
                    text: this.dataType,
                    left: "center",
                    padding: [20, 0, 0, 0]
                },
                xAxis: {
                    type: "time",
                    show: false,
                    splitLine: {
                        show: false
                    },
                    axisTick: {
                        show: false
                    },
                    axisLabel: {
                        show: false
                    }
                },
                yAxis: {
                    type: "value",
                    boundaryGap: [0, 0],
                    splitLine: {
                        show: false
                    },
                    axisLabel: {
                        fontSize: 16,
                    }
                },
                series: [{
                    name: 'Test Values',
                    type: "line",
                    lineStyle: {
                        color: "#5db4e1",
                        width: 5,
                    },
                    markLine: {
                        silent: true,
                        symbol: "circle",
                        lineStyle: {
                            color: "#cc0000",
                            width: 3
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
        },
        addValues: function (data) {
            //console.log(data.timestamp);
            // console.log(data[this.dataType]);
            //console.log(this.$store.getters.getChart(this.dataType))
            //console.log(this.getChart)

            /*  this.sensorValues[this.dataType].push({
                 name: this.dataType,
                 value: [
                     data.timestamp,
                     data[this.dataType]
                 ]
             }); */

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

            // update current value to display
            this.currentVal = data[this.dataType].toFixed(1);

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
            var rand = (Math.random() * 6) - 3;
            this.testVal += rand;

            // add upper and lower bounds
            // prevent negative values
            if (this.testVal < 0 || this.testVal > 50) {
                this.testVal += -2 * rand;
            }

            var d = new Date();
            var year = d.getFullYear();
            var month = addZero(d.getMonth());
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
        }
    }
}
