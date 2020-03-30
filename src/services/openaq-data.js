import Vue from "vue";
/**
 * Data service which provides data from OpenAQ API to application.
 * End point must support CORS.
 */
export default new Vue({
    data: function () {
        return {
            baseUrl: "https://api.openaq.org/v1",
            city: "Dallas-Fort Worth-Arlington"
        }
    },
    methods: {
        /** 
         * See here about more fine tuning of data 
         * https://docs.openaq.org/#api-Latest-GetLatest 
         * */
        getLatestCityData: function () {
            return this.$axios.get(this.baseUrl + "/latest?city=" + this.city);
        },
    }
});