/**
 * TODO: If necessary, reconnect this to the rest of the code
 * 
 * This was originally written to simulate an MQTT data stream, specifically for the charts,
 * before there was a stable stream of actual MQTT data we could use. After a major refactor 
 * broke the simulation, the code was moved out to this file for storage. 
 * 
 * If you ever need some test data that you have full control over, it may be worth integrating
 * this back into the rest of the code. 
 */

import Vue from "vue";

export default new Vue ({
    data: () => ({
        testVal: 0,
    }),
    methods: {
        testFunction: function (str) {
            console.log(str);
        },

        /**
         * Simulate MQTT payload for testing purposes.
         * Will output data at the set interval.
         * 
         * variables (array) :
         * array containing all the data types that need to be generated
         * 
         * stepSize (positive num) : 
         * used to set the maximum possible step size between points.
         * 
         * upperCap (positive num) :
         * sets the maximum possible value to be displayed by the graph. 
         * 
         * randomByType (positive num) : 
         * controls if different data types will recieve different values.
         * if set to 0, all data types will display the same values.
         * if greater than 0, the size of the number determines the size of possible variation.
         * 
         * rangeTest (bool) :
         * if set to true, values will only ever increase until the upperCap is hit. 
         * this can be used when trying to test ranges or the upper extremes of the chart. 
         * 
         * boundsTest (bool) :
         * if set to true, negative values and values greater than upperCap will be permitted.
         * this can be used to test for errors past the limit
         * 
         * NOTE: With addition randomization for each date type turned on with randomByType, 
         * values may exceed upperCap. Possible positive step size may also exceed the limit
         * set by stepSize. This is because randomization between different data types is 
         * achieved by adding an additional random value with a maximum size of randomByType,
         * on top of the value already generated with stepSize and upperCap in mind.
         */
        simulatePayload: function (variables, stepSize = 8, upperCap = 120, randomByType = 0, rangeTest = false, boundsTest = false) {
            // used to add an extra 0 in front of single digit values for echarts
            // ex: 1:27:2 is changed to 01:27:02
            function addZero(i) {
                if (i < 10) {
                    i = "0" + i;
                }
                return i;
            }

            // add increment
            var rand = (Math.random() * stepSize);
            if (!rangeTest) {
                rand *= Math.round(Math.random()) ? 1 : -1;
            }
            this.testVal += rand;

            // check bounds
            if (!boundsTest) {
                if (this.testVal < 0 || this.testVal > upperCap) {
                    this.testVal += -2 * rand;
                }
            }
            
            // get current time in "YYYY-MM-DD HH:MM:SS" format
            var d = new Date();
            var year = d.getFullYear();
            var month = addZero(d.getMonth() + 1);
            var date = addZero(d.getDate());
            var hour = addZero(d.getHours());
            var min = addZero(d.getMinutes());
            var sec = addZero(d.getSeconds());
            var time = year + "-" + month + "-" + date + " " + hour + ":" + min + ":" + sec;

            // create payload
            // dynamically generate payload based on provided array
            var payload = { dateTime: time }; 
            for (var i = 0; i < variables.length; i++) {
                payload[variables[i].dataType] = randomByType ? this.testVal + (Math.random() * randomByType) : this.testVal;
            }
            console.log(payload);
        },
    }
})
        