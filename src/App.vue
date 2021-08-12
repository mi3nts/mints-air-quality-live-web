<template>
  <v-app>
    <v-app-bar app dark color="primary" class="align-center">
      <img class="mr-2" height="50px" @click="goHome()" src="/img/logo_white.png" />
      <v-toolbar-title class="display-1 mr-10" @click="goHome()">
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
      {
        name: "Humidity",
        id: 2,
        dataType: "humidity",
        select: false,
      },
      {
        name: "Pressure",
        id: 3,
        dataType: "pressure",
        select: false,
      },
      {
        name: "Temperature",
        id: 4,
        dataType: "temperature",
        select: false,
      },
      {
        name: "H2O",
        id: 5,
        dataType: "H2O",
        select: false,
      },
      {
        name: "CO2",
        id: 6,
        dataType: "CO2",
        select: false,
      },
      {
          name: "NO2",
          id: 7,
          dataType: "NO2",
          select: false,
      },
      {
          name: "NO",
          id: 8,
          dataType: "NO",
          select: false,
      },
      {
          name: "NOX",
          id: 9,
          dataType: "NOX",
          select: false,
      },
      {
          name: "Ozone",
          id: 10,
          dataType: "Ozone",
          select: false,
      }

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
    dashboartBtnVisible: true, //keeps track of when the "Go To Dashboard" button is dashboartBtnVisible
    H2Ostore: null,
    CO2store: null,
    NO2store: null,
    NOstore: null,
    NOXstore: null,
    PM_BC_timestampStore: null,
    PM2_5store: null,
    BCstore: null,
    OzoneStore: null,
    aPayload: null, 
    latA1: null,
    latA2: null,
    latA3: null,
    latC1: null,
    latC2: null,
    latC3: null,
    longA1: null,
    longA2: null,
    longA3: null,
    longC1: null,
    longC2: null,
    longC3: null,
    avglat: null,
    avglong: null,
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
    "001e0610c2e7/LICOR"(payload) {
        if (payload != null) {
            console.log(payload)
            try { //has CO2 and H2O values
                if (JSON.parse(payload.toString())) {
                    payload = JSON.parse(payload.toString())
                    console.log("CO2 - " + payload.CO2 + ", H20 - " + payload.H20)

                    // Setting the values here will trigger handlers under 'watch' to update the charts
                    this.H2Ostore = payload.H2O;
                    this.CO2store = payload.CO2;   
                }
            } catch (error) {
                console.log("Error occured reading from 001e0610c2e7/LICOR:\n" + error.toString())
            }
        }
    },

    "001e0610c2e7/2B-BC"(payload) {
        if (payload != null) {
            try {
                if (JSON.parse(payload.toString())) {
                    payload = JSON.parse(payload.toString());
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

                    // Report negative PM and BC values for charts
                    if (payload.PM < 0 || payload.BC < 0) {
                    console.log(
                        "Negative value(s): PM = " + payload.PM + ", BC = " + payload.BC
                    );
                    } else {
                    console.log(
                        "New incoming data: PM = " + payload.PM + ", BC = " + payload.BC
                    );
                    }

                    // Setting the values here will trigger handlers under 'watch' to update the charts
                    this.PM_BC_timestampStore = payload.timestamp
                    this.PM2_5store = payload.PM
                    this.BCstore = payload.BC
                }
            } catch (error) {
                console.log("Error occured reading from 001e0610c2e7/2B-BC:\n" + error.toString())
            }
        }
    },

    "001e0610c2e7/2B-NOX"(payload) {
      if (payload != null) {
        try {
          if (JSON.parse(payload.toString())) {
            payload = JSON.parse(payload.toString());     
            console.log("NO2 - " + payload.NO2 + ", NOX - " + payload.NOX + ", NO - " + payload.NO)

            // Setting the values here will trigger handlers under 'watch' to update the charts
            this.NO2store = payload.NO2;
            this.NOXstore = payload.NOX;
            this.NOstore = payload.NO;
          }
        } catch (error) {
            console.log("Error occured reading from 001e0610c2e7/2B-NOX:\n" + error.toString())
        }
      }
    },

    /**
     * Doesn't seem to be any useful data here
     */
    // "001e0610c2e7/NP2"(payload) {
    //   if (payload != null) {
    //     try {
    //       if (JSON.parse(payload.toString())) {   
    //         console.log("NP2 - " + payload.toString());  
    //         payload = JSON.parse(payload.toString())     
    //       }
    //     } catch (error) {
    //       alert(error, "=>", payload.toString());
    //       // handle NaN errors
    //       payload = JSON.parse(payload.toString().replace(/NaN/g, '"NaN"'));
    //     }
    //   }
    // },

    "001e0610c2e7/2B-O3"(payload) {
      if (payload != null) {
        try {
          if (JSON.parse(payload.toString())) {
            payload = JSON.parse(payload.toString())
            console.log("Ozone - " + payload.ozone);    

            // Setting the values here will trigger handlers under 'watch' to update the charts
            this.OzoneStore = payload.ozone;
          }
        } catch (error) {
          console.log("Error occured reading from 001e0610c2e7/2B-O3:\n" + error.toString())
        }
      }
    },

    /**
     * The most accurate being used right now
     */
    "001e0636e527/GPGGA"(payload) {
      if (payload != null) {
        try {
          if (JSON.parse(payload.toString())) {
            // Uncomment to get full information about the GPS payload
            //console.log(payload.toString())

            payload = JSON.parse(payload.toString());
            //turn to float for calculation           
            // this.latA1 = parseFloat(payload.latitude);
            // this.longA1 = parseFloat(payload.longitude);
                       
            console.log("GPGGA - " + payload.latitude + ", " + payload.longitude)
            var localLatitude = parseFloat(payload.latitude);
            var localLongitude = parseFloat(payload.longitude);
            
            // Coordinate conversion formula (raw data, format unknown, to lat/long)
            payload.latitudeCoordinate = Math.floor(localLatitude/100) + (localLatitude - 100*(Math.floor(localLatitude/100)))/60;
            if(payload.latDirection == "S") {
              payload.latitudeCoordinate = -1*payload.latitudeCoordinate;
            }

            payload.longitudeCoordinate = Math.floor(localLongitude/100) + (localLongitude - 100*(Math.floor(localLongitude/100)))/60;
            if(payload.lonDirection == "W") {
              payload.longitudeCoordinate = -1*payload.longitudeCoordinate;
            }

            // update array for latitude and longitude
            this.$store.commit("addPointPath", {
              pmThresh: this.$store.state.prevPayload
                ? this.$store.state.prevPayload
                : 0,
              payload: payload,
            });

            this.$store.commit("increaseMapTrigger");
          }
        } catch (error) {
          alert(error, "=>", payload.toString());
          // handle NaN errors
          payload = JSON.parse(payload.toString().replace(/NaN/g, '"NaN"'));
        }
      }
    },

    /*
        Below are five other GPS sensors
        The last one's event handler (on reception handling) will manage averaging 
          all of the other values to get a more accurate position
    */
    /**
     * Also considering checking for gaps in time where no GPS data is received.
     * If there's a period of time without data, it could plot a line straight
     * across from the previous point.
     */
    // "001e0610c2e7/GPSGPGGA2"(payload) {
    //   if (payload != null) {
    //     try {
    //       console.log("GPSA2 - " + payload.toString())
    //       if (JSON.parse(payload.toString())) {
    //         payload = JSON.parse(payload.toString());
    //         //turn to float for calculation
    //         this.latA2 = parseFloat(payload.latitudeCoordinate);
    //         this.longA2 = parseFloat(payload.longitudeCoordinate);
    //       }
    //     } catch (error) {
    //       alert(error, "=>", payload.toString());
    //       // handle NaN errors
    //       payload = JSON.parse(payload.toString().replace(/NaN/g, '"NaN"'));
    //     }
    //   }
    // },

    // "001e0610c2e7/GPSGPGGA3"(payload) {
    //   if (payload != null) {
    //     console.log("GPSA3 - " + payload.toString())
    //     try {
    //       if (JSON.parse(payload.toString())) {
    //         payload = JSON.parse(payload.toString());
    //         //turn to float for calculation
    //         this.latA3 = parseFloat(payload.latitudeCoordinate);
    //         this.longA3 = parseFloat(payload.longitudeCoordinate);
    //       }
    //     } catch (error) {
    //       alert(error, "=>", payload.toString());
    //       // handle NaN errors
    //       payload = JSON.parse(payload.toString().replace(/NaN/g, '"NaN"'));
    //     }
    //   }
    // },

    // "001e0610c2e7/GPSGPRMC1"(payload) {
    //   if (payload != null) {
    //     try {
    //       console.log("GPSC1 - " + payload.toString())
    //       if (JSON.parse(payload.toString())) {
    //         payload = JSON.parse(payload.toString());
    //         //turn to float for calculation
    //         this.latC1 = parseFloat(payload.latitudeCoordinate);
    //         this.longC1 = parseFloat(payload.longitudeCoordinate);
    //       }
    //     } catch (error) {
    //       alert(error, "=>", payload.toString());
    //       // handle NaN errors
    //       payload = JSON.parse(payload.toString().replace(/NaN/g, '"NaN"'));
    //     }
    //   }
    // },

    // "001e0610c2e7/GPSGPRMC2"(payload) {
    //   if (payload != null) {
    //     console.log("GPSC2 - " + payload.toString())
    //     try {
    //       if (JSON.parse(payload.toString())) {
    //         payload = JSON.parse(payload.toString());
    //         //turn to float for calculation
    //         this.latC2 = parseFloat(payload.latitudeCoordinate);
    //         this.longC2 = parseFloat(payload.longitudeCoordinate);
    //       }
    //     } catch (error) {
    //       alert(error, "=>", payload.toString());
    //       // handle NaN errors
    //       payload = JSON.parse(payload.toString().replace(/NaN/g, '"NaN"'));
    //     }
    //   }
    // },

    // "001e0610c2e7/GPSGPRMC3"(payload) {
    //   if (payload != null) {
    //     console.log("GPSC3 - " + payload.toString())
    //     try {
    //       if (JSON.parse(payload.toString())) {
    //         payload = JSON.parse(payload.toString());

    //         //turn to float for calculation
    //         this.latC3 = parseFloat(payload.latitudeCoordinate);
    //         this.longC3 = parseFloat(payload.longitudeCoordinate);           

    //         //avoids initial null values because not all the coordinate values are properly stored yet, thus use GPSGPRMC3 position as the default value
    //         if((this.latA1 == null)||(this.latA2== null)||(this.latA3 == null)||(this.latC1==null)||(this.latC2==null)||(this.latC3==null)){
    //           //default position
    //           this.avglat = parseFloat(payload.latitudeCoordinate);
    //           this.avglong = parseFloat(payload.longitudeCoordinate);
    //         } else {
    //           //average position
    //           this.avglong = (this.longA1 + this.longA2 + this.longA3 + this.longC1 + this.longC2 + this.longC3)/6;
    //           this.avglat = (this.latA1 + this.latA2 + this.latA3 + this.latC1 + this.latC2 + this.latC3)/6;

    //         }
            
    //         //applies the average values to be sent to place the car icon
    //         payload.latitudeCoordinate = this.avglat;
    //         payload.longitudeCoordinate = this.avglong;

    //         // update array for latitude and longitude
    //         this.$store.commit("addPointPath", {
    //           pmThresh: this.$store.state.prevPayload
    //             ? this.$store.state.prevPayload
    //             : 0,
    //           payload: payload,
    //         });

    //         this.$store.commit("increaseMapTrigger");
    //       }
    //     } catch (error) {
    //       alert(error, "=>", payload.toString());
    //       // handle NaN errors
    //       payload = JSON.parse(payload.toString().replace(/NaN/g, '"NaN"'));
    //     }
    //   }
    // },
  },

  // Whenever variables from "data:" are changed and there is a handler here for that variable,
  //   the functions here will run
  watch: {
      'NO2store': function() {
          this.addToChart('NO2', Date.now(), this.NO2store);
      },
      'NOstore': function() {
          this.addToChart('NO', Date.now(), this.NOstore);
      },
      'NOXstore': function() {
          this.addToChart('NOX', Date.now(), this.NOXstore);
      },
      'H20store': function() {
          this.addToChart('H20', Date.now(), this.H20store);
      },
      'CO2store': function() {
          this.addToChart('CO2', Date.now(), this.CO2store);
      },
      'PM2_5store': function() {
          this.addToChart('PM', this.PM_BC_timestampStore, this.PM2_5store);
      },
      'BCstore': function() {
          this.addToChart('BC', this.PM_BC_timestampStore, this.BCstore);
      },
      'OzoneStore': function() {
          this.addToChart('Ozone', Date.now(), this.OzoneStore);
      }
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
     * Add data to the respective dashboard charts by type.
     * 
     * Type must match an existing "selected" element in the data store
     */
    addToChart: function (type, timestamp, data) {
        for(var i = 0; i < this.charts.length; i++) {
            if(type == this.charts[i].dataType) {
                this.$store.commit("pushValue", {
                    name: this.charts[i].dataType,
                    value: [timestamp, data],
                })
                
                // if the number of points in the chart exceeds 50, shift out the oldest point
                if (this.$store.getters.getChart(this.charts[i].dataType).length > 50) {
                    this.$store.commit("shiftPoints", this.charts[i].dataType);
                }
                break;
            }
        }
        this.$store.state.triggerCharts++;
    }
  },
};
</script>

<style>
/* hacky way of getting the color of the labels on the checkboxes to be black */
.black-label label {
  color: rgba(0, 0, 0) !important;
}
</style>
