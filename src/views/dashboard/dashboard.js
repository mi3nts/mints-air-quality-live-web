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
            if (hidden.hasClass('visible')) {
                hidden.animate({"left": "-180px"}, "slow").removeClass('visible');
            } else {
                hidden.animate({"left": "0px"}, "slow").addClass('visible');
            }
        }
    }
}
