import Vue from "vue";
import VueMqtt from "vue-mqtt";

var userID = "Mints" + parseInt(Math.random() * 100000);
var options = {
    clientId: userID,
    username: process.env.VUE_APP_USERNAME,
    password: process.env.VUE_APP_PASSWORD,
};
Vue.use(VueMqtt, 'mqtts://mqtt.circ.utdallas.edu:8083', options);

export default new Vue({
    data: () => ({
        // sensors: [],
        location: {},
        pm1: {},
        pm2_5: {},
        pm10: {},
    }),
    created: function () {
        console.log(this.$mqtt.subscribe('#'));
    },
    mqtt: {
        '+/calibrated'(payload) {
            if (payload != null) {
                console.log("incoming data");

                try {
                    if (JSON.parse(payload.toString())) {
                        payload = JSON.parse(payload.toString());
                    }
                } catch (error) {
                    // this fixes the NaN issue
                    // make string parsable
                    payload = JSON.parse(payload.toString().replace(/NaN/g, "\"NaN\""))
                }

                console.log(payload);

                // check for NaN latitude and longitude values
                // replace invalid values with previously stored latitude/longitude values
                if (isNaN(payload.latitude) || isNaN(payload.longitude)) {
                    // check for stored values
                    if (this.latitudeCache[payload.sensor_id] && this.longitudeCache[payload.sensor_id]) {
                        payload.latitude = this.latitudeCache[payload.sensor_id];
                        payload.longitude = this.longitudeCache[payload.sensor_id];
                    }
                } else {
                    // makes sure the data exists before hand latitude
                    if (this.sensors[this.sensors.findIndex(obj => { return obj.data.sensor_id === payload.sensor_id })].data.latitude) {
                        this.latitudeCache[payload.sensor_id] = this.sensors[this.sensors.findIndex(obj => { return obj.data.sensor_id === payload.sensor_id })].data.latitude;
                    }
                    else {
                        this.latitudeCache[payload.sensor_id] = this.sensors[this.sensors.findIndex(obj => { return obj.data.sensor_id === payload.sensor_id })].location.latitude;
                    }
                    // makes sure the data exists before hand longitude
                    if (this.sensors[this.sensors.findIndex(obj => { return obj.data.sensor_id === payload.sensor_id })].data.longitude) {
                        this.longitudeCache[payload.sensor_id] = this.sensors[this.sensors.findIndex(obj => { return obj.data.sensor_id === payload.sensor_id })].data.longitude;
                    }
                    else {
                        this.longitudeCache[payload.sensor_id] = this.sensors[this.sensors.findIndex(obj => { return obj.data.sensor_id === payload.sensor_id })].location.longitude;
                    }
                }

                // update or put values into the sensors array to cache last payload
                if (this.$set(this.sensors, this.sensors[this.sensors.findIndex(obj => { return obj.data.sensor_id === payload.sensor_id })].data, payload)) {
                    console.log(this.sensors);
                }
            }
        }
    },
    methods: {
        log: function () {
            console.log("temp")
        }
    }
})