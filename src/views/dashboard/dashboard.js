import echarts from "echarts";

export default {
    mounted() {
        function randomData() {
            now.setDate(now.getDate() + 1);
            value = value + Math.random() * 21 - 10;
            return {
                name: now.toString(),
                value: [
                    [now.getFullYear(), now.getMonth() + 1, now.getDate()].join('/'),
                    Math.round(value)
                ]
            };
        }
        var arr = [];
        var now = new Date(1997, 9, 3);
        var value = Math.random() * 1000;
        for (var i = 0; i < 1000; i++) {
            arr.push(randomData());
        }
        var chartOptionsLine = {
            title: {
                text: '动态数据 + 时间坐标轴'
            },
            tooltip: {
                trigger: 'axis',
                formatter: function(params) {
                    params = params[0];
                    var date = new Date(params.name);
                    return date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear() + ' : ' + params.value[1];
                },
                axisPointer: {
                    animation: false
                }
            },
            xAxis: {
                type: 'time',
                splitLine: {
                    show: false
                }
            },
            yAxis: {
                type: "value",
                boundaryGap: [0, '100%'],
                splitLine: {
                    show: false
                }
            },
            series: [{
                name: '模拟数据',
                type: "line",
                showSymbol: false,
                hoverAnimation: false,
                data: arr,
            }],
            color: ["#127ac2"]
        };
        var echartInstance1 = echarts.init(document.getElementById("chart1"));
        echartInstance1.setOption(chartOptionsLine);
        window.addEventListener("resize", this.resizeHandle);

        setInterval(function() {
            for (var i = 0; i < 5; i++) {
                arr.shift();
                arr.push(randomData());
            }
            echartInstance1.setOption({
                series: [{
                    data: arr
                }],
            });
        }, 1000);
    },
    methods: {
        resizeHandle: function() {
            this.echartInstance1.resize();
            //this.echartInstance2.resize();
            //this.echartInstance3.resize();
        },
        destroyed: function() {
            window.removeEventListener("resize", this.resizeHandle);
        }
    },
};