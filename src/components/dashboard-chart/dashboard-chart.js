import Chart from "chart.js";

export default {
    data: () => ({
        chart: null,
        chartLabels: [0, 1, 2, 3],
        sensorValues: [1, 3, 2, 4],
        xTick: 4,
        yTick: 0,
    }),
    mounted: function() {
        this.initChart();
    },
    methods: {
        initChart: function() {
            this.chart = new Chart(document.getElementById("chart"), {
                type: "line",
                data: {
                    labels: this.chartLabels,
                    datasets: [{
                        label: "Values",
                        data: this.sensorValues,
                        fill: false,
                        borderColor: "#69b2ee", 
                    }]
                },
                options: {
                    title: {
                        display: true,
                        text: "Test Chart"
                    },
                    legend: {
                        display: false
                    },
                }
            });

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
            this.chart.data.datasets[0].data.push(this.yTick);
            this.chart.data.labels.push(this.xTick);

            // remove items once chart gets too full
            if (this.sensorValues.length > 30) {
                this.sensorValues.shift();
                this.chartLabels.shift();
            }

            this.xTick++;

            // update chart
            this.chart.update()
        },
    }
}