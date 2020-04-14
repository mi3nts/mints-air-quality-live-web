import Vue from "vue";
/**
 * Data service which provides data from 3rd party API to application.
 * End point must support CORS.
 */
export default new Vue({
	data: function () {
		return {
			baseUrl: "https://api.openaq.org/v1"
		}
	},
	methods: {
		getLatest: function () {
			return this.$axios.get(this.baseUrl + "/latest");
		},
		getHistorical: function () {
			return this.$axios.get(this.baseUrl + "/mesaurements/");
		}
	}
});