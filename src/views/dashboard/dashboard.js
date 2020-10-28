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
            chartnames: ["PM2.5", "PM1", "PM10", "Dewpoint", "Humidity", "Pressure", "Temperature"],
        }
    },
    watch: {
        'pm2_5': function (newValue) {
            if (newValue) {
                $("#test1").css("display", "block");
            }
            else {
                $("#test1").css("display", "none");
            }
        },
        'pm1': function (newValue) {
            if (newValue) {
                $("#test2").css("display", "block");
            }
            else {
                $("#test2").css("display", "none");
            }
        },
        'pm10': function (newValue) {
            if (newValue) {
                $("#test3").css("display", "block");
            }
            else {
                $("#test3").css("display", "none");
            }
        },
        'dewpoint': function (newValue) {
            if (newValue) {
                $("#test4").css("display", "block");
            }
            else {
                $("#test4").css("display", "none");
            }
        },
        'humidity': function (newValue) {
            if (newValue) {
                $("#test5").css("display", "block");
            }
            else {
                $("#test5").css("display", "none");
            }
        },
        'pressure': function (newValue) {
            if (newValue) {
                $("#test6").css("display", "block");
            }
            else {
                $("#test6").css("display", "none");
            }
        },
        'temperature': function (newValue) {
            if (newValue) {
                $("#test7").css("display", "block");
            }
            else {
                $("#test7").css("display", "none");
            }
        },
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