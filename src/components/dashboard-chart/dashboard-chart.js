import echarts from "echarts";

export default {
    data: () => ({
        chart: null,
        sensorValues: [
            { name: "test", value: [0, 1] },
            { name: "test", value: [1, 3] },
            { name: "test", value: [2, 2] },
            { name: "test", value: [3, 4] }
        ],
        xTick: 4,
        yTick: 0,
    }),
    mounted: function() {
        this.initChart();
        // adds new value every second for demonstration purposes
        if (this.xTick == 4) {
            setInterval(this.addValues, 500);
        }
    },
    methods: {
        initChart: function() {
            var chartOptionsLine = {
                title: {
                    text: "Test Chart"
                },
                xAxis: {
                    splitLine: {
                        show: false
                    }
                },
                yAxis: {
                    type: "value",
                    boundaryGap: [0, '100%'],
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
        /**
         * Currently alternates between 0 and 7 for demo purposes.
         * 
         * With MQTT, we should be able to watch for values and
         * then call addValues() to add the data and update 
         * the chart(s).
         */
        addValues: function() {
            // alternate between 0 and 7
            if (this.yTick == 0) {
                this.yTick = 7;
            } else {
                this.yTick = 0;
            }

            /*if (this.sensorValues.length >= 20) {
                this.sensorValues = [];
                this.xTick = 20;
                this.yTick = 0;
            }*/

            this.sensorValues.push({
                name: "test",
                value: [this.xTick, this.yTick]
            });
            // update chart
            this.chart.setOption({
                series: [{
                    data: this.sensorValues
                }]
            })
            this.xTick += 1;
        },
        resizeHandle: function() {
            this.chart.resize();
        }
    }
}