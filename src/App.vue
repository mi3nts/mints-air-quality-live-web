<template>
  <v-app>
    <v-app-bar app dark color="primary" class="align-center">
      <img class="mr-2" height="50px" src="/img/logo_white.png" />
      <v-toolbar-title class="display-1 mr-10" @click="home()">
        <span>SharedAirDFW</span>
      </v-toolbar-title>
      <!-- <v-btn x-large depressed exact text :to="{name : 'home'}">
        <span class="mr-2">Map</span>
      </v-btn>-->
      <v-dialog v-model="showPM">
        <particulate-matter @close="showPM = false"></particulate-matter>
      </v-dialog>
      <v-spacer></v-spacer>
      <!-- split view button -->
      <v-btn x-large exact text @click="goToSplitView()">{{ splitviewNav }}</v-btn>
      <!-- -->
      <v-btn x-large exact text @click="flipPage()" v-if="dashboartBtnVisible" >{{ dashboardNav }}</v-btn>
      <v-btn x-large depressed exact text @click="showPM = true">
        <span class="mr-2 d-none d-lg-flex d-xl-none">Particulate Matter?</span>
        <v-icon class="d-flex">help</v-icon>
      </v-btn>
      <v-btn x-large exact text @click="showAbout = true">
        <span class="mr-2">About</span>
      </v-btn>
      <v-dialog v-model="showAbout">
        <about @close="showAbout = false"></about>
      </v-dialog>
    </v-app-bar>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<style>
.nvd3 .nv-axis line {
  stroke: black;
  opacity: 0.6;
}
.v-overlay {
  z-index: 9999 !important;
}
.v-dialog__content {
  z-index: 10000 !important;
}
.leaflet-control-velocity.leaflet-control {
  margin-top: 10px !important;
  margin-right: 10px !important;
  font-size: 14px;
}
header .v-btn {
  text-transform: none;
}
.pm25 {
  font-weight: bold;
  font-size: 16px;
}
@media only screen and (max-width: 600px) {
  .leaflet-control-velocity {
    display: none;
  }
}
</style>

