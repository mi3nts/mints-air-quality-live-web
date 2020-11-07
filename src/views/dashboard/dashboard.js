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
            testVal: (Math.random() * 10) + 1,
            timer: null,
            data: null,
        }
    },
    mounted: function () {
        // If the page is less than 600px wide, the sidebar starts off hidden
        if ($(window).width() < 600) {
            this.slide();
        }
        this.chartNames = this.$store.state.selected;

        // subscribe to MQTT stream
        console.log(this.$mqtt.subscribe("001e0610c2e7/2B-BC"));

        // begin data simulation
        // comment out when using MQTT
        // this.timer = setInterval(this.simulatePayload, 1000);
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
                this.data = this.removeMilliseconds(payload);
            }
        }
    },
    beforeDestroy: function () {
        this.$store.commit('storeSelected', this.chartNames);
    },
    methods: {
        /**
         * Simulate MQTT payload for testing purposes.
         */
        simulatePayload: function () {
            // used to add an extra 0 in front of single digit values for echarts
            // ex: 1:27:2 is changed to 01:27:02
            function addZero(i) {
                if (i < 10) {
                    i = "0" + i;
                }
                return i;
            }

            // generate a increment to add/subtract from testVal
            var rand = (Math.random() * 8) - 4.5;
            this.testVal += rand;

            // add upper and lower bounds
            // prevent negative values
            if (this.testVal < 0 || this.testVal > 100) {
                this.testVal += -2 * rand;
            }

            var d = new Date();
            var year = d.getFullYear();
            var month = addZero(d.getMonth() + 1);
            var date = addZero(d.getDate());
            var hour = addZero(d.getHours());
            var min = addZero(d.getMinutes());
            var sec = addZero(d.getSeconds());
            var time = year + "-" + month + "-" + date + " " + hour + ":" + min + ":" + sec;

            var payload = {
                dateTime: time,
                PM: this.testVal + (Math.random() * (sec % 5)),
                BC: this.testVal + (Math.random() * (sec % 9)),
                humidity: this.testVal + (Math.random() * 7),
                pressure: this.testVal + (Math.random() * 7),
                temperature: this.testVal + (Math.random() * 7),
            }    
            this.data = payload;
        },
        /**
         * Remove the milliseconds from the timestamp for ECharts
         */
        removeMilliseconds: function (payload) {
            var timestamp = payload.dateTime.split(".");
            payload.dateTime = timestamp[0];
            return payload;
        },
        /**
         * Handle sidebar related animations
         */
        slide: function () {
            var hidden = $('.sideBar');
            var chart = $('.charts');
            var close_icon = $('#icon1');
            var open_icon = $('#icon2');

            if (hidden.hasClass('visible')) {
                close_icon.css("display", "none");
                open_icon.css("display", "block");
                chart.animate({ "padding-left": "0px" }, "slow", () => {
                    this.sidebarOpen = !this.sidebarOpen;
                })
                hidden.animate({ "left": "-270px" }, "slow").removeClass("visible");

            } else {
                close_icon.css("display", "block");
                open_icon.css("display", "none");
                chart.animate({ "padding-left": "320px" }, "slow", () => {
                    this.sidebarOpen = !this.sidebarOpen;
                });
                hidden.animate({ "left": "0px" }, "slow").addClass('visible');
            }
        },
    }
}
