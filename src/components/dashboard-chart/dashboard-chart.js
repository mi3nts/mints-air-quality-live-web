import echarts from "echarts";

export default {
    data: () => ({
        chart: null,
        dataType: "pm2_5", // this will need to be determined by chart selection
        sensorValues: [], 
        testVal: (Math.random() * 10) + 1, // used for testing with simulated payloads
    }),
    mounted: function() {
        // subscribe to MQTT stream
        console.log(this.$mqtt.subscribe('#'));
        this.initChart();
        setInterval(this.simulatePayload, 1000);
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
    methods: {
        initChart: function() {
            var chartOptionsLine = {
                title: {
                    text: this.dataType,
                    left: "center",
                },
                xAxis: {
                    type: "time",
                    splitLine: {
                        show: false
                    }
                },
                yAxis: {
                    type: "value",
                    boundaryGap: [0, 0],
                    splitLine: {
                        show: false
                    }
                },
                series: [{
                    name: 'Test Values',
                    type: "line",
                    showSymbol: false,
                    hoverAnimation: false,
                    animation: false,
                    data: this.sensorValues,
                }],
                color: ["#69b2ee"]
            };
            this.chart = echarts.init(document.getElementById("chart"));
            this.chart.setOption(chartOptionsLine);
            window.addEventListener("resize", this.resizeHandle);
        },
        addValues: function(data) {
            console.log(data.timestamp);
            console.log(data[this.dataType]);

            this.sensorValues.push({
                name: this.dataType,
                value: [
                    data.timestamp,
                    data[this.dataType]
                ]
            });
 
            if (this.sensorValues.length > 100) {
                this.sensorValues.shift();
            }

            // update chart
            this.chart.setOption({
                series: [{
                    data: this.sensorValues
                }]
            })
        },
        /**
         * Simulate MQTT payload for testing purposes.
         */
        simulatePayload: function() {
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
            var rand = (Math.random() * 7) - 3;
            this.testVal += rand;

            // remove possibility of negative values
            if (this.testVal < 0) {
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
                pm1: this.testVal - 1,
                pm2_5: this.testVal,
                pm10: this.testVal + 1,
                latitude: 0,
                longitude: 0,
                dewpoint: 100,
                humidity: 100,
                pressure: 100,
                temperature: 100,
            }
            this.addValues(payload);
        },
        resizeHandle: function() {
            this.chart.resize();
        }
    }
}
