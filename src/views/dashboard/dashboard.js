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
            charts: [],
            // used for working with charts showing
            sidebarOpen: true,

            // used for drag and drop reordering
            dragging: false,
            enabled: true,
        }
    },
    mounted: function () {
        // retrieve array for chart and data type information from Vuex
        this.charts = this.$store.state.selected;

        // if the page is less than 600px wide, the sidebar starts off hidden
        if ($(window).width() < 600) {
            this.slide();
        }
    },
    beforeDestroy: function () {
        this.$store.commit('storeSelected', this.charts);
    },
    methods: {
        /**
         * Handle sidebar related animations
         * TODO: Make the sidebar work with smaller screens, where the sidebar tab currently intrudes into the charts
         */
        slide: function () {
            var hidden = $('.sideBar');
            var chart = $('.charts');
            var close_icon = $('#icon1');
            var open_icon = $('#icon2');
            // start with sidebar hidden
            if (hidden.hasClass('visible')) {// hide sidebar
                close_icon.css("display", "none");
                open_icon.css("display", "block");
                chart.animate({ "padding-left": "0px" }, "slow", () => {
                    // set new sidebar status and trigger chart resizing
                    this.sidebarOpen = !this.sidebarOpen;
                })
                hidden.animate({ "left": "-270px" }, "slow").removeClass("visible");
            } else {// show sidebar
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