<script>
import About from "@/components/about";
import ParticulateMatter from "@/components/particulate-matter";
import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    dashChartVal: {}, // temporary cache for chart data
    triggerCharts: 0, // updated to trigger real time updates while on dashboard
    prevPayload: [], // stores the last valid payload recieved, used for mapping
    triggerMap: 0,
    // array used to select data types and charts
    selected: [
      {
        name: "PM 2.5",
        id: 0,
        dataType: "PM",
        select: false,
      },
      {
        name: "Black Carbon",
        id: 1,
        dataType: "BC",
        select: false,
      },
      // {
      //   name: "Extinction 405nm",
      //   id: null,
      //   dataType: "Extinction-405nm",
      //   select: false,
      // },
      // {
      //   name: "Extinction 880nm",
      //   id: null,
      //   dataType: "Extinction-880nm",
      //   select: false,
      // },
      {
        name: "Current 405nm",
        id: 2,
        dataType: "current-405nm",
        select: false,
      },
      {
        name: "Flow Temperature",
        id: 3,
        dataType: "flow-temperature",
        select: false,
      },
      {
        name: "Humidity",
        id: 4,
        dataType: "humidity",
        select: false,
      },
      {
        name: "Pressure",
        id: 5,
        dataType: "pressure",
        select: false,
      },
      {
        name: "Temperature",
        id: 6,
        dataType: "temperature",
        select: false,
      },
      // {
      //   name: "Voltage 405nm",
      //   id: null,
      //   dataType: "voltage-405nm",
      //   select: false,
      // },
      // {
      //   name: "Voltage 880nm",
      //   id: null,
      //   dataType: "voltage-880nm",
      //   select: false,
      // },
    ],

    carPath: [],
  },
  mutations: {
    increaseMapTrigger: function (state) {
      state.triggerMap++;
    },
    pushValue: function (state, data) {
      if (!state.dashChartVal[data.name]) {
        state.dashChartVal[data.name] = [];
      }

      state.dashChartVal[data.name].push({
        name: data.name,
        value: data.value,
      });
    },
    shiftPoints: function (state, dataType) {
      store.state.dashChartVal[dataType].shift();
    },
    storeSelected: function (state, data) {
      state.selected = data;
    },

    // calcAvgGPSData: function (state, data) {
    //   store.state.sumLat = store.state.sensorLatData.reduce((a, b) => a + b, 0);
    //   store.state.avgLat = store.state.sumLat / (store.state.sensorLatData.lenght - 1);

    //   store.state.sumLong = store.state.sensorLongData.reduce((a, b) => a+ b, 0);
    //   store.state.avgLong = store.state.sumLong / (storestate.sensorLongData.lenght - 1);

    //   console.log("avg Lat: ", store.state.avgLat.toFixed(8), "Ave LNG: ", store.state.avgLong.toFixed(8));
    

    //   this.$store.commit("addPointPath", {
    //     pmThresh: this.$store. state.prevPayload ? this.$store.state.prevPayload : 0, 
    //     payload: data});
      
    // },

    addPointPath: function (state, data) {
      state.carPath.push({
        pmThresh: data.pmThresh,
        coord: [
          data.payload.latitudeCoordinate,
          data.payload.longitudeCoordinate,
        ],
      });
    },
  },
  getters: {
    getChart: (state) => (name) => {
      if (!state.dashChartVal[name]) {
        state.dashChartVal[name] = [];
      }
      return state.dashChartVal[name];
    },
    getPreviousTwoValues: (state) => (name) => {
      if (!state.dashChartVal[name]) {
        return null;
      }

      let chart = state.dashChartVal[name];
      if (chart.length == 0) {
        return [null, null];
      } else if (chart.length == 1) {
        return [parseFloat(chart[chart.length - 1].value[1]), null];
      } else {
        return [
          parseFloat(chart[chart.length - 1].value[1]),
          parseFloat(chart[chart.length - 2].value[1]),
        ];
      }
    },
  },
});

