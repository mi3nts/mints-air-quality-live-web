import sensorData from "../../services/sensor-data";
import SensorChart from "../sensor-chart"
/**
 * This is stand alone component showing sensor data only. 
 * Eventually it will grow to show more data.
 */
export default {
    components: {
        SensorChart
    },
    props: ["spot"],
    data: () => ({
        showMore: false
    }),
    watch: {
        'spot': function () {
            this.initChart();
        }
    },
    created: function () {},
    mounted: function () {
        this.initChart();
    },
    methods: {
        initChart: function () {
            $("#chart").css('height', '50px').html("<div class='my-4 text-center'>Loading data...</div>");
            sensorData.getChartData(this.spot.sensor_id, {
                start: this.$moment.utc().add(-24, 'hour').toISOString(),
                end: this.$moment.utc().toISOString(),
            }).then(response => {
                if (response.data.length) {
                    $("#chart").css('height', '250px').html("<svg> </svg>")
                    this.createChart(response.data);
                } else {
                    $("#chart").css('height', '50px').html("<div class='my-4 text-center'>No data available.</div>");
                }
            });
        },
        formatNumber: function (num) {
            return Number(num).toFixed(1);
        },
        spotTemperature: function () {
            return (this.spot.temperature * (9 / 5)) + 32;
        },
        closeIt: function () {
            this.$emit('close');
        },
        createChart: function (data) {
            //formats the data for the chart
            var sensorValues = [];
            for (var i = 0; i < data.length; i++) {
                sensorValues.push({
                    x: this.$moment.utc(data[i].timestamp).local().toDate(),
                    y: data[i].pm2_5
                });
            }
            var chartData = [
                //data
                {
                    key: "PM 2.5",
                    values: [{}]
                },
                //color ranges of µg/m³
                { //0-10µg/m³ yellow
                    key: "0-10µg/m³",
                    values: [{
                            x: sensorValues[0].x,
                            y: 10
                        },
                        {
                            x: sensorValues[sensorValues.length - 1].x,
                            y: 10
                        }
                    ],
                    color: '#ffff44'
                },
                { //10-20µg/m³ orange
                    key: "10-20µg/m³",
                    values: [{
                            x: sensorValues[0].x,
                            y: 10
                        },
                        {
                            x: sensorValues[sensorValues.length - 1].x,
                            y: 10
                        }
                    ],
                    color: '#ff5500'
                },
                { //20-50µg/m³ red
                    key: "20-50µg/m³",
                    values: [{
                            x: sensorValues[0].x,
                            y: 30
                        },
                        {
                            x: sensorValues[sensorValues.length - 1].x,
                            y: 30
                        }
                    ],
                    color: '#cc0000'
                },
                { //50-100µg/m³ purple
                    key: "50-100µg/m³",
                    values: [{
                            x: sensorValues[0].x,
                            y: 50
                        },
                        {
                            x: sensorValues[sensorValues.length - 1].x,
                            y: 50
                        }
                    ],
                    color: '#990099'
                },
                { //100+µg/m³ maroon
                    key: "100+µg/m³",
                    values: [{
                            x: sensorValues[0].x,
                            y: 50
                        },
                        {
                            x: sensorValues[sensorValues.length - 1].x,
                            y: 50
                        }
                    ],
                    color: '#aa2626'
                }
            ];

            //sets the chart types among other things
            chartData[0].type = "line";
            chartData[0].yAxis = 1;
            chartData[0].values = sensorValues; //sets the data from sensor
            chartData[1].type = "area";
            chartData[1].yAxis = 1;
            chartData[2].type = "area";
            chartData[2].yAxis = 1;
            chartData[3].type = "area";
            chartData[3].yAxis = 1;
            chartData[4].type = "area";
            chartData[4].yAxis = 1;
            chartData[5].type = "area";
            chartData[5].yAxis = 1;

            nv.addGraph(function () {
                var chart = nv.models.multiChart()
                    .margin({
                        top: 30,
                        right: 30,
                        bottom: 30,
                        left: 90
                    })
                    .showLegend(false)
                    .color(d3.scale.category10().range())
                    .yDomain1([0, 150]);
                chart.xAxis
                    .tickFormat(function (d) {
                        return d3.time.format('%I:%M%p')(new Date(d))
                    })
                    .tickValues([]);
                chart.yAxis1
                    .tickValues([10, 20, 50, 100, 150])
                    .tickFormat(function (d) {
                        return d3.format(',.1f')(d) + 'µg/m³'
                    })
                    .showMaxMin(false);
                d3.select('#chart svg')
                    .datum(chartData)
                    .transition()
                    .duration(500)
                    .call(chart);
                return chart;
            });
        }
    }
}