<template>
    <div style="height: 700px">
        <div id="chart1"></div>
        <div id="chart2"></div>
        <div id="chart3"></div>
    </div>
</template>
 
<script>
import echarts from 'echarts'
 
export default {
    mounted: function() {
        var chartOptionsLine = {
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
        };
        this.echartInstance1 = echarts.init(document.getElementById('chart1'));
        this.echartInstance2 = echarts.init(document.getElementById('chart2'));
        this.echartInstance3 = echarts.init(document.getElementById('chart3'));
        this.echartInstance1.setOption(chartOptionsLine);
        this.echartInstance2.setOption(chartOptionsLine);
        this.echartInstance3.setOption(chartOptionsLine);
        window.addEventListener("resize",this.resizeHandle);
    },
    methods:{
        resizeHandle(){
            this.echartInstance1.resize();
            this.echartInstance2.resize();
            this.echartInstance3.resize();
        }
    },
    destroyed: function() {
        window.removeEventListener("resize",this.resizeHandle)
    }
}
</script>
 
<style>
#chart1{
    width: 100%;
    height: 33%;
}
#chart2 {
    width: 100%;
    height: 33%;
}
#chart3 {
    width: 100%;
    height: 33%
}
</style>

