<template>
    <div>
        <div id="chart-container"></div>
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
        this.echartInstance = echarts.init(document.getElementById('chart-container'));
        this.echartInstance.setOption(chartOptionsLine);
        window.addEventListener("resize",this.resizeHandle);
    },
    methods:{
        resizeHandle(){
            this.echartInstance.resize()
        }
    },
    destroyed: function() {
        window.removeEventListener("resize",this.resizeHandle)
    }
}
</script>
 
<style>
#chart-container{
    width: 100%;
    height: 700px;
}
</style>