export default {
  name: "App",
  store,
  components: {
    About,
    ParticulateMatter,
  },
  data: () => ({
    showAbout: false,
    showPM: false,
    dashboardNav: null, // navigation between map and dashboard
    splitviewNav: "Split View",
    charts: [], // list of data types pulled from Vuex
    dashboartBtnVisible: true, //keeps track of when the "Go To Dashboard" button is dashboartBtnVisible
  }),
  created: function () {
    window["moment"] = this.$moment;
    if (this.$router.currentRoute.fullPath == "/dashboard") {
      this.dashboardNav = "Go to Map";
    } else {
      this.dashboardNav = "Go to Dashboard";
    }

    if (this.$router.currentRoute.fullPath == "/splitview"){
      this.dashboartBtnVisible = false;
      this.splitviewNav = "Exit Split View";
    }
  },
  mounted: function () {
    // retrieve array for chart and data type information from Vuex
    this.charts = this.$store.state.selected;

    // subscribe to the sensor topics
    console.log(this.$mqtt.subscribe("#"));
  },
  mqtt: {
    "001e0610c2e7/2B-BC"(payload) {
      if (payload != null) {
        try {
          if (JSON.parse(payload.toString())) {
            payload = JSON.parse(payload.toString());
          }
        } catch (error) {
          // handle NaN errors
          payload = JSON.parse(payload.toString().replace(/NaN/g, '"NaN"'));
        }

        // Remove the milliseconds from the timestamp for ECharts
        // ECharts seems to be unable to process timestamps with millisecond
        // values of greater than 3 decimal points of accuracy
        // Add UTC marker (Z) to timestamp
        // This allows it to be converted to local time more easily
        let timestamp = payload.dateTime.split(".");
        payload.dateTime = timestamp[0] + "Z";

        // discard negative PM values for car readout
        if (payload.PM >= 0) {
          this.$store.state.prevPayload = payload;
        }

        // discard negative PM and BC values for charts
        if (payload.PM < 0 || payload.BC < 0) {
          console.log(
            "Negative value(s): PM = " + payload.PM + ", BC = " + payload.BC
          );
        } else {
          console.log(
            "New incoming data: PM = " + payload.PM + ", BC = " + payload.BC
          );
          this.addChartValues(payload);
        }
      }
    },

    /**
     * Also considering checking for gaps in time where no GPS data is received.
     * If there's a period of time without data, it could plot a line straight
     * across from the previous point.
     */
    "001e0610c2e7/GPSGPGGA1"(payload) {
      if (payload != null) {
        try {
          if (JSON.parse(payload.toString())) {
            payload = JSON.parse(payload.toString());

            // update array for latitude and longitude
            this.$store.commit("addPointPath", {
              pmThresh: this.$store.state.prevPayload
                ? this.$store.state.prevPayload
                : 0,
              payload: payload,
            });
            console.log(
              "LAT:",
              payload.latitudeCoordinate.toFixed(8),
              ", LNG:",
              payload.longitudeCoordinate.toFixed(8)
            );
            this.$store.commit("increaseMapTrigger");
          }
        } catch (error) {
          alert(error, "=>", payload.toString());
          // handle NaN errors
          payload = JSON.parse(payload.toString().replace(/NaN/g, '"NaN"'));
        }
      }
    },
    "001e0610c2e7/GPSGPGGA2"(payload) {
      if (payload != null) {
        try {
          if (JSON.parse(payload.toString())) {
            payload = JSON.parse(payload.toString());

            // update array for latitude and longitude
            this.$store.commit("addPointPath", {
              pmThresh: this.$store.state.prevPayload
                ? this.$store.state.prevPayload
                : 0,
              payload: payload,
            });
            console.log(
              "LAT2:",
              payload.latitudeCoordinate.toFixed(8),
              ", LNG2:",
              payload.longitudeCoordinate.toFixed(8)
            );
            this.$store.commit("increaseMapTrigger");
          }
        } catch (error) {
          alert(error, "=>", payload.toString());
          // handle NaN errors
          payload = JSON.parse(payload.toString().replace(/NaN/g, '"NaN"'));
        }
      }
    },
  },
  methods: {
    flipPage: function () {
      if (this.dashboardNav == "Go to Dashboard") {
        this.$router.push({ path: "/dashboard" });
        this.dashboardNav = "Go to Map";
      } else {
        this.$router.push({ path: "/" });
        this.dashboardNav = "Go to Dashboard";
      }
    },
     //function to switch to splitview
    goToSplitView: function(){
        if (this.splitviewNav == "Split View"){
          this.$router.push({path: "/splitview"});
          this.splitviewNav = "Exit Split View";
          this.dashboartBtnVisible = false;
        }
        else {
          this.$router.push({path: "/"});
          this.splitviewNav = "Split View";
          this.dashboartBtnVisible = true;
          this.dashboardNav = "Go to Dashboard"
        }
    },
    
    goHome: function(){
       this.$router.push({ path: "/"});
        this.dashboardNav = "Go to Dashboard";
        this.splitviewNav = "Split View";
        this.dashboartBtnVisible = true;
    },
    /**
     * Add data to the arrays used by the charts.
     * Loop through every data type in the charts array and adds all values in one go.
     */
    addChartValues: function (data) {
      for (var i = 0; i < this.charts.length; i++) {
        this.$store.commit("pushValue", {
          name: this.charts[i].dataType,
          value: [data.dateTime, data[this.charts[i].dataType]],
        });

        // if the number of points in the chart exceeds 50, shift out the oldest point
        if (this.$store.getters.getChart(this.charts[i].dataType).length > 50) {
          this.$store.commit("shiftPoints", this.charts[i].dataType);
        }
      }
      this.$store.state.triggerCharts++;
    },
  },
};
</script>

<style>
/* hacky way of getting the color of the labels on the checkboxes to be black */
.black-label label {
  color: rgba(0, 0, 0) !important;
}
</style>
