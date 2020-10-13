import HighCharts from "highcharts";

export default {
    data: () => ({
        chart: null,
        sensorValues: [1, 3, 2, 4],
        yTick: 0,
    }),
    mounted: function() {
        this.initChart();
    },
    methods: {
        initChart: function() {
            this.chart = HighCharts.chart("chart", {
                chart: {
                    type: "line",
                },
                title: {
                    text: "Test Chart",
                },
                legend: {
                    enabled: false,
                },
                plotOptions: {
                    series: {
                        pointStart: 0,
                        marker: {
                            enabled: false
                        }
                    },
                },
                series: [{
                    name: "Test Values",
                    data: this.sensorValues,
                }]
            })

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
            this.sensorValues.push(this.yTick)

            // remove items once chart gets too full
            if (this.sensorValues.length > 30) {
                this.sensorValues.shift();
            }

            // update chart
            this.chart.update({
                series: [{
                    data: this.sensorValues
                }]
            })
        },
    }
}