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
        closeIt: function () {
            this.$emit('close');
        },
        createChart: function (data) {
            //formats the data for the chart
            var val = [];
            for (var i = 0; i < data.length; i++) {
                val.push({
                    x: this.$moment.utc(data[i].timestamp).local().toDate(),
                    y: data[i].pm2_5
                });
            }
            var testdata = [
                //data
                {
                    key: "PM 2.5",
                    values: [{}]
                },
                //color ranges of µg/m³
                { //0-10µg/m³ yellow
                    key: "0-25µg/m³",
                    values: [{
                            x: val[0].x,
                            y: 10
                        },
                        {
                            x: val[val.length - 1].x,
                            y: 10
                        }
                    ],
                    color: "rgba(255,255,0, 0.7)"
                },
                { //10-20µg/m³ orange
                    key: "25-50µg/m³",
                    values: [{
                            x: val[0].x,
                            y: 10
                        },
                        {
                            x: val[val.length - 1].x,
                            y: 10
                        }
                    ],
                    color: "rgba(255,128,0, 0.7)"
                },
                { //20-50µg/m³ red
                    key: "50-100µg/m³",
                    values: [{
                            x: val[0].x,
                            y: 30
                        },
                        {
                            x: val[val.length - 1].x,
                            y: 30
                        }
                    ],
                    color: "rgba(220,0,0, 0.7)"
                },
                { //50-100µg/m³ purple
                    key: "100-150µg/m³",
                    values: [{
                            x: val[0].x,
                            y: 50
                        },
                        {
                            x: val[val.length - 1].x,
                            y: 50
                        }
                    ],
                    color: "rgba(76,0,153, 0.7)"
                },
                { //100+µg/m³ maroon
                    key: "150+µg/m³",
                    values: [{
                            x: val[0].x,
                            y: 50
                        },
                        {
                            x: val[val.length - 1].x,
                            y: 50
                        }
                    ],
                    color: "rgba(140,22,22, 0.7)"
                }
            ];

            //sets the chart types among other things
            testdata[0].type = "line";
            testdata[0].yAxis = 1;
            testdata[0].values = val; //sets the data from sensor
            testdata[1].type = "area";
            testdata[1].yAxis = 1;
            testdata[2].type = "area";
            testdata[2].yAxis = 1;
            testdata[3].type = "area";
            testdata[3].yAxis = 1;
            testdata[4].type = "area";
            testdata[4].yAxis = 1;
            testdata[5].type = "area";
            testdata[5].yAxis = 1;

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
                    .staggerLabels(true);
                chart.yAxis1
                    .tickValues([10, 20, 50, 100, 150])
                    .tickFormat(function (d) {
                        return d3.format(',.1f')(d) + 'µg/m³'
                    })
                    .showMaxMin(false);
                d3.select('#chart svg')
                    .datum(testdata)
                    .transition()
                    .duration(500)
                    .call(chart);
                return chart;
            });
        }
    }
}