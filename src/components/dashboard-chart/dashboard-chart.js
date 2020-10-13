import echarts from "echarts";

export default {
    data: () => ({
        chart: null,
        sensorValues: [
            {name: "test", value: [0, 1]},
            {name: "test", value: [1, 3]},
            {name: "test", value: [2, 2]},
            {name: "test", value: [3, 4]}
        ],
        xTick: 4,
        yTick: 0,
    }),
    mounted: function() {
        this.initChart();
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

            this.chart =  echarts.init(document.getElementById("chart"));
            this.chart.setOption(chartOptionsLine);
            window.addEventListener("resize", this.resizeHandle);

            // adds new value every second for demonstration purposes
            window.setInterval(this.addValues, 500);
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

            // add item
            this.sensorValues.push({
                name: "test",
                value: [this.xTick, this.yTick]
            });

            // remove items once chart gets too full
            if (this.sensorValues.length > 30) {
                this.sensorValues.shift();
            }

            this.xTick++;

            // update chart
            this.chart.setOption({
                series: [{
                    data: this.sensorValues
                }]
            })
        },
        resizeHandle: function() {
            this.chart.resize();
            //this.echartInstance2.resize();
            //this.echartInstance3.resize();
        },
        destroyed: function() {
            window.removeEventListener("resize", this.resizeHandle);
        }
    }
}