import Sensor from "@/components/sensor";
import sensorData from "../../services/sensor-data";
import purpleAirData from "../../services/purpleair-data";
import openAqData from "../../services/openaq-data";
import epaData from "../../services/epa-data";
import Vue from 'vue';

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
            radarLayer: false,
            windLayer: false,
            sensorLayer: true,
            epaLayer: false,
            purpleAirLayer: false,
            openAQLayer: false,
            //startDate: null,
            //endDate: null,
            /** Popup controls */
            howToUse: false,
            /** Currently selected PM type */
            pmType: "pm2_5",
            /** Default state of left side expansion panels */
            activePanel: 0,
            /** All available sensor instances  */
            sensors: [],
            sensorGroup: L.layerGroup(),
            openAQGroup: L.layerGroup(),
            purpleAirGroup: L.layerGroup(),
            epaGroup: L.layerGroup(),
        }
    },
    watch: {
        'pmType': function () {
            this.refreshIcons()
        },
        'openAQLayer': function (newValue) {
            if (newValue) {
                this.openAQGroup.addTo(this.map)
            } else {
                this.map.removeLayer(this.openAQGroup);
            }
        },
        'purpleAirLayer': function (newValue) {
            if (newValue) {
                this.purpleAirGroup.addTo(this.map)
            } else {
                this.map.removeLayer(this.purpleAirGroup);
            }
        },
        'epaLayer': function (newValue) {
            if (newValue) {
                this.epaGroup.addTo(this.map)
            } else {
                this.map.removeLayer(this.epaGroup);
            }
        },
        'sensorLayer': function (newValue) {
            if (newValue) {
                this.sensorGroup.addTo(this.map)
            } else {
                this.map.removeLayer(this.sensorGroup);
            }
        },
        'radarLayer': function (newValue) {
            if (newValue) {
                this.layers.radar.addTo(this.map)
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
        // If the page is less than 600px wide, the sidebar starts off hidden
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
    },
    methods: {
        buildLayers: function () {
            /** Bright Layer */
            this.layers.bright = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 19
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
            this.buildWindLayer('Carto Positron');
        },
        windColorScale: function (layerName) {
            var dark = [
                "rgb(36,104, 180)",
                "rgb(60,157, 194)",
                "rgb(128,205,193 )",
                "rgb(151,218,168 )",
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
                        position: 'topright', //REQUIRED !
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
                this.wind.updated_time = response.data[0].header.refTime.replace(".000Z", "")
                if (addWhenready) {
                    this.windLayer = true;
                }
            });
        },
        initMap: function () {
            this.map = L.map('map', {
                center: [32.89746164575043, -97.04086303710938],
                zoom: 10,
                layers: this.layers.bright,
                zoomControl: false
            });
            window["lmap"] = this.map;
            this.map.addControl(L.control.zoom({
                position: 'bottomright'
            }));
            this.map.doubleClickZoom.disable();
            this.layerControl.addTo(this.map);
            this.sensorGroup.addTo(this.map);
            this.map.on('baselayerchange', (event) => {
                if (this.windLayer) {
                    this.windLayer = false;
                    this.buildWindLayer(event.name, true);
                }
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
        renderPurpleAir: function (location) {
            location.marker = L.marker([location.Lat, location.Lon], {
                icon: L.divIcon({
                    className: 'svg-icon',
                    html: this.getHexagonMarker("#9370DB", this.getMarkerColor(location.pm2_5_atm), 40, location.pm2_5_atm),
                    iconAnchor: [20, 10],
                    iconSize: [20, 32],
                    popupAnchor: [0, -30]
                })
            })
            location.marker.addTo(this.purpleAirGroup);
            var popup = "<div style='font-size:14px'>";
            popup += "<div style='text-align:center; font-weight:bold'>" + location.Label + " </div><br>";
            //Using channel A
            popup += "<li> PM1 : " + location.pm1_0_atm + " µg/m³ </li><br>";
            popup += "<li> PM2.5 : " + location.pm2_5_atm + " µg/m³ </li><br>";
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
        loadOpenAQ: function () {
            openAqData.getLatestCityData().then(response => {
                response.data.results.forEach(result => {
                    this.renderOpenAQ(result);
                });
            });
        },
        renderOpenAQ: function (location) {
            var index = -1;
            var markerValue = '';
            var fillColor = "#6B8E23"; //O3 colors to be determined
            if (location.measurements[0].parameter.includes("pm25")) {
                index = 0;
            } else if (location.measurements.length - 1 > 0 && location.measurements[1].parameter.includes("pm25")) {
                index = 1;
            }
            if (index != -1) {
                fillColor = this.getMarkerColor(location.measurements[index].value);
                markerValue = location.measurements[index].value;
            }
            location.marker = L.marker([location.coordinates.latitude, location.coordinates.longitude], {
                icon: L.divIcon({
                    className: 'svg-icon',
                    html: this.getSquareMarker("#6B8E23", fillColor, 40, markerValue),
                    iconAnchor: [20, 10],
                    iconSize: [20, 32],
                    popupAnchor: [0, -30]
                })
            })
            location.marker.addTo(this.openAQGroup);
            var popup = "<div style='font-size:14px'>";
            popup += "<div style='text-align:center; font-weight:bold'>" + location.location + " </div><br>";
            location.measurements.forEach(m => {
                if (m.parameter == "pm25") {
                    popup += "<li>" + "PM2.5 : " + m.value + " " + m.unit + " </li><br>";
                } else if (m.parameter == "o3") {
                    popup += "<li>" + "O3 : " + m.value + " " + m.unit + " </li><br>";
                }
            });
            popup += "<div style='text-align:right; font-size: 11px'>Last Updated: " + location.measurements[0].lastUpdated + " UTC</div>";
            popup += "</div>";
            location.marker.bindPopup(popup);
        },
        loadEPA: function () {
            epaData.getLatestCityData().then(response => {
                response.data.forEach(result => {
                    this.renderEPA(result);
                })
            });
        },
        renderEPA: function (location) {
            var fillColor = "#66CDAA"; //O3 colors to be determined
            var PM_value = "";
            if (location.Parameter == "PM2.5") {
                fillColor = this.getMarkerColor(location.Value)
                PM_value = location.Value;
            }
            location.marker = L.marker([location.Latitude, location.Longitude], {
                icon: L.divIcon({
                    className: 'svg-icon',
                    html: this.getOctagonMarker("#66CDAA", fillColor, 40, PM_value),
                    iconAnchor: [20, 10],
                    iconSize: [20, 32],
                    popupAnchor: [0, -30]
                })
            })
            location.marker.addTo(this.epaGroup);
            var popup = "<div style='font-size:14px'>";
            popup += "<div style='text-align:center; font-weight:bold'>" + location.SiteName + " </div><br>";
            popup += "<li> " + location.Parameter + " : " + location.Value + " µg/m³ </li><br>";
            popup += "<div style='text-align:right; font-size: 11px'>Last Updated: " + location.UTC + " UTC</div>";
            popup += "</div>";
            location.marker.bindPopup(popup);
        },
        loadData: function () {
            sensorData.getSensors().then(response => {
                response.data.forEach(s => {
                    sensorData.getSensorData(s).then(sensorResponse => {
                        if (sensorResponse.data.length) {
                            sensorResponse.data.id = s;
                            this.sensors.push(sensorResponse.data[0]);
                            this.renderSensor(sensorResponse.data[0]);
                        }
                    });
                });
            });
        },

        // single click pop up information
        renderSensor: function (sensor) {
            var timeDiffMinutes = this.$moment.duration(this.$moment.utc().diff(this.$moment.utc(sensor.timestamp))).asMinutes();
            var fillColor = timeDiffMinutes > 5 ? 'grey' : this.getMarkerColor(sensor[this.pmType]);
            sensor.marker = L.marker([sensor.latitude, sensor.longitude], {
                icon: L.divIcon({
                    className: 'svg-icon',
                    html: this.getCircleMarker("#38b5e6", fillColor, 40, parseFloat(sensor[this.pmType]).toFixed(2)),
                    iconAnchor: [20, 10],
                    iconSize: [20, 32],
                    popupAnchor: [0, -30]
                })
            });

            //handles click event for single click events
            sensor.marker.addTo(this.sensorGroup);
            var popup = L.popup({
                offset: L.point(-200, 45),
                maxWidth: '400px',
                autoPan : true,
                keepInView : true
            }).setContent("<div id='flyCard'></div>");

            sensor.marker.bindPopup(popup);
            sensor.marker.on('click', () => {
                this.selectedSensor = sensor;
            });

            sensor.marker.on('popupopen', function () {
                document.getElementById("flyCard") && new Vue({
                    render: h => h(Sensor, {
                        props: {
                            spot: sensor
                        }
                    })
                }).$mount("#flyCard");
            });
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
            })
        },

        refreshIcons() {
            this.sensors.forEach(sensor => {
                sensor.marker.setStyle({
                    fillColor: this.getMarkerColor(sensor)
                });
            });
        },
        getMarkerColor(PM) {
            if (PM >= 0 && PM <= 10) return "#ffff66";
            else if (PM > 10 && PM <= 20) return "#ff6600";
            else if (PM > 20 && PM <= 50) return "#cc0000";
            else if (PM > 50 && PM <= 100) return "#990099";
            else if (PM > 100) return "#732626";
        },
        slide() {
            var hidden = $('.side-drawer');
            if (hidden.hasClass('visible')) {
                hidden.animate({
                    "left": "-286px"
                }, "slow").removeClass('visible');
            } else {
                hidden.animate({
                    "left": "0px"
                }, "slow").addClass('visible');
            }
        },
        getCircleMarker(color, fill, size, value) {
            var textColor = (fill == 'grey') ? '#ffffff' : '#ff0000';
            var svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"><circle fill="${fill}" fill-opacity="0.8" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" stroke="${color}" cx="12" cy="12" r="10"></circle><text x="12" y="15" fill="${textColor}" text-anchor="middle" font-family="PT Sans" font-size="8">${value}</text></svg>`;
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
        }
    }
};