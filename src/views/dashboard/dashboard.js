import DashboardChart from "@/components/dashboard-chart";

/**
 * Dashboard page used to display live updating charts
 */
export default {
    name: "dashboard",
    components: {
        DashboardChart
    },
    // TODO: Finish graph select and functionality for dashboard page below
    // data: () => ({
    //     options: ["PM 2.5", "PM 1"],
    //     toDisplay: [],
    // }),
    // watch: {
    //     "toDisplay": function () {
    //         this.addChart();
    //     }
    // },
    // methods: {
    //     addChart: function () {
    //         console.log(this.toDisplay);
    //     }
    // }
}
