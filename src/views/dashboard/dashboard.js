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
            dragging: false,
            enabled: true,
        }
    },
    mounted: function () {
        // If the page is less than 600px wide, the sidebar starts off hidden
        if ($(window).width() < 600) {
            this.slide();
        }
        this.chartNames = this.$store.state.selected;
    },
    beforeDestroy: function () {
        this.$store.commit('storeSelected', this.chartNames);
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
        }
    }
}
