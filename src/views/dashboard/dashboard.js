import DashboardChart from "@/components/dashboard-chart";
import draggable from "vuedraggable";
/**
 * Dashboard page used to display live updating charts
 */
export default {
    name: "dashboard",
    components: {
        DashboardChart,
        draggable,
    },
    data: function () {
        return {
            chartNames: [],
            sidebarOpen: true,

            // used for drag and drop reordering
            dragging: false,
            enabled: true,

            // values used for mqtt simulation for testing
            testVal: 0,
            timer: null,
            data: null,

            // selection between MQTT stream and simulated data
            simulatedData: false, 
            simulationInterval: 1500, // speed of simulation in milliseconds
        }
    },
    mounted: function () {
        // if the page is less than 600px wide, the sidebar starts off hidden
        if ($(window).width() < 600) {
            this.slide();
        }

        // retrieve array for chart and data type information from VueX
        this.chartNames = this.$store.state.selected;

        if (this.simulatedData) {
            this.timer = setInterval(this.simulatePayload, this.simulationInterval);
        } else {
            console.log(this.$mqtt.subscribe("001e0610c2e7/2B-BC"));
        }      
    },
    mqtt: {
        '001e0610c2e7/2B-BC'(payload) {
            if (payload != null) {
                try {
                    if (JSON.parse(payload.toString())) {
                        payload = JSON.parse(payload.toString());
                    }
                } catch (error) {
                    // handle NaN errors
                    payload = JSON.parse(payload.toString().replace(/NaN/g, "\"NaN\""))
                }

                // discard negative PM and BC values
                if (payload.PM < 0 || payload.BC < 0) {
                    console.log("Negative value(s) recieved: PM = " + payload.PM + ", BC = " + payload.BC);
                } else {
                    this.data = this.removeMilliseconds(payload);
                }
            }
        }
    },
    beforeDestroy: function () {
        this.$store.commit('storeSelected', this.chartNames);
    },
    methods: {
        /**
         * Simulate MQTT payload for testing purposes.
         * Will output data at the set interval.
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
        simulatePayload: function (stepSize = 8, upperCap = 120, randomByType = 0, rangeTest = false, boundsTest = false) {
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
            for (var i = 0; i < this.chartNames.length; i++) {
                payload[this.chartNames[i].dataType] = randomByType ? this.testVal + (Math.random() * randomByType) : this.testVal;
            }
            this.data = payload;
        },
        /**
         * Remove the milliseconds from the timestamp for ECharts
         * ECharts seems to be unable to process timestamps with millisecond
         * values of greater than 3 decimal points of accuracy 
         */
        removeMilliseconds: function (payload) {
            var timestamp = payload.dateTime.split(".");
            payload.dateTime = timestamp[0];
            return payload;
        },
        /**
         * Handle sidebar related animations
         * TODO: Make the sidebar work with smaller screens, where the sidebar tab currently intrudes into the charts
         */
        slide: function () {
            var hidden = $('.sideBar');
            var chart = $('.charts');
            var close_icon = $('#icon1');
            var open_icon = $('#icon2');

            if (hidden.hasClass('visible')) {
                // hide sidebar
                close_icon.css("display", "none");
                open_icon.css("display", "block");
                chart.animate({ "padding-left": "0px" }, "slow", () => {
                    // set new sidebar status and trigger chart resizing
                    this.sidebarOpen = !this.sidebarOpen;
                })
                hidden.animate({ "left": "-270px" }, "slow").removeClass("visible");
            } else {
                // show sidebar
                close_icon.css("display", "block");
                open_icon.css("display", "none");
                chart.animate({ "padding-left": "320px" }, "slow", () => {
                    // set new sidebar status and trigger chart resizing
                    this.sidebarOpen = !this.sidebarOpen;
                });
                hidden.animate({ "left": "0px" }, "slow").addClass('visible');
            }
        },
    }
}
