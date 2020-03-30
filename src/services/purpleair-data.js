import Vue from "vue";
/**
 * Data service which provides data from Purple Air API to application.
 * End point must support CORS.
 */
export default new Vue({
    data: function () {
        return {
            baseUrl: "https://www.purpleair.com/json",
            sensors: [31403, 49395, 13013, 12969, 8682, 2644, 16271, 2508, 8548, 2667, 46221, 47967]
        }
    },
    methods: {
        /**
         * More information here
         * https://docs.google.com/document/d/15ijz94dXJ-YAZLi9iZ_RaBwrZ4KtYeCy08goGBwnbCU/edit
         */
        getSensorData: function (sensorID) {
            return this.$axios.get(this.baseUrl + "?show=" + sensorID);
        }
    }
});