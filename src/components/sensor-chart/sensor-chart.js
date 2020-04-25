import sensorData from "../../services/sensor-data";

export default {
    props: ["sensor"],
    data: () => ({
        startDateModel: false,
        endDateModel: false,
        startDate: null,
        endDate: null
    }),
    created: function () {
        this.startDate = this.$moment().add(-1, 'day').format("YYYY-MM-DD");
        this.endDate = this.$moment().format("YYYY-MM-DD");
    },
    mounted: function () {
        this.initChart();
    },
    methods: {
        initChart: function () {
            $("#chart2").html("<div class='my-4 text-center'>Loading data...</div>");
            sensorData.getChartData(this.sensor.sensor_id, {
                start: this.$moment.utc(this.startDate).toISOString(),
                end: this.$moment.utc(this.endDate).toISOString(),
            }).then(response => {
                if (response.data.length) {
                    $("#chart2").html("<svg> </svg>")
                    this.createChart(response.data);
                } else {
                    $("#chart2").html("<div class='my-4 text-center'>No data available.</div>");
                }
            });
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
                { //0-25µg/m³ yellow
                    key: "0-25µg/m³",
                    values: [{
                            x: val[0].x,
                            y: 25
                        },
                        {
                            x: val[val.length - 1].x,
                            y: 25
                        }
                    ],
                    color: '#ffff44'
                },
                { //25-50µg/m³ orange
                    key: "25-50µg/m³",
                    values: [{
                            x: val[0].x,
                            y: 25
                        },
                        {
                            x: val[val.length - 1].x,
                            y: 25
                        }
                    ],
                    color: '#ff5500'
                },
                { //50-100µg/m³ red
                    key: "50-100µg/m³",
                    values: [{
                            x: val[0].x,
                            y: 50
                        },
                        {
                            x: val[val.length - 1].x,
                            y: 50
                        }
                    ],
                    color: '#cc0000'
                },
                { //100-150µg/m³ purple
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
                    color: '#990099'
                },
                { //150+µg/m³ maroon
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
                    color: '#aa2626'
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
                        right: 60,
                        bottom: 50,
                        left: 90
                    })
                    .color(d3.scale.category10().range())
                    .yDomain1([0, 200]);
                chart.xAxis
                    .tickFormat(function (d) {
                        return d3.time.format('%b %d %I:%M:%S%p')(new Date(d))
                    })
                    .staggerLabels(true);
                chart.yAxis1
                    .tickFormat(function (d) {
                        return d3.format(',.2f')(d) + 'µg/m³'
                    });
                d3.select('#chart2 svg')
                    .datum(testdata)
                    .transition()
                    .duration(500)
                    .call(chart);
                return chart;
            });
        }
    }
};