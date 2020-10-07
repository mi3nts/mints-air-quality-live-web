export default {
    data: () => ({
        chartOptionsLine: {
            xAxis: {
                data: [
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec"
                ]
            },
            yAxis: {
                type: "value"
            },
            series: [{
                type: "line",
                data: [55, 72, 84, 48, 59, 62, 87, 75, 94, 101, 127, 118]
            }],
            title: {
                text: "Monthly Stock Prices",
                x: "center",
                textStyle: {
                    fontSize: 24
                }
            },
            color: ["#127ac2"]
        }
    })
};