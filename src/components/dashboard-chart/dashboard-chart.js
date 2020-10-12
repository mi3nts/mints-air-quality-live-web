import ApexCharts from "apexcharts";

export default {
    data: () => ({
        chart: null,
        sensorValues: [],
        xTick: 0,
        yTick: 0,
        tickTimer: null,
    }),
    mounted: function() {
        this.initChart();
    },
    methods: {
        initChart: function() {
            var options = {
                series: [{data: this.sensorValues}],
                chart: {
                    id: "realtime",
                    height: 350,
                    type: "line",
                    animations: {
                        enabled: true,
                        easing: "linear",
                        dynamicAnimations: {
                            speed: 1000
                        }
                    },
                    toolbar: {
                        show: false,
                    },
                    zoom: {
                        enabled: false,
                    },
                },
                dataLabels: {
                    enabled: false,
                },
                title: {
                    text: "Test Chart",
                    alight: "left",
                },
                markers: {
                    size: 0,
                },
                xaxis: {
                    labels: {show: false},
                    type: "numeric",
                },
                yaxis: {
                    max: 10
                },
                legend: {
                    show: false
                },
            };
            this.chart = new ApexCharts(document.querySelector("#chart"), options);
            this.chart.render();

            // adds new value every second for demonstration purposes
            this.tickTimer = window.setInterval(this.addValues, 500);
        },
        /**
         * Currently alternates between 0 and 7 for demo purposes.
         * 
         * With MQTT, we should be able to watch for values and
         * then call addValues() to add the data and update 
         * the chart(s).
         * 
         * TODO: Fix the bug that shows up when switch back to the map
         * 
         * When switching back to map view, the chart attempts to
         * continue updating in the background. This causes a problem
         * with the way things are set up currently.
         */
        addValues: function() {
            if (this.yTick == 0) { 
                this.yTick = 7; 
            } else {
                this.yTick = 0;
            }

            this.sensorValues.push({
                x: this.xTick,
                y: this.yTick
            })

            this.xTick++;
          
            this.chart.updateSeries([{
                data: this.sensorValues
            }])
        },
    }
}