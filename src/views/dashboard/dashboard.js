import DashboardChart from "@/components/dashboard-chart";

/**
 * Dashboard page used to display live updating charts
 */
export default {
    name: "dashboard",
    components: {
        DashboardChart
    },
    data: function() {
        return {
            pm2_5: true,
            pm1: false,
            pm10: false,
            dewpoint: false,
            humidity: false,
            pressure: false,
            temperature: false,
            chartNames: ["PM2.5", "PM1", "PM10", "Dewpoint", "Humidity", "Pressure", "Temperature"],
        }
    },
    mounted: function() {
        // If the page is less than 600px wide, the sidebar starts off hidden
        if ($(window).width() < 600) {
            this.slide();
        }
    },
    methods: {
        slide() {
            var hidden = $('.sideBar');
            var chart = $('.charts');
            if (hidden.hasClass('visible')) {
                chart.animate({ "left": "150px", "width": "1100px" }, "slow")
                hidden.animate({ "left": "-280px" }, "slow").removeClass("visible");
            } else {
                chart.animate({ "left": "320px", "width": "1100px" }, "slow");
                hidden.animate({ "left": "0px" }, "slow").addClass('visible');
            }
        }
    }
}
