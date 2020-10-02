import Vue from "vue";
/**
 * Data service which provides data from 3rd party API to application.
 * End point must support CORS.
 */
export default new Vue({
    data: function () {
        return {
            baseUrl: "https://mintsdata.utdallas.edu:3000"
        }
    },
    methods: {
        getSensors: function () {
            return this.$axios.get(this.baseUrl + "/sensor_id_list");
        },
        getSensorData: function (sensorID) {
            return this.$axios.get(this.baseUrl + "/latest/" + sensorID);
        },
        getSensorLocation: function (sensorID) {
            return this.$axios.get(this.baseUrl + "/location/" + sensorID);
        },
        getSensorName: function (sensorID) {
            return this.$axios.get(this.baseUrl + "/sensorNameOf/" + sensorID);
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