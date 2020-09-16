import sensorData from "../../services/sensor-data";

export default {
    props: ["sensor"],
    data: () => ({
        startDateModel: false,
        endDateModel: false,
        startDate: null,
        endDate: null,
        dataInterval: '', 
        switchText: "Show Hourly Averages",
        viewHourly: false
    }),
    created: function () {
        this.startDate = this.$moment.utc().add(-24, 'hour').format("YYYY-MM-DD");
        this.endDate = this.$moment.utc().format("YYYY-MM-DD");
    },
    mounted: function () {
        this.initChart();
    },
    watch: {
        // watch for changes to view interval
        viewHourly() {
            this.initChart();
        }
    },
    methods: {
        initChart: function () {
            $("#chart2_" + this.sensor.sensor_id).html("<div class='my-4 text-center'>Loading data...</div>");
            sensorData.getChartData(
                this.sensor.sensor_id, {
                    start: this.$moment.utc(this.startDate).toISOString(),
                    end: this.$moment.utc(this.endDate).toISOString(),
                }, this.dataInterval
            ).then(response => {
                if (response.data.length) {
                    $("#chart2_" + this.sensor.sensor_id).html("<svg> </svg>")
                    this.createChart(response.data);
                } else {
                    $("#chart2_" + this.sensor.sensor_id).html("<div class='my-4 text-center'>No data available.</div>");
                }
            });
        },
        updateDataInterval: function (value) {
            this.dataInterval = value
            var text = 'All data'
            switch(value) {
                case '1 60:60:60':
                    text = '1 Day'
                    break
                case '1:60:60':
                    text = '1 hour'
                    break
                case '30:60':
                    text = '30 minutes'
                    break
                case '10:60':
                    text = '10 minutes'
                    break
            }
            $("#interval-info").html("Interval: " + text)
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
            return newValues;
        },
        createChart: function (data) {
            //formats the data for the chart
            console.log("viewHourly is " + this.viewHourly);
            var sensorValues = [];
            if(!this.viewHourly) {
                for (var i = 0; i < data.length; i++) {
                    sensorValues.push({
                        x: this.$moment.utc(data[i].timestamp).local().toDate(),
                        y: data[i].pm2_5
                    });
                }
            } else {
                var prevHour = 0;
                var currHour = 0;
            
                var prevHourStart = 0;

                var sum = [];
                var avg = 0;

                for (var j = 0; j < data.length; j++) {
                    currHour = this.$moment.utc(data[j].timestamp).local().toDate().getHours();
                    
                    if (currHour == prevHour) {
                        sum.push(data[j].pm2_5);
                    } else {
                        // calculate average
                        // TODO: double check this
                        if (sum.length != 0)
                        {
                            avg = sum.reduce(((a, b) => a + b), 0) / sum.length;

                            console.log(avg);

                            // push node
                            sensorValues.push({
                                x: this.$moment.utc(data[prevHourStart].timestamp).local().toDate(),
                                y: avg
                            });
                        }
                        
                        // set new marker for next hour to display
                        prevHourStart = j;

                        // reset values
                        sum = [];
                    }

                    prevHour = currHour;
                }
                // console.log(sensorValues);
            }        
            if(sensorValues.length > 3000){
                console.log("changeInterval is called...");
                sensorValues = this.changeInterval(sensorValues);
            }
            // var maxYValue = Math.max.apply(Math, sensorValues.map(function(o) { return o.y; }))
            var maxYValue = Math.max.apply(Math, Object.values(sensorValues.map((o)=>{return o.y})));
            console.log("Max Y is ", maxYValue);

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

            var sensor_id_chart = this.sensor.sensor_id
            nv.addGraph(function () {
                var chart = nv.models.multiChart()
                    .margin({
                        top: 50,
                        right: 60,
                        bottom: 50,
                        left: 90
                    })
                    .color(d3.scale.category10().range())
                    .yDomain1([0, maxYValue]);
                chart.legend.updateState(false);
                chart.xAxis
                    .tickFormat(function (d) {
                        return d3.time.format('%b %d %I:00:00 %p')(new Date(d))
                    })
                    .staggerLabels(true);
                chart.yAxis1
                    .tickFormat(function (d) {
                        return d3.format(',.2f')(d) + 'µg/m³'
                    });
                d3.select("#chart2_" + sensor_id_chart + " svg")
                    .datum(chartData)
                    .transition()
                    .duration(500)
                    .call(chart);
                return chart;
            });
        }
    }
};
