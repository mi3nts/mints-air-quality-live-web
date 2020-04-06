import Sensor from "@/components/sensor";
import sensorData from "../../services/sensor-data";
import purpleAirData from "../../services/purpleair-data";
import openAqData from "../../services/openaq-data";

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
            /** Custom made leaflet control for wind date stamps */
            windControl: null,
            radarLayer: false,
            windLayer: false,
            sensorLayer: true,
            epaLayer: false,
            purpleAirLayer: false,
            openAQLayer: false,
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
                this.windControl.addTo(this.map);
            } else {
                this.map.removeLayer(this.layers.wind_layer);
                this.map.removeControl(this.windControl);
            }
        }
    },
    created: function () {
        purpleAirData.getSensorData(purpleAirData.sensors.join("|")).then(response => {
            console.log("Purple Air Data", response.data);
        });

        openAqData.getLatestCityData().then(response => {
            console.log("Open AQ Data", response.data);
        });
    },
    mounted: function () {
        /** Let's first build the layers. Notice that map is not ready yet.
         * We are building layers not rendering them
         */
        this.buildLayers();
        /**
         * Now let's kick off the map and start rendering
         */
        this.initMap();
        /**
         * This will load sensor data from remore API
         */
        this.loadData();
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

            /** Custom leaflet wind control */
            this.buildWindControl();

            /** Wind Layer */
            this.buildWindLayer('Carto Positron');
        },
        buildWindControl: function () {
            L.Control.WindControl = L.Control.extend({
                onAdd: function () {
                    var div = L.DomUtil.create('div');
                    div.class = "wind-display-control";
                    div.innerHTML = "<div><b>Wind Data Time</b> : " + this.options.data_time + "</div>";
                    div.innerHTML += "<div><b>Wind Updated Last</b> : " + this.options.updated_time + "</div>";
                    div.style.width = '260px';
                    div.style.background = 'white';
                    div.style.padding = '5px';
                    return div;
                },

                onRemove: function () {
                    // Nothing to do here
                }
            });
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
                console.log("Dark");
                return dark;
            } else {
                console.log("Light");
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
                this.windControl = new L.Control.WindControl({
                    position: 'bottomright',
                    data_time: response.data[0].recorded_time.replace(".000Z", ""),
                    updated_time: response.data[0].header.refTime.replace(".000Z", "")
                });
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
                console.log(event);
                if (this.windLayer) {
                    this.windLayer = false;
                    this.buildWindLayer(event.name, true);
                }
            });
        },
        loadData: function () {
            sensorData.getSensors().then(response => {
                response.data.forEach(s => {
                    sensorData.getSensorData(s).then(sensorResponse => {
                        sensorResponse.data.id = s;
                        this.sensors.push(sensorResponse.data[0]);
                        this.renderSensor(sensorResponse.data[0]);
                    });
                });
            });
        },

        // single click pop up information
        renderSensor: function (sensor) {
            let PopupString = "<div style='font-size:14px'><div style='text-align:center; font-weight:bold'>" + "Current Sensor Data </div><br>";
            if (!isNaN(parseFloat(sensor.pm1)) && parseFloat(sensor.pm1) !== 0)
                PopupString += "<li>PM1: " + parseFloat(sensor.pm1).toFixed(2) + " Micrograms Per Cubic Meter</li><br>";
            if (!isNaN(parseFloat(sensor.pm2_5)) && parseFloat(sensor.pm2_5) !== 0)
                PopupString += "<li>PM2.5: " + parseFloat(sensor.pm2_5).toFixed(2) + " Micrograms Per Cubic Meter</li><br>";
            if (!isNaN(parseFloat(sensor.pm4)) && parseFloat(sensor.pm4) !== 0)
                PopupString += "<li>PM4: " + parseFloat(sensor.pm4).toFixed(2) + " Micrograms Per Cubic Meter</li><br>";
            if (!isNaN(parseFloat(sensor.pm10)) && parseFloat(sensor.pm10) !== 0)
                PopupString += "<li>PM10: " + parseFloat(sensor.pm10).toFixed(2) + " Micrograms Per Cubic Meter</li><br>";
            if (!isNaN(parseFloat(sensor.temperature)) && parseFloat(sensor.temperature) !== 0)
                PopupString += "<li>Temperature: " + parseFloat(sensor.temperature).toFixed(2) + " Celcius</li><br>";
            if (!isNaN(parseFloat(sensor.humidity)) && parseFloat(sensor.humidity) !== 0)
                PopupString += "<li>Humidity: " + parseFloat(sensor.humidity).toFixed(2) + "%</li><br>";
            if (!isNaN(parseFloat(sensor.dewpoint)) && parseFloat(sensor.dewpoint) !== 0)
                PopupString += "<li>DewPoint: " + parseFloat(sensor.dewpoint).toFixed(2) + "%</li></div><br>"
            if (!isNaN(parseFloat(sensor.timestamp)))
                PopupString += "<div style='text-align:right; font-size: 11px'>Last Updated: " + sensor.timestamp + " UTC</div>";

            sensor.marker = L.circleMarker([sensor.latitude, sensor.longitude], {
                fillColor: this.getMarkerColor(sensor),
                fillOpacity: 0.8,
                color: "#38b5e6"
            });

            //handles click event for single click events
            sensor.marker.addTo(this.sensorGroup);
            sensor.marker.on('click', () => {
                this.selectedSensor = sensor;
            }).bindPopup(PopupString);
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
        getMarkerColor(sensor) {
            var PM = Number(sensor[this.pmType]);
            if (PM >= 0 && PM <= 25) return "#ffff66";
            else if (PM > 25 && PM <= 50) return "#ff6600";
            else if (PM > 50 && PM <= 100) return "#cc0000";
            else if (PM > 100 && PM <= 150) return "#990099";
            else if (PM > 150) return "#732626";
        }
    }
};