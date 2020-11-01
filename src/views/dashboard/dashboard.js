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
            sidebarOpen: true,
        }
    },
    mounted: function() {
        // If the page is less than 600px wide, the sidebar starts off hidden
        if ($(window).width() < 600) {
            this.slide();
        }
    },
    methods: {
        slide: function () {
            var hidden = $('.sideBar');
            var chart = $('.charts');
            if (hidden.hasClass('visible')) {
                chart.animate({ "width": "100%" }, "slow", () => {
                    this.sidebarOpen = !this.sidebarOpen;
                })
                hidden.animate({ "left": "-270px" }, "slow").removeClass("visible");
            } else {
                chart.animate({ "width": "70%" }, "slow", () => {
                    this.sidebarOpen = !this.sidebarOpen;
                });
                hidden.animate({ "left": "0px" }, "slow").addClass('visible');
            }
        }
    }
}
