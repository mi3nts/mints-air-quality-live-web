import DashboardChart from "@/components/dashboard-chart";

/**
 * Dashboard page used to display live updating charts
 */
export default {
    name: "dashboard",
    components: {
        DashboardChart
    },
    data: function () {
        return {
            chartNames: [
                { name: "PM 2.5", id: 0, dataType: "pm2_5" },
                { name: "PM 1", id: 1, dataType: "pm1" },
                { name: "PM 10", id: 2, dataType: "pm10" },
                { name: "Dewpoint", id: 3, dataType: "dewpoint" },
                { name: "Humidity", id: 4, dataType: "humidity" },
                { name: "Pressure", id: 5, dataType: "pressure" },
                { name: "Temperature", id: 6, dataType: "temperature" }
            ],
            selected: [],
            sidebarOpen: true,
        }
    },
    mounted: function () {
        // If the page is less than 600px wide, the sidebar starts off hidden
        if ($(window).width() < 600) {
            this.slide();
        }
        this.selected = this.$store.state.selected;
    },
    beforeDestroy: function () {
        this.$store.commit('storeSelected', this.selected);
    },
    methods: {
        //filtering to find whats select
        filterSelection: function (dataType) {
            return this.selected.find((x) => x.dataType == dataType);
        },
        //placeholder function to get chartNames object to load the charts
        getChartNames: function () {

        },
        slide: function () {
            var hidden = $('.sideBar');
            var chart = $('.charts');
            var close_icon = $('#icon1');
            var open_icon = $('#icon2');
            if (hidden.hasClass('visible')) {
                close_icon.css("display", "none");
                open_icon.css("display", "block");
                chart.animate({ "width": "100%" }, "slow", () => {
                    this.sidebarOpen = !this.sidebarOpen;
                })
                hidden.animate({ "left": "-270px" }, "slow").removeClass("visible");
                
            } else {
                close_icon.css("display", "block");
                open_icon.css("display", "none");
                chart.animate({ "width": "70%" }, "slow", () => {
                    this.sidebarOpen = !this.sidebarOpen;
                });
                hidden.animate({ "left": "0px" }, "slow").addClass('visible');
            }
        }
    }
}
