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
		changeInterval: function (values) {
			var length = values.length;
			length = length / 3000;
			length = Math.round(length);
			
			var newValues = [];
			var temp = [];
			var indexJ = 0;
			var average = 0;
			
			temp.push({x:values[0].x, y:values[0].y});
			for(var i = 1; i < values.length; i++){
				if(temp.length >= length){
					average = 0;
					for(indexJ = 0; indexJ < temp.length; indexJ++){
						average += temp[indexJ].y;
					}
					average = average / temp.length;
					newValues.push({x:temp[0].x, y:average});
					
					temp = [];
				}
				temp.push({x:values[i].x, y:values[i].y});
			}
			if(temp.length >= 1){
				average = 0;
				for(indexJ = 0; indexJ < temp.length; indexJ++){
					average += temp[indexJ].y;
				}
				average = average / temp.length;
				newValues.push({x:temp[0].x, y:average});
			}
			console.log(newValues);
			return newValues;
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
			if(sensorValues.length > 3000){
				sensorValues = this.changeInterval(sensorValues);
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
                { //10-20/m³ orange
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
                    key: "50-100µg/m³",
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
                        top: 50,
                        right: 60,
                        bottom: 50,
                        left: 90
                    })
                    .color(d3.scale.category10().range())
                    .yDomain1([0, 150]);
				chart.legend.updateState(false);
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
                    .datum(chartData)
                    .transition()
                    .duration(500)
                    .call(chart);
                return chart;
            });
        }
    }
};