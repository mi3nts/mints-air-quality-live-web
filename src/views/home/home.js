import Sensor from "@/components/sensor";
import sensorData from "../../services/sensor-data";
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
            carLayer: true,
            sensorLayer: true,
            // startDate: null,
            // endDate: null,
            /** Popup controls */
            howToUse: false,
            /** Currently selected PM type */
            pmType: "pm2_5",
            dataOverTime: "_past_hour",
            dataTypeToDisplay: "pm2_5_past_hour", // pmType + dataOverTime
            sensorLastUpdate: null,
            /** Default state of left side expansion panels */
            activePanel: 0,
            /** All available sensor instances  */
            sensors: [],
            sensorGroup: L.markerClusterGroup({
                disableClusteringAtZoom: 13
            }),
            carMarkers: L.layerGroup(),
            path: null,
            marker: null,
            //car tracking zoom variable
            focused: true,
        };
    },
    computed: {
        // get last read value from mqtt data
        getLastRead: function () {
            return this.$store.state.prevPayload;
        },
        getTrigger: function () {
            return this.$store.state.triggerMap;
        }
    },
    watch: {
        'pmType': function () {
            this.refreshIcons();
            this.dataTypeToDisplay = this.pmType + this.dataOverTime
            this.refreshSensorIcons()
        },
        'dataOverTime': function () {
            this.dataTypeToDisplay = this.pmType + this.dataOverTime
            this.refreshSensorIcons()
        },
        'carLayer': function (newValue) {
            if(newValue) {
                this.carMarkers.addTo(this.map);
            } else {
                this.map.removeLayer(this.carMarkers);
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
        },
        getTrigger: function () {
            this.addPoint()
        }
    },
    mounted: function () {
        //hid it because it doesn't seem neccesary right now
        // if the page is less than 1920px wide, the sidebar starts off hidden
        if ($(window).width() < 1920) {
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
         * Bind icons to accordions
         */
        this.bindIconsToAccordian();

        /*
         * Replots line if there is existing data in the session
         */
        this.replotLine();
    },
    methods: {
        //for toggling focus on the car with zoom mode
        toggleFocus: function () {
            if (this.focused) {
                this.focused = false
                $('#btnFocused').html("Map focus unlocked")
            } else {
                this.focused = true
                $('#btnFocused').html("Map focus locked on car")
            }
        },
        //replot line so that when you navigate back into the map the path is drawn
        replotLine: function () {
            var carPathLength = this.$store.state.carPath.length
            if (carPathLength > 1) {
                for (var index = 2; index < carPathLength; index++) {
                    this.path = L.polyline(
                        [this.$store.state.carPath[index - 2].coord, this.$store.state.carPath[index - 1].coord], 
                        { 
                            color: this.getMarkerColor(this.$store.state.carPath[index - 1].pmThresh) 
                        }).addTo(this.carMarkers);
                    this.path.bringToFront();
                }
            }
        },

        /**
         * Add point for car
         */
        addPoint: function () {
            // need car Icons for direction
            //previously commented out by last team so I am cautious here and simply experimenting with this -kev
             //var northIcon = L.icon({
                //iconUrl: '../../img/north.png',
                //iconSize: [20, 35]
             //})
             //var southIcon = L.icon({
                 //iconUrl: '../../img/south.png',
                 //iconSize: [20, 35]
             //})
             //var leftCar = L.icon({
                //iconUrl: '../../img/left.png',
                //iconSize: [20, 35]
             //})
             //var rightCar = L.icon({
                //iconUrl: '../../img/right.png',
                //iconSize: [25, 40]
            // })
             //********************************************************************** */ 
            var carPathLength = this.$store.state.carPath.length; 
            var timeDiffMinutes = this.$moment.duration(
                this.$moment.utc().diff(this.$moment.utc(this.$store.state.carPath[this.$store.state.carPath.length - 1].timestamp))).asMinutes();
            
            var fillColor = timeDiffMinutes > 10 ? '#808080' : this.getMarkerColor(this.getLastRead.PM);
            if (carPathLength > 1) {
                // console.log(this.$store.state.carPath[carPathLength - 1].pmThresh)
                this.path = L.polyline(
                    [this.$store.state.carPath[carPathLength - 2].coord, 
                    this.$store.state.carPath[carPathLength - 1].coord], 
                    { 
                        color: this.getMarkerColor(this.getLastRead.PM ? this.getLastRead.PM : 0) 
                    }
                ).addTo(this.carMarkers);

                this.path.bringToFront();

                // deals with creation of an Icon
                // TO-DO write logic for directional icons based on latitude & longitude
                // if (this.marker) {
                //     this.marker.setIcon(
                //         L.icon({
                //                iconUrl: '../../img/north.png',
                //                iconSize: [20, 35]
                //         //L.divIcon({
                //         //    className: 'svg-icon-car',
                //         //    //icon: northIcon,
                //         //    html: this.getCircleMarker("#38b5e6", fillColor, 40, parseFloat(this.getLastRead.PM ? this.getLastRead.PM : 0).toFixed(2)),
                //         //    iconAnchor: [20, 32],
                //         //    iconSize: [20, 32],
                //         })
                //     );
                //     this.marker.setLatLng(this.$store.state.carPath[carPathLength - 1].coord)
                // }
                // else {
                //     this.marker = L.marker(this.$store.state.carPath[carPathLength - 1].coord, {
                //         icon: L.divIcon({
                //             className: 'svg-icon-car',
                //             html: this.getCircleMarker("#38b5e6", fillColor, 40, parseFloat(this.getLastRead.PM ? this.getLastRead.PM : 0).toFixed(2)),
                //             iconAnchor: [20, 32],
                //             iconSize: [20, 32],
                //         }),
                //     });

                //     if (!this.map.hasLayer(this.marker)) {
                //         this.marker.addTo(this.map)
                //     }
                // }
                this.marker = L.marker(this.$store.state.carPath[carPathLength - 1].coord, {
                    icon: L.divIcon({
                        className: 'svg-icon-car',
                        html: this.getCircleMarker("#38b5e6", fillColor, 40, parseFloat(this.getLastRead.PM ? this.getLastRead.PM : 0).toFixed(2)),
                        iconAnchor: [20, 32],
                        iconSize: [20, 32],
                    }),
                });

                this.marker.addTo(this.carMarkers)

                //this checks whether the icon should be tracked or not
                if (this.focused) {
                    this.map.fitBounds(this.path.getBounds(), { maxZoom: 18 })
                }
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
                // detectRetina: true,
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

        /**
         * Accordian for sidebar
         */
        bindIconsToAccordian: function () {
            $('#DFW').append(this.getCircleMarker("#38b5e6", "#ffff9e", 25, ''));
        },

        /**
         * Initialize Map
         */
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
            this.carMarkers.addTo(this.map);
            L.control.scale({
                position: 'bottomright'
            }).addTo(this.map);
            this.map.on('baselayerchange', (event) => {
                var previousValue = this.windLayer;
                this.windLayer = false;
                this.buildWindLayer(event.name, previousValue);
            });
        },

        /**
         * Load and render map layers and icons
         */
        loadData: function () {
            sensorData.getMainSensorData().then(response => {
                var i = 0;
                response.data.forEach(s => {
                    s.pm1_latest = s.pm1
                    s.pm2_5_latest = s.pm2_5
                    s.pm10_latest = s.pm10
                    this.sensors.push(s)

                    // Create new sensors for display
                    this.renderSensor(s, s.latitude, s.longitude, s.sensor_name, i++)

                    // Fetch additional data (do not chain async calls)
                    // Refresh display when done in case data was not available when sensors were created
                    sensorData.getSensorPastHourAverage(s.sensor_id, 'pm1', 1).then(response => {
                        s.pm1_past_hour = response.data[0].avg
                        this.refreshSensorIcons()
                    })
                    sensorData.getSensorPastHourAverage(s.sensor_id, 'pm2_5', 1).then(response => {
                        s.pm2_5_past_hour = response.data[0].avg
                        this.refreshSensorIcons()
                    })
                    sensorData.getSensorPastHourAverage(s.sensor_id, 'pm10', 1).then(response => {
                        s.pm10_past_hour = response.data[0].avg
                        this.refreshSensorIcons()
                    })

                    // Set last update timestamp
                    var now = new Date()
                    this.sensorLastUpdate = now.toLocaleString('en-US', { timeZone: 'UTC'})
                });
            });
        },

        // single click pop up information
        renderSensor: function (sensor, sensorLat, sensorLon, sensorName, zIndexPriority) {
            var timeDiffMinutes = this.$moment.duration(this.$moment.utc().diff(this.$moment.utc(sensor.timestamp))).asMinutes();
            var fillColor = timeDiffMinutes > 60 ? '#808080' : this.getMarkerColor(sensor[this.dataTypeToDisplay]);
            sensor.marker = L.marker([sensorLat, sensorLon], {
                icon: L.divIcon({
                    className: 'svg-icon-' + sensor.sensor_id,
                    html: this.getCircleMarker("#38b5e6", fillColor, 40, parseFloat(sensor[this.dataTypeToDisplay]).toFixed(2)),
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

        refreshSensorIcons() {
            this.sensors.forEach(sensor => {
                // Safety check in case the async data fetch for past hour average does not complete in time, thus preventing a site
                //   crash client-side due to a missing object member variable
                if(this.dataTypeToDisplay in sensor) {
                    var timeDiffMinutes = this.$moment.duration(this.$moment.utc().diff(this.$moment.utc(sensor.timestamp))).asMinutes();
                    var fillColor = timeDiffMinutes > 60 ? '#808080' : this.getMarkerColor(sensor[this.dataTypeToDisplay]);
                    sensor.marker.setIcon(L.divIcon({
                        className: 'svg-icon',
                        html: this.getCircleMarker("#38b5e6", fillColor, 40, parseFloat(sensor[this.dataTypeToDisplay]).toFixed(2)),
                        iconAnchor: [20, 10],
                        iconSize: [20, 32],
                        popupAnchor: [0, -30]
                    }));
                }
            });
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
            // sensor.marker.once('popupclose', function (e) {
            //     e.popup._source.sensorPopup.$destroy("#flyCard");
            // });
        },

        buildMarkerIcon: function (sensor) {
            /** 
             * If you change SCG marker,
             * you need to fine tune  iconAnchor, iconSize & popupAnchor as well
             */
            return L.divIcon({
                className: 'svg-icon',
                html: this.getSVGMarker(this.getMarkerColor(sensor)),
                iconAnchor: [20, 10],
                iconSize: [20, 32],
                popupAnchor: [0, -30]
            });
        },

        // Color markers based on PM value
        getMarkerColor(PM) {
           if (PM == 0) return '#808080'
            else if (PM > 0 && PM <= 10) return "#ffff9e" //"#ffff66";
            else if (PM > 10 && PM <= 20) return "#ff6600";
            else if (PM > 20 && PM <= 50) return "#ff5534"; //"#cc0000";
            else if (PM > 50 && PM <= 100) return "#D34FD0"; //"#990099";
            else if (PM > 100) return "#AB5753"; //"#732626";
        },

        // Invert color hex value for text
        invertHex: function (hex) {
            return (Number(`0x1${hex}`) ^ 0xFFFFFF).toString(16).substr(1).toUpperCase();
        },

        /**
         * Marker shapes
         */
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

        refreshIcons() {
            this.sensors.forEach(sensor => {
                sensor.marker.setStyle({
                    fillColor: this.getMarkerColor(sensor)
                });
            });
        },

        reset() {
            this.selectedSensor = null;
            this.radarLayer = false;
            this.windLayer = true;
            this.sensorLayer = true;
            this.howToUse = false;
            this.pmType = "pm2_5";
            this.activePanel = 0;
            this.map.setView([32.89746164575043, -97.04086303710938], 10);
        },

        // sidebar animcation
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
    }
};