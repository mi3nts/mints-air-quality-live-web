import Vue from "vue";
/**
 * Data service which provides data from 3rd party API to application.
 * End point must support CORS.
 */
export default new Vue({
    data: function () {
        return {
            baseUrl: "http://mintsdata.utdallas.edu:3000"
        }
    },
    methods: {
        getSensors: function () {
            return this.$axios.get(this.baseUrl +"/sensor_id_list");
        },
        getSensorData: function (sensorID) {
            return this.$axios.get(this.baseUrl +"/latest/" + sensorID);
        },
        getWindData: function () {
            return this.$axios.get(this.baseUrl + "/wind_data/latest");
        }
    }
});