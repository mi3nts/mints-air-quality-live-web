import DashboardChart from "@/components/dashboard-chart";

/**
 * Dashboard page used to display live updating charts
 */
export default {
    name: "dashboard",
    components: {
        DashboardChart
    },
    mounted() {
        var openBtn = document.querySelector(".openSideNav");
        openBtn.addEventListener("click", () => {
            this.showNav();
        });

        var closeBtn = document.querySelector(".closeBtn");
        closeBtn.addEventListener("click", () => {
            this.hideNav();
        });

        var applyBtn = document.getElementById("apply");
        applyBtn.addEventListener("click", () => {
            this.check1();
            this.check2();
            this.check3();
            this.hideNav();
        });
    },
    methods: {
        showNav: function() {
            document.getElementById("mysidenav").style.width = "20%";
        },
        hideNav: function() {
            document.getElementById("mysidenav").style.width = "0";
        },
        check1: function() {
            if (document.getElementById("check1").checked == true) {
                document.getElementById("test1").style.display = "block";
            } else {
                document.getElementById("test1").style.display = "none";
            }
        },
        check2: function() {
            if (document.getElementById("check2").checked == true) {
                document.getElementById("test2").style.display = "block";
            } else {
                document.getElementById("test2").style.display = "none";
            }
        },
        check3: function() {
            if (document.getElementById("check3").checked == true) {
                document.getElementById("test3").style.display = "block";
            } else {
                document.getElementById("test3").style.display = "none";
            }
        }
    }
}