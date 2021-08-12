import Vue from "vue";
/**
 * Data service which provides data from 3rd party API to application.
 * End point must support CORS.
 */
export default new Vue({
    data: function () {
        return {
            baseUrl: "https://api.sharedairdfw.com"
        }
    },
    methods: {
        getSensorsList: function () {
            return this.$axios.get(this.baseUrl + "/sensors/list");
        },
        getMainSensorData: function() {
            return this.$axios.get(this.baseUrl + "/latest/all/main");
        },
        getSensorData: function (sensorID) {
            return this.$axios.get(this.baseUrl + "/sensors/" + sensorID + "/latest");
        },
        getSensorPastHourAverage: function (sensorID, type, interval) {
            return this.$axios.get(this.baseUrl + "/latest/average/" + type + "/" + sensorID + "/" + interval)  
        },
        getChartData: function (sensorID, range, interval) {
            if(interval == '')
                return this.$axios.get(this.baseUrl + `/data/pm2_5/${sensorID}/${range.start}/${range.end}`);
            return this.$axios.get(this.baseUrl + `/data/pm2_5/${sensorID}/${range.start}/${range.end}/${interval}`);
        },
        getWindData: function () {
            return this.$axios.get(this.baseUrl + "/wind_data/latest");
        }
    }
});