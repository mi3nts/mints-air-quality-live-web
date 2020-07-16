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
    props: ["spot", "spotName"],
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
            }, '30:60').then(response => {
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
            var maxYValue = Math.max.apply(Math, sensorValues.map(function(o) { return o.y; }))
            var yellowValue = 0;
            var orangeValue = 0;
            var redValue = 0;
            var purpleValue = 0;
            var maroonValue = 0;
            if (maxYValue < 10) {
                yellowValue = maxYValue;
            } else if (maxYValue < 20) {
                yellowValue = 10;
                orangeValue = maxYValue - yellowValue;
            } else if (maxYValue < 50) {
                yellowValue = 10;
                orangeValue = 10;
                redValue = maxYValue - (yellowValue + orangeValue);
            } else if (maxYValue < 100) {
                yellowValue = 10;
                orangeValue = 10;
                redValue = 30;
                purpleValue = maxYValue - (yellowValue + orangeValue + redValue);
            } else {
                yellowValue = 10;
                orangeValue = 10;
                redValue = 30;
                purpleValue = 50;
                maroonValue = maxYValue - (yellowValue + orangeValue + redValue + purpleValue);
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
                            y: yellowValue
                        },
                        {
                            x: sensorValues[sensorValues.length - 1].x,
                            y: yellowValue
                        }
                    ],
                    color: '#ffff44'
                },
                { //10-20/m³ orange
                    key: "10-20µg/m³",
                    values: [{
                            x: sensorValues[0].x,
                            y: orangeValue
                        },
                        {
                            x: sensorValues[sensorValues.length - 1].x,
                            y: orangeValue
                        }
                    ],
                    color: '#ff5500'
                },
                { //20-50µg/m³ red
                    key: "20-50µg/m³",
                    values: [{
                            x: sensorValues[0].x,
                            y: redValue
                        },
                        {
                            x: sensorValues[sensorValues.length - 1].x,
                            y: redValue
                        }
                    ],
                    color: '#cc0000'
                },
                { //50-100µg/m³ purple
                    key: "50-100µg/m³",
                    values: [{
                            x: sensorValues[0].x,
                            y: purpleValue
                        },
                        {
                            x: sensorValues[sensorValues.length - 1].x,
                            y: purpleValue
                        }
                    ],
                    color: '#990099'
                },
                { //100+µg/m³ maroon
                    key: "100+µg/m³",
                    values: [{
                            x: sensorValues[0].x,
                            y: maroonValue
                        },
                        {
                            x: sensorValues[sensorValues.length - 1].x,
                            y: maroonValue
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
                var maxYValue = Math.max.apply(Math, chartData[0].values.map(function(o) { return o.y; }))
                var chart = nv.models.multiChart()
                    .margin({
                        top: 30,
                        right: 30,
                        bottom: 30,
                        left: 90
                    })
                    .showLegend(false)
                    .color(d3.scale.category10().range())
                    .yDomain1([0, maxYValue]);
                chart.xAxis
                    .tickFormat(function (d) {
                        return d3.time.format('%I:%M%p')(new Date(d))
                    })
                    .tickValues([]);
                chart.yAxis1
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
