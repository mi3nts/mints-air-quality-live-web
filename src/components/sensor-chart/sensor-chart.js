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
    created: function() {
        this.startDate = this.$moment.utc().add(-24, 'hour').format("YYYY-MM-DD");
        this.endDate = this.$moment.utc().format("YYYY-MM-DD");
    },
    mounted: function() {
        this.initChart();
    },
    watch: {
        // watch for changes to view interval
        viewHourly() {
            this.initChart();
        }
    },
    methods: {
        initChart: function() {
            $("#chart2_" + this.sensor.sensor_id).html("<div class='my-4 text-center'>Loading data...</div>");
            sensorData.getChartData(
                this.sensor.sensor_id, {
                    start: this.$moment.utc(this.startDate).toISOString(),
                    end: this.$moment.utc(this.endDate).toISOString(),
                }, this.dataInterval
            ).then(response => {
                if (response.data.length) {
                    $("#chart2_" + this.sensor.sensor_id).html("<svg> </svg>");
                    this.createChart(response.data);
                } else {
                    $("#chart2_" + this.sensor.sensor_id).html("<div class='my-4 text-center'>No data available.</div>");
                }
            });
        },
        updateDataInterval: function(value) {
            this.dataInterval = value;
            var text = 'All data';
            switch (value) {
                case '1 60:60:60':
                    text = '1 Day';
                    break;
                case '1:60:60':
                    text = '1 hour';
                    break;
                case '30:60':
                    text = '30 minutes';
                    break;
                case '10:60':
                    text = '10 minutes';
                    break;
            }
            $("#interval-info").html("Interval: " + text);
        },
        changeInterval: function(values) {
            var length = values.length;
            length = length / 3000;
            length = Math.round(length);

            var newValues = [];
            var temp = [];
            var indexJ = 0;
            var average = 0;

            temp.push({ x: values[0].x, y: values[0].y });
            for (var i = 1; i < values.length; i++) {
                if (temp.length >= length) {
                    average = 0;
                    for (indexJ = 0; indexJ < temp.length; indexJ++) {
                        average += temp[indexJ].y;
                    }
                    average = average / temp.length;
                    newValues.push({ x: temp[0].x, y: average });

                    temp = [];
                }
                temp.push({ x: values[i].x, y: values[i].y });
            }
            if (temp.length >= 1) {
                average = 0;
                for (indexJ = 0; indexJ < temp.length; indexJ++) {
                    average += temp[indexJ].y;
                }
                average = average / temp.length;
                newValues.push({ x: temp[0].x, y: average });
            }
            return newValues;
        },
        createChart: function(data) {
            //formats the data for the chart
            var sensorValues = [];
            var standardDevNeg = [];
            var standardDevPos = [];
            var areaBottom = [];
            var areaSD = [];
            
            if (!this.viewHourly) {
                for (var i = 0; i < data.length; i++) {
                    sensorValues.push({
                        x: this.$moment.utc(data[i].timestamp).local().toDate(),
                        y: data[i].pm2_5
                    });
                }
            } else {
                var prevHour = null;
                var currHour = 0;
                var prevHourStart = 0;
                var hourlyValues = [];
                var avg = 0;
                var sd = 0;

                for (var j = 0; j < data.length; j++) {
                    currHour = this.$moment.utc(data[j].timestamp).local().toDate().getHours();

                    if (currHour == prevHour || prevHour == null) {
                        hourlyValues.push(data[j].pm2_5);
                    } else {
                        // calculate average and standard deviation
                        // avg = sum.reduce(((a, b) => a + b), 0) / sum.length;
                        avg = d3.mean(hourlyValues);

                        // returns the standard deviation, defined as the square root of the bias-corrected variance
                        // calculates variance using variance() from 'variance.js'
                        sd = d3.deviation(hourlyValues);

                        // plot on graph
                        sensorValues.push({
                            x: this.$moment.utc(data[prevHourStart].timestamp).local().toDate(),
                            y: avg
                        });
                        standardDevNeg.push({
                            x: this.$moment.utc(data[prevHourStart].timestamp).local().toDate(),
                            y: avg - sd
                        });
                        standardDevPos.push({
                            x: this.$moment.utc(data[prevHourStart].timestamp).local().toDate(),
                            y: avg + sd
                        });
                        areaBottom.push({ // covers area going up to -SD line
                            x: this.$moment.utc(data[prevHourStart].timestamp).local().toDate(),
                            y: avg - sd
                        });
                        areaSD.push({
                            x: this.$moment.utc(data[prevHourStart].timestamp).local().toDate(),
                            y: 2 * sd
                        })

                        // set marker index for next hour to display
                        prevHourStart = j;

                        // reset values
                        hourlyValues = [];
                    }
                    prevHour = currHour;
                }
            }
            if (sensorValues.length > 3000) {
                sensorValues = this.changeInterval(sensorValues);
            }
            var maxYValue;
            if (this.viewHourly) {
                maxYValue = Math.max.apply(Math, standardDevPos.map(function(o) { return o.y; }));
            } else {
                maxYValue = Math.max.apply(Math, sensorValues.map(function(o) { return o.y; }));
            }

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
                { // data
                    key: "PM 2.5",
                    values: [{}],
                    strokeWidth: this.viewHourly ? 3 : 1.5,
                    color: "#1f77b4"
                },
                { // standard deviation (-)
                    key: "PM 2.5 -SD",
                    values: [{}],
                    color: "#69b2ee",
                },
                { // standard deviation (+)
                    key: "PM 2.5 +SD",
                    values: [{}],
                    color: "#69b2ee",
                },
                // color ranges of µg/m³
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
                },
                { // transparent layer, used to help with area shading
                    key: "Lower Area",
                    values: areaBottom,
                    color: 'rgba(255, 255, 68, 0)',
                },
                { // shading for standard deviation
                    key: "SD Area",
                    values: areaSD,
                    color: "#69b2ee"
                },
            ];

            // sets the chart types among other things
            chartData[0].type = "line";
            chartData[0].yAxis = 1;
            chartData[0].values = sensorValues; // sets the data from sensor
            chartData[1].type = "line";
            chartData[1].yAxis = 1;
            chartData[1].values = standardDevPos;
            chartData[2].type = "line";
            chartData[2].yAxis = 1;
            chartData[2].values = standardDevNeg;

            // color ranges of µg/m³
            chartData[3].type = "area";
            chartData[3].yAxis = 1;
            chartData[4].type = "area";
            chartData[4].yAxis = 1;
            chartData[5].type = "area";
            chartData[5].yAxis = 1;
            chartData[6].type = "area";
            chartData[6].yAxis = 1;
            chartData[7].type = "area";
            chartData[7].yAxis = 1;

            // standard deviation shading
            chartData[8].type = "area";
            chartData[8].yAxis = 2;
            chartData[9].type = "area";
            chartData[9].yAxis = 2;

            let hourlyTicks = this.viewHourly;
            var sensor_id_chart = this.sensor.sensor_id;

            function createLegend () {
                // clear previously recreated legend
                d3.select("#legend").selectAll("*").remove();
                
                // do not show area shading (last 2 items in chartData)
                for (var i = 0; i < chartData.length - 2; i++) {
                    if (chartData[i].values.length > 0) {
                        // we don't need to display legend for both SD lines
                        // skip over the second line
                        // use a more general label for the first line
                        let labelText = "";
                        if (i == 2) {
                            continue;
                        } else if (i == 1) {
                            labelText = "PM 2.5 SD";
                        } else {
                            labelText = chartData[i].key;
                        }

                        d3.select("#legend")
                            .append("span")
                                .style("height", "20px")
                                .style("width", "20px")
                                .style("background-color", chartData[i].color)
                                .style("border-radius", "50%")
                                .style("display", "inline-block")
                                .style("margin-right", "5px");
                        d3.select("#legend")
                            .append("text")
                                .text(labelText)
                                .style("font-size", "12px")
                                .style("padding-right", "20px")
                                .style("position", "relative")
                                .style("bottom", "4px");
                    }
                }
            }

            nv.addGraph(function () {
                createLegend();
                var chart = nv.models.multiChart()
                    .margin({
                        top: 15,
                        right: 60,
                        bottom: 50,
                        left: 90
                    })
                    .color(d3.scale.category10().range())
                    .yDomain1([0, maxYValue]);
                chart.showLegend(false)
                nv.utils.windowResize(function(){ chart.update(); });
                chart.yDomain2([0, maxYValue]);
                chart.legend.updateState(false);
                chart.xAxis
                    .tickFormat(function(d) {
                        if (hourlyTicks) {
                            return d3.time.format('%b %d %I:00:00%p')(new Date(d));
                        } else {
                            return d3.time.format('%b %d %I:%M:%S%p')(new Date(d));
                        }
                    })
                    .staggerLabels(true);
                chart.yAxis1
                    .tickFormat(function(d) {
                        return d3.format(',.2f')(d) + 'µg/m³';
                    });
                chart.yAxis2
                    .tickFormat(function(d) {
                        return d3.format(',.2f')(d) + 'µg/m³';
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
}