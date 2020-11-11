import Sensor from "@/components/sensor";
import sensorData from "../../services/sensor-data";
import purpleAirData from "../../services/purpleair-data";
import openAqData from "../../services/openaq-data";
import epaData from "../../services/epa-data";
import Vue from 'vue';
import vuetify from '../../plugins/vuetify';
import VueMqtt from 'vue-mqtt';
// import sensor from "../../components/sensor/sensor";


var userID = "Mints" + parseInt(Math.random() * 100000);
var options = {
    clientId: userID,
    username: process.env.VUE_APP_USERNAME,
    password: process.env.VUE_APP_PASSWORD,
};
Vue.use(VueMqtt, 'mqtts://mqtt.circ.utdallas.edu:8083', options);

/**
 * Main landing page with all map functionality
 */
export default {
    name: "home",
    components: {
        Sensor
    },
    data: function () {
        return {
            map: null,
            /** Currently clicked sensor is stored here */
            selectedSensor: null,
            /** Top right layer control */
            layerControl: L.control.layers([], []),
            /** All available layer instances */
            layers: {},
            wind: {
                data_time: null,
                updated_time: null
            },
            popupStatus: false, // stores the status of the popup, only tracks one
            sensorComponents: [],
            radarLayer: false,
            windLayer: false,
            sensorLayer: true,
            epaLayer: false,
            purpleAirLayer: false,
            openAQLayer: false,
            pollutionLayer: false,
            // startDate: null,
            // endDate: null,
            /** Popup controls */
            howToUse: false,
            epaType: "PM25",
            /** Currently selected PM type */
            pmType: "pm2_5",
            /** Default state of left side expansion panels */
            activePanel: 0,
            /** All available sensor instances  */
            sensors: [],
            sensorGroup: L.markerClusterGroup({
                disableClusteringAtZoom: 13
            }),
            openAQGroup: L.layerGroup(),
            purpleAirGroup: L.layerGroup(),
            epaGroup: L.layerGroup(),
            pollutionGroup: L.layerGroup(),

            path: null,
            lastReadPM: {},
            marker: null,
            focused: true,
        };
    },
    watch: {
        'pmType': function () {
            this.refreshIcons();
        },

        'openAQLayer': function (newValue) {
            if (newValue) {
                this.openAQGroup.addTo(this.map);
            } else {
                this.map.removeLayer(this.openAQGroup);
            }
        },
        'purpleAirLayer': function (newValue) {
            if (newValue) {
                this.purpleAirGroup.addTo(this.map);
            } else {
                this.map.removeLayer(this.purpleAirGroup);
            }
        },
        'pollutionLayer': function (newValue) {
            if (newValue) {
                this.pollutionGroup.addTo(this.map);
            } else {
                this.map.removeLayer(this.pollutionGroup);
            }
        },
        'epaLayer': function (newValue) {
            if (newValue) {
                this.epaGroup.addTo(this.map);
            } else {
                this.map.removeLayer(this.epaGroup);
            }
            this.openAQLayer = newValue;
        },
        'epaType': function () {
            if (this.epaLayer) {
                this.loadEPA(true);
                this.loadOpenAQ(true);
            }
        },
        'sensorLayer': function (newValue) {
            if (newValue) {
                this.sensorGroup.addTo(this.map);
            } else {
                this.map.removeLayer(this.sensorGroup);
            }
        },
        'radarLayer': function (newValue) {
            if (newValue) {
                this.layers.radar.addTo(this.map);
            } else {
                this.map.removeLayer(this.layers.radar);
            }
        },
        'windLayer': function (newValue) {
            if (newValue) {
                this.layers.wind_layer.addTo(this.map);
            } else {
                this.map.removeLayer(this.layers.wind_layer);
            }
        }
    },
    mounted: function () {
        // if the page is less than 600px wide, the sidebar starts off hidden
        if ($(window).width() < 600) {
            this.slide();
        }

        /** Let's first build the layers. Notice that map is not ready yet.
         * We are building layers not rendering them
         */
        this.buildLayers();
        /**
         * Now let's kick off the map and start rendering
         */
        this.initMap();
        /**
         * This will load sensor data from remote API
         */
        this.loadData();
        /**
         * This will load data from OpenAQ API
         */
        this.loadOpenAQ();
        /**
         * This will load data from PurpleAir API
         */
        this.loadEPA();
        /**
         * This will load data from PurpleAir API
         */
        this.loadPurpleAir();
        /**
         * This will load data from local json file
         */
        this.loadPollution();
        /**
         * Bind icons to accordions
         */
        this.bindIconsToAccordian();
    },
    beforeDestroy: function () {
        // store marker
    },
    mqtt: {
        '001e0610c2e7/GPSGPGGA1'(payload) {
            if (payload != null) {
                try {
                    if (JSON.parse(payload.toString())) {
                        payload = JSON.parse(payload.toString());

                        // update array for latitude and longitude
                        this.addPoint(payload);
                    }
                } catch (error) {
                    alert(error, "=>", payload.toString())
                    // handle NaN errors
                    payload = JSON.parse(payload.toString().replace(/NaN/g, "\"NaN\""))

                }
            }
        },

        // '+/calibrated'(payload) {
        //     if (payload != null) {
        //         try {
        //             if (JSON.parse(payload.toString())) {
        //                 payload = JSON.parse(payload.toString());
        //             }
        //         } catch (error) {
        //             // handle NaN errors
        //             payload = JSON.parse(payload.toString().replace(/NaN/g, "\"NaN\""))
        //         }

        //         // update or put values into the sensors array to cache last payload
        //         if (this.$set(this.sensors, this.sensors[this.sensors.findIndex(obj => { return obj.data.sensor_id === payload.sensor_id })].data, payload)) {
        //             this.redrawSensors(payload, this.sensors[this.sensors.findIndex(obj => { return obj.data.sensor_id === payload.sensor_id })].data, this.sensors[this.sensors.findIndex(obj => { return obj.data.sensor_id === payload.sensor_id })].name);
        //         }
        //     }
        // }
    },
    methods: {
        toggleFocus: function () {
            if (this.focused) {
                this.focused = false
            } else {
                this.focused = true
            }
        },

        addPoint: function (payload) {
            // console.log("lat:", payload.latitudeCoordinate, "\tlng:", payload.longitudeCoordinate);
            // console.log(this.lastReadPM.PM)
            // calling a method to add a point
            this.$store.commit('addPointPath', payload);

            // need car Icons for direction

            //  var northIcon = L.icon({
            //    iconUrl: '../../src/assets/north.png',
            //    iconSize: [20, 35]
            // })
            // var southIcon = L.icon({
            //     iconUrl: '../../img/south.png',
            //     iconSize: [20, 35]
            // })
            // var leftCar = L.icon({
            //     iconUrl: '../../src/assets/left.png',
            //     iconSize: [20, 35]
            // })
            // var rightCar = L.icon({
            //     iconUrl: '../../src/assets/right.png',
            //     iconSize: [25, 40]
            // })

            var timeDiffMinutes = this.$moment.duration(this.$moment.utc().diff(this.$moment.utc(this.$store.state.carPath[this.$store.state.carPath.length - 1].timestamp))).asMinutes();
            var fillColor = timeDiffMinutes > 10 ? '#808080' : this.getMarkerColor(this.lastReadPM.PM);
            if (this.$store.state.carPath.length > 1) {

                this.path = L.polyline([this.$store.state.carPath[this.$store.state.carPath.length - 2], this.$store.state.carPath[this.$store.state.carPath.length - 1]], { color: this.getMarkerColor(this.lastReadPM.PM ? this.lastReadPM.PM : 0) }).addTo(this.map);
                this.path.bringToFront();

                // deals with creation of an Icon
                // TO-DO write logic for directional icons based on latitude & longitude
                if (this.marker) {
                    this.marker.setIcon(
                        L.divIcon({
                            className: 'svg-icon-car',
                            html: this.getCircleMarker("#38b5e6", fillColor, 40, parseFloat(this.lastReadPM.PM ? this.lastReadPM.PM : 0).toFixed(2)),
                            iconAnchor: [20, 32],
                            iconSize: [20, 32],
                        })
                    );
                    this.marker.setLatLng(this.$store.state.carPath[this.$store.state.carPath.length - 1])
                }
                else {
                    this.marker = L.marker(this.$store.state.carPath[this.$store.state.carPath.length - 1], {
                        icon: L.divIcon({
                            className: 'svg-icon-car',
                            html: this.getCircleMarker("#38b5e6", fillColor, 40, parseFloat(this.lastReadPM.PM ? this.lastReadPM.PM : 0).toFixed(2)),
                            iconAnchor: [20, 32],
                            iconSize: [20, 32],
                        }),
                    });
                }

                if (this.focused) {
                    this.map.fitBounds(this.path.getBounds())
                }
            }

            // this.map.addLayer(this.path)
            if (this.$store.state.carPath.length == 2) {
                this.map.fitBounds(this.path.getBounds());
                this.marker.addTo(this.map)
            }
        },

        redrawSensors: function (payload, sensor, sensorName) {
            // modifying the DOM according to the received data
            var timeDiffMinutes = this.$moment.duration(this.$moment.utc().diff(this.$moment.utc(payload.timestamp))).asMinutes();
            var fillColor = timeDiffMinutes > 10 ? '#808080' : this.getMarkerColor(payload[this.pmType]);
            this.sensors[this.sensors.findIndex(obj => { return obj.data.sensor_id === payload.sensor_id })].data.marker.setIcon(
                L.divIcon({
                    className: 'svg-icon-' + payload.sensor_id,
                    html: this.getCircleMarker("#38b5e6", fillColor, 40, parseFloat(payload[this.pmType]).toFixed(2)),
                    iconAnchor: [20, 10],
                    iconSize: [20, 32],
                    popupAnchor: [150, -30]
                }));

            // this is to check if there is a card currently open if so close and re-open it works with the other if
            if (this.sensors[this.sensors.findIndex(obj => { return obj.data.sensor_id === payload.sensor_id })].data.marker.isPopupOpen() && this.sensors[this.sensors.findIndex(obj => { return obj.data.sensor_id === payload.sensor_id })].data.sensor_id == payload.sensor_id) {
                this.sensors[this.sensors.findIndex(obj => { return obj.data.sensor_id === payload.sensor_id })].data.marker.closePopup()
                this.popupStatus = true

            }
            sensor.marker.on('popupopen', (e) => {
                this.checkSensor(e, this.sensors[this.sensors.findIndex(obj => { return obj.data.sensor_id === payload.sensor_id })].data, sensorName, payload)
            });
            // give us the ability to update a popup if open albeit a hacky way.
            if (this.popupStatus && this.sensors[this.sensors.findIndex(obj => { return obj.data.sensor_id === payload.sensor_id })].data.sensor_id == payload.sensor_id) {
                this.sensors[this.sensors.findIndex(obj => { return obj.data.sensor_id === payload.sensor_id })].data.marker.openPopup()
                console.log("opening popup again")
                this.popupStatus = false;
            }

        },

        buildLayers: function () {
            /** Bright Layer */
            this.layers.bright = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 23
            });
            this.layerControl.addBaseLayer(this.layers.bright, "Carto Positron");

            /** Dark Layer */
            this.layers.dark_mode = L.tileLayer(
                "http://{s}.sm.mapstack.stamen.com/" +
                "(toner-lite,$fff[difference],$fff[@23],$fff[hsl-saturation@20])/" +
                "{z}/{x}/{y}.png", {
                attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, ' +
                    'NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
            }
            );
            this.layerControl.addBaseLayer(this.layers.dark_mode, "Dark Mode");

            /** Satellite Layer */
            this.layers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            });
            this.layerControl.addBaseLayer(this.layers.satellite, "Satellite");

            /** Street Layer */
            this.layers.streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                //detectRetina: true,
                attribution: '&amp;copy; &lt;a href="https://www.openstreetmap.org/copyright"&gt;OpenStreetMap&lt;/a&gt; contributors'
            });
            this.layerControl.addBaseLayer(this.layers.streets, "Street Maps");

            /** Radar Layer */
            this.layers.radar = L.tileLayer.wms(
                "http://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi", {
                layers: 'nexrad-n0r',
                format: 'image/png',
                transparent: true,
                attribution: "Weather data &copy; 2015 IEM Nexrad",
                zIndex: 1000
            }
            );

            /** Wind Layer */
            this.buildWindLayer('Carto Positron', false);
        },

        windColorScale: function (layerName) {
            var dark = [
                "rgb(36,104,180)",
                "rgb(60,157,194)",
                "rgb(128,205,193)",
                "rgb(151,218,168)",
                "rgb(198,231,181)",
                "rgb(238,247,217)",
                "rgb(255,238,159)",
                "rgb(252,217,125)",
                "rgb(255,182,100)",
                "rgb(252,150,75)",
                "rgb(250,112,52)",
                "rgb(245,64,32)",
                "rgb(237,45,28)",
                "rgb(220,24,32)",
                "rgb(180,0,35)"
            ];

            var light = [
                "rgb(219,151,75)",
                "rgb(195,98,61)",
                "rgb(127,50,62)",
                "rgb(104,37,87)",
                "rgb(57,24,87)",
                "rgb(17,8,38)",
                "rgb(0,17,38)",
                "rgb(3,38,130)",
                "rgb(0,73,155)",
                "rgb(3,105,180)",
                "rgb(5,143,203)",
                "rgb(10,191,223)",
                "rgb(18,210,227)",
                "rgb(35,231,223)",
                "rgb(75,255,220)"
            ];

            if (layerName == "Dark Mode" || layerName == "Satellite") {
                return dark;
            } else {
                return light;
            }
        },

        buildWindLayer: function (layerName, addWhenready) {
            sensorData.getWindData().then(response => {
                this.layers.wind_layer = L.velocityLayer({
                    displayValues: true,
                    displayOptions: {
                        velocityType: 'GBR Wind',
                        position: 'bottomright', //REQUIRED !
                        emptyString: 'No velocity data', //REQUIRED !
                        angleConvention: 'bearingCW',
                        displayPosition: 'topright',
                        displayEmptyString: 'No velocity data',
                        speedUnit: 'm/s'
                    },
                    data: response.data,
                    maxVelocity: 10,
                    colorScale: this.windColorScale(layerName)
                });
                this.wind.data_time = response.data[0].recorded_time.replace(".000Z", "");
                this.wind.updated_time = response.data[0].header.refTime.replace(".000Z", "");
                if (addWhenready) {
                    this.windLayer = true;
                }
            });
        },

        bindIconsToAccordian: function () {
            $('#PurpleAir').append(this.getPentagonMarker("#9370DB", "#ffff9e", 25, ''));
            $('#EPA').append(this.getSquareMarker("#6B8E23", "#ffff9e", 25, ''));
            // $('#EPA').append(this.getHexagonMarker("#66CDAA", "#ffff9e", 25, ''));
            $('#DFW').append(this.getCircleMarker("#38b5e6", "#ffff9e", 25, ''));
            $('#pollution').append(this.getCircleMarker("#38b5e6", "#000000", 20, ''));
        },

        initMap: function () {
            this.map = L.map('map', {
                center: [32.89746164575043, -97.04086303710938],
                zoom: 10,
                layers: this.layers.bright,
                zoomControl: false
            });
            window.lmap = this.map;
            this.map.addControl(L.control.zoom({
                position: 'topright'
            }));
            this.map.doubleClickZoom.disable();
            this.layerControl.addTo(this.map);
            this.sensorGroup.addTo(this.map);
            L.control.scale({
                position: 'bottomright'
            }).addTo(this.map);
            this.map.on('baselayerchange', (event) => {
                var previousValue = this.windLayer;
                this.windLayer = false;
                this.buildWindLayer(event.name, previousValue);
            });
        },

        loadPurpleAir: function () {
            purpleAirData.getSensorData(purpleAirData.sensors.join("|")).then(response => {
                response.data.results.forEach(result => {
                    /** They have nested devices. So, let's consider parent only */
                    if (!result.ParentID) {
                        this.renderPurpleAir(result);
                    }
                });
            });
        },

        loadPollution: function () {
            this.$axios.get("/json/PollutionBurdenByCouncilDistrict.json").then(response => {
                response.data.forEach(item => {
                    this.renderPollution(item);
                });
            });
        },

        renderPollution: function (location) {
            location.marker = L.marker([location.Latitude, location.Longitude], {
                icon: L.divIcon({
                    className: 'svg-icon',
                    html: this.getCircleMarker("#38b5e6", "#000000", 20, ''),
                    iconAnchor: [20, 10],
                    iconSize: [20, 32],
                    popupAnchor: [0, -30]
                })
            });
            location.marker.addTo(this.pollutionGroup);
            var popup = "<div style='font-size:14px'>";
            popup += "<div style='text-align:center; font-weight:bold;'>" + location['Industry Name'] + " </div><br>";
            popup += "<div style='text-align:center;'>" + location.Address + " </div><br>";
            popup += "<li> SOX : " + location['Permitted PM (TPY)'] + " </li><br>";
            popup += "<li> PM : " + location['Permitted SOx (TPY)'] + " </li><br>";
            popup += "<li> Voc : " + location['Permitted VoC (TPY)'] + " </li><br>";
            popup += "</div>";
            location.marker.bindPopup(popup);
        },

        renderPurpleAir: function (location) {
            location.marker = L.marker([location.Lat, location.Lon], {
                icon: L.divIcon({
                    className: 'svg-icon',
                    html: this.getPentagonMarker("#9370DB", this.getMarkerColor(location.pm2_5_atm), 40, location.pm2_5_atm),
                    iconAnchor: [20, 10],
                    iconSize: [20, 32],
                    popupAnchor: [0, -30]
                })
            });
            location.marker.addTo(this.purpleAirGroup);
            var popup = "<div style='font-size:14px'>";
            popup += "<div style='text-align:center; font-weight:bold'>" + location.Label + " </div><br>";
            // Using channel A
            popup += "<li class='pm25'> PM2.5 : " + location.pm2_5_atm + " µg/m³ </li><br>";
            popup += "<li> PM1 : " + location.pm1_0_atm + " µg/m³ </li><br>";
            popup += "<li> PM10 : " + location.pm10_0_atm + " µg/m³ </li><br>";
            popup += "<li> Temperature : " + location.temp_f + "°F </li><br>";
            popup += "<li> Humidity : " + location.humidity + "% </li><br>";
            let unix_timestamp = location.LastUpdateCheck;
            var a = new Date(unix_timestamp * 1000);
            var months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
            var year = a.getFullYear();
            var month = months[a.getMonth()];
            var date = a.getDate();
            var hour = a.getHours();
            var min = a.getMinutes();
            var sec = a.getSeconds();
            var time = year + '-' + month + '-' + date + ' ' + hour + ':' + min + ':' + sec;
            popup += "<div style='text-align:right; font-size: 11px'>Last Updated: " + time + " UTC</div>";
            popup += "</div>";
            location.marker.bindPopup(popup);
        },

        loadOpenAQ: function (refresh) {
            if (refresh) {
                this.map.removeLayer(this.openAQGroup);
                this.openAQGroup = L.layerGroup();
                this.openAQGroup.addTo(this.map);
            }
            openAqData.getLatestCityData().then(response => {
                response.data.results.forEach(result => {
                    this.renderOpenAQ(result);
                });
            });
        },

        renderOpenAQ: function (location) {
            var parameter = this.epaType.toLocaleLowerCase();
            location.measurements.forEach((measurement) => {
                if (parameter != measurement.parameter) {
                    return;
                }
                var markerValue = '';
                var fillColor = "#6B8E23"; //O3 colors to be determined
                if (measurement.parameter == "pm25") {
                    fillColor = this.getMarkerColor(measurement.value);
                    markerValue = measurement.value;
                }

                location.marker = L.marker([location.coordinates.latitude, location.coordinates.longitude], {
                    icon: L.divIcon({
                        className: 'svg-icon',
                        html: this.getSquareMarker("#6B8E23", fillColor, 40, markerValue),
                        iconAnchor: [20, 10],
                        iconSize: [20, 32],
                        popupAnchor: [0, -30]
                    })
                });
                location.marker.addTo(this.openAQGroup);
                var popup = "<div style='font-size:14px'>";
                popup += "<div style='text-align:center; font-weight:bold'>" + location.location + " </div><br>";
                if (measurement.parameter == "pm25") {
                    popup += "<li class='pm25'>" + "PM2.5 : " + measurement.value + " " + measurement.unit + " </li><br>";
                } else if (measurement.parameter == "o3") {
                    popup += "<li>" + "O3 : " + measurement.value + " " + measurement.unit + " </li><br>";
                }
                popup += "<div style='text-align:right; font-size: 11px'>Last Updated: " + location.measurements[0].lastUpdated + " UTC</div>";
                popup += "</div>";
                location.marker.bindPopup(popup);
            });
        },

        loadEPA: function (refresh) {
            if (refresh) {
                this.map.removeLayer(this.epaGroup);
                this.epaGroup = L.layerGroup();
                this.epaGroup.addTo(this.map);
            }
            epaData.getLatestCityData(this.epaType).then(response => {
                response.data.forEach(result => {
                    this.renderEPA(result);
                });
            });
        },

        renderEPA: function (location) {
            var fillColor = "#66CDAA"; // O3 colors to be determined
            var PM_value = "";
            if (location.Parameter == "PM2.5") {
                fillColor = this.getMarkerColor(location.Value);
                PM_value = location.Value;
            }
            location.marker = L.marker([location.Latitude, location.Longitude], {
                icon: L.divIcon({
                    className: 'svg-icon',
                    //html: this.getOctagonMarker("#66CDAA", fillColor, 40, PM_value),
                    html: this.getSquareMarker("#66CDAA", fillColor, 40, PM_value),
                    iconAnchor: [20, 10],
                    iconSize: [20, 32],
                    popupAnchor: [0, -30]
                })
            });
            location.marker.addTo(this.epaGroup);
            var popup = "<div style='font-size:14px'>";
            popup += "<div style='text-align:center; font-weight:bold'>" + location.SiteName + " </div><br>";
            popup += "<li class='" + (location.Parameter == 'PM2.5' ? 'pm25' : '') + "'> " + location.Parameter + " : " + location.Value + " µg/m³ </li><br>";
            popup += "<div style='text-align:right; font-size: 11px'>Last Updated: " + location.UTC + " UTC</div>";
            popup += "</div>";
            location.marker.bindPopup(popup);
        },

        loadData: function () {
            sensorData.getSensors().then(response => {
                var i = 0;
                response.data.forEach(s => {
                    sensorData.getSensorLocation(s).then(sensorLocatRes => {
                        if (sensorLocatRes.data.length &&
                            sensorLocatRes.data[0].longitude != null && sensorLocatRes.data[0].latitude != null) {
                            sensorData.getSensorName(s).then(sensorNameRes => {
                                if (sensorNameRes.data.length && sensorNameRes.data[0].sensor_name != null) {
                                    sensorData.getSensorData(s).then(sensorResponse => {
                                        if (sensorResponse.data.length) {
                                            sensorResponse.data.id = s;
                                            this.sensors.push({
                                                data: sensorResponse.data[0],
                                                location: sensorLocatRes.data[0],
                                                name: sensorNameRes.data[0].sensor_name
                                            });
                                            this.renderSensor(this.sensors[this.sensors.length - 1].data, this.sensors[this.sensors.length - 1].location, this.sensors[this.sensors.length - 1].name, i++);
                                        }
                                    });
                                }
                            });
                        }
                    });
                });
            });
        },

        // single click pop up information
        renderSensor: function (sensor, sensorLocation, sensorName, zIndexPriority) {
            var timeDiffMinutes = this.$moment.duration(this.$moment.utc().diff(this.$moment.utc(sensor.timestamp))).asMinutes();
            var fillColor = timeDiffMinutes > 10 ? '#808080' : this.getMarkerColor(sensor[this.pmType]);

            sensor.marker = L.marker([sensorLocation.latitude, sensorLocation.longitude], {
                icon: L.divIcon({
                    className: 'svg-icon-' + sensor.sensor_id,
                    html: this.getCircleMarker("#38b5e6", fillColor, 40, parseFloat(sensor[this.pmType]).toFixed(2)),
                    iconAnchor: [20, 10],
                    iconSize: [20, 32],
                    popupAnchor: [0, -30]
                }),
                title: sensorName,
                alt: sensor.sensor_id,
                zIndexOffset: zIndexPriority * 5 // Ensures more recently updated sensors will remain on top
            });

            // handles click event for single click events
            sensor.marker.addTo(this.sensorGroup);

            var popup = L.popup({
                offset: L.point(-150, 45),
                maxWidth: '300px',
                autoPan: true,
                keepInView: true
            }).setContent("<div id='flycard'></div>")
            sensor.marker.bindPopup(popup);

            sensor.marker.on('click', () => {
                this.selectedSensor = sensor;
                // maybe put a watcher on the open target sensor and set data equal to the one in the array
            })

            // look at leaflet documentation :https://leafletjs.com/reference-1.7.1.html#domevent-on || https://leafletjs.com/reference-1.7.1.html#domevent-on
            sensor.marker.on('popupopen', (e) => {
                this.sensorEvent(e, sensor, sensorName)
            });
            // sensor.marker.once('popupclose', function (e) {
            //     e.popup._source.sensorPopup.$destroy("#flyCard");
            // });
        },

        checkSensor: function (e, sensor, sensorName, payload) {
            var newPopup = new Vue({
                vuetify,
                render: h => h(Sensor, {
                    props: {
                        spot: payload,
                        spotName: sensorName
                    }
                })
            }).$mount().$el;

            sensor.marker.setPopupContent(() => newPopup)
        },

        sensorEvent: function (e, sensor, sensorName) {
            // Create new pop up vue component and...
            var newPopup = new Vue({
                vuetify,
                render: h => h(Sensor, {
                    props: {
                        spot: this.sensors[this.sensors.findIndex(obj => { return obj.data.sensor_id === sensor.sensor_id })].data,
                        spotName: sensorName
                    }
                })
            });
            newPopup.$mount("#flycard");
            // ...track it in the marker component for destruction later
            e.popup._source.sensorPopup = newPopup;

            // Destroy pop up dialogue after the user closes it
            /* sensor.marker.once('popupclose', function (e) {
                e.popup._source.sensorPopup.$destroy("#flyCard");
            }); */
        },

        buildMarkerIcon: function (sensor) {
            /** If you change SCG marker,
             *  you need to fine tune  iconAnchor, iconSize & popupAnchor as well*/
            return L.divIcon({
                className: 'svg-icon',
                html: this.getSVGMarker(this.getMarkerColor(sensor)),
                iconAnchor: [20, 10],
                iconSize: [20, 32],
                popupAnchor: [0, -30]
            });
        },

        refreshIcons() {
            this.sensors.forEach(sensor => {
                sensor.marker.setStyle({
                    fillColor: this.getMarkerColor(sensor)
                });
            });
        },

        getMarkerColor(PM) {
            if (PM >= 0 && PM <= 10) return "#ffff52";//"#ffff9e"; //"#ffff66";
            else if (PM > 10 && PM <= 20) return "#ff6600";
            else if (PM > 20 && PM <= 50) return "#ff5534"; //"#cc0000";
            else if (PM > 50 && PM <= 100) return "#D34FD0"; //"#990099";
            else if (PM > 100) return "#AB5753"; //"#732626";
        },

        slide() {
            var hidden = $('.side-drawer');
            if (hidden.hasClass('visible')) {
                hidden.animate({
                    "left": "-280px"
                }, "slow").removeClass('visible');
            } else {
                hidden.animate({
                    "left": "0px"
                }, "slow").addClass('visible');
            }
        },

        invertHex: function (hex) {
            return (Number(`0x1${hex}`) ^ 0xFFFFFF).toString(16).substr(1).toUpperCase();
        },

        getCircleMarker(color, fill, size, value) {
            var textColor = this.invertHex(fill);
            var svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
                        <circle fill="${fill}" fill-opacity="0.8" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" stroke="${color}" cx="12" cy="12" r="10"></circle>
                        <text id="sensorText" x="12" y="15" fill="${textColor}" text-anchor="middle" font-family="PT Sans" font-size="8" >${value}</text></svg>`;
            return svg;
        },

        getSquareMarker(color, fill, size, value) {
            var svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"><rect fill="${fill}" fill-opacity="0.8" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><text x="12" y="15" style="font-weight: 100" text-anchor="middle" font-family="PT Sans" font-size="8">${value}</text></svg>`;
            return svg;
        },

        getHexagonMarker(color, fill, size, value) {
            var svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"><path fill="${fill}" fill-opacity="0.8" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 2l9 4.9V17L12 22l-9-4.9V7z"/><text x="12" y="15" style="font-weight: 100" text-anchor="middle" font-family="PT Sans" font-size="8">${value}</text></svg>`;
            return svg;
        },

        getOctagonMarker(color, fill, size, value) {
            var svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"><polygon fill="${fill}" fill-opacity="0.8" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><text x="12" y="15" style="font-weight: 100" text-anchor="middle" font-family="PT Sans" font-size="8">${value}</text></svg>`;
            return svg;
        },

        getPentagonMarker(color, fill, size, value) {
            var svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 572 545"><path fill="${fill}" fill-opacity="0.8" stroke="${color}" stroke-width="30" stroke-linecap="round" stroke-linejoin="round" d="M 286,10 L 10,210 L 116,535 L 456,535 L 562,210 Z"/><text x="280" y="340" style="font-weight: 400" text-anchor="middle" font-family="PT Sans" font-size="180">${value}</text></svg>`;
            return svg;
        },

        reset() {
            this.selectedSensor = null;
            this.radarLayer = false;
            this.windLayer = true;
            this.sensorLayer = true;
            this.epaLayer = false;
            this.purpleAirLayer = false;
            this.openAQLayer = false;
            this.pollutionLayer = false;
            this.howToUse = false;
            this.epaType = "PM25";
            this.pmType = "pm2_5";
            this.activePanel = 0;
            this.map.setView([32.89746164575043, -97.04086303710938], 10);
        }
    }
};