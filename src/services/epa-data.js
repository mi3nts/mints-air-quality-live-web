import Vue from "vue";
/**
 * Data service which provides data from Airnow API to application.
 * End point must support CORS.
 *
 * Original by Robert Mundinger
 * Copied and edited by Jonah Duncan for EPA data
 */
export default new Vue({
    data: function () {
        return {
            baseUrl: "https://www.airnowapi.org/aq/data",
            bboxRecent: "BBOX=-97.754269,31.802118,-95.966931,33.589456&dataType=C&format=application/json&verbose=1&nowcastonly=1&includerawconcentrations=0&API_KEY=743E8D00-0FD4-4B80-A52E-356DE6E4266C"
        }
    },
    methods: {
        /** 
         * EPA documentation 
         * https://docs.airnowapi.org/Data/docs
         * epaType can be : PM25,O3
         * */
        getLatestCityData: function (epaType) {
            return this.$axios.get("https://cors-anywhere.herokuapp.com/" + this.baseUrl + "/?parameters=" + epaType + "&" + this.bboxRecent);
        },
        getHistoricalData: function (startDate, endDate) {
            return this.$axios.get(this.baseUrl + "/?startDate=" + startDate + "&endDate=" + endDate + "&parameters=" + this.bboxRecent);
        }
    }
});