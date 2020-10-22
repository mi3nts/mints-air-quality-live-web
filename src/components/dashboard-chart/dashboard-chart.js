import echarts from "echarts";

export default {
    data: () => ({
        chart: null,
        dataType: "pm2_5", // this will need to be determined by chart selection
        sensorValues: [], 
    }),
    mounted: function() {
        // subscribe to MQTT stream
        console.log(this.$mqtt.subscribe('#'));
        this.initChart();
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
                this.addValues(payload);
            }
        }
    },
    methods: {
        initChart: function() {
            var chartOptionsLine = {
                title: {
                    text: this.dataType,
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

            // update chart
            this.chart.setOption({
                series: [{
                    data: this.sensorValues
                }]
            })
        },
        resizeHandle: function() {
            this.chart.resize();
        }
    }
}
