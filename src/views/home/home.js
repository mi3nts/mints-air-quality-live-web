import Sensor from "@/components/sensor";
import sensorData from "../../services/sensor-data";

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
            /** Popup controls */
            howToUse: false,
            /** Currently selected PM type */
            pmType: "pm2_5",
            /** Default state of left side expansion panels */
            panels: [1, 1, 0, 0],
            /** All available sensor instances  */
            sensors: []
        }
    },
    watch: {
        'pmType': function () {
            this.refreshIcons()
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
            this.buildWindLayer();
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
        buildWindLayer: function () {
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
                });
                this.windControl = new L.Control.WindControl({
                    position: 'bottomright',
                    data_time: response.data[0].recorded_time.replace(".000Z", ""),
                    updated_time: response.data[0].header.refTime.replace(".000Z", "")
                });
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
        renderSensor: function (sensor) {
            sensor.marker = L.marker([sensor.latitude, sensor.longitude], {
                icon: this.buildMarkerIcon(sensor)
            });
            sensor.marker.addTo(this.map);
            sensor.marker.on('click', () => {
                this.selectedSensor = sensor;
            });
        },
        buildMarkerIcon: function (sensor) {
            /** If you change SCG marker,
             *  you need to fine tune  iconAnchor, iconSize & popupAnchor as well*/
            return L.divIcon({
                className: 'svg-icon',
                html: this.getSVGMarker(this.getMarkerColor(sensor)),
                iconAnchor: [20, 45],
                iconSize: [30, 32],
                popupAnchor: [0, -30]
            })
        },
        refreshIcons() {
            this.sensors.forEach(sensor => {
                sensor.marker.setIcon(this.buildMarkerIcon(sensor));
            });
        },
        getMarkerColor(sensor) {
            var PM = Number(sensor[this.pmType]);
            var PPB = 1*PM;                        
                 if(PPB >= 0    && PPB <=25)   return "#ffff66";
            else if(PPB > 25    && PPB <=50)   return "#ff6600";
            else if(PPB > 50    && PPB <=100)  return "#cc0000";
            else if(PPB > 100   && PPB <=150)  return "#990099";
            else if(PPB > 150)                 return "#732626";
        },
        getSVGMarker(color) {
            var svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="30pt" height="32pt" viewBox="0 0 30 32" version="1.1">
            <g id="surface1">
            <path style="fill-rule:nonzero;fill:${color};fill-opacity:1;stroke-width:1.25;stroke-linecap:round;stroke-linejoin:round;stroke:${color};stroke-opacity:1;stroke-miterlimit:4;" d="M 99.709245 31.002122 C 98.581293 27.183586 96.711674 19.48417 90.716532 19.48417 C 84.72139 19.48417 82.712708 27.168 81.708367 31.002122 L 65.716172 84.726592 C 70.722424 92.410423 110.710639 92.410423 115.624183 84.726592 Z M 99.709245 31.002122 " transform="matrix(0.252809,0,0,0.250628,-7.996443,9.401882)"/>
            <path style="fill-rule:nonzero;fill:${color};fill-opacity:1;stroke-width:5.46;stroke-linecap:round;stroke-linejoin:round;stroke:${color};stroke-opacity:1;stroke-miterlimit:4;" d="M 98.643098 1.482498 C 98.643098 5.628338 95.274694 8.979298 91.133719 8.979298 C 86.992745 8.979298 83.639792 5.628338 83.639792 1.482498 C 83.639792 -2.663342 86.992745 -6.014302 91.133719 -6.014302 C 95.274694 -6.014302 98.643098 -2.663342 98.643098 1.482498 Z M 98.643098 1.482498 " transform="matrix(0.252809,0,0,0.250628,-7.996443,9.401882)"/>
            <path style="fill-rule:evenodd;fill:rgb(100%,100%,100%);fill-opacity:1;stroke-width:6.370155;stroke-linecap:round;stroke-linejoin:miter;stroke:${color};stroke-opacity:1;stroke-miterlimit:4;" d="M 105.920706 -10.175728 C 105.920706 -10.175728 109.999875 -5.998716 109.999875 1.934488 M 105.920706 13.98236 C 105.920706 13.98236 109.999875 9.805349 109.999875 1.872145 " transform="matrix(0.252809,0,0,0.250628,-7.996443,9.401882)"/>
            <path style="fill-rule:evenodd;fill:rgb(100%,100%,100%);fill-opacity:1;stroke-width:6.370155;stroke-linecap:round;stroke-linejoin:miter;stroke:${color};stroke-opacity:1;stroke-miterlimit:4;" d="M 119.811512 -22.254771 C 119.811512 -22.254771 127.954398 -13.916335 127.954398 1.950074 M 119.811512 26.061404 C 119.811512 26.061404 127.954398 17.707381 127.954398 1.856559 " transform="matrix(0.252809,0,0,0.250628,-7.996443,9.401882)"/>
            <path style="fill-rule:evenodd;fill:rgb(100%,100%,100%);fill-opacity:1;stroke-width:6.370155;stroke-linecap:round;stroke-linejoin:miter;stroke:${color};stroke-opacity:1;stroke-miterlimit:4;" d="M 134.953881 -34.333815 C 134.953881 -34.333815 147.175935 -21.818367 147.175935 1.981246 M 134.953881 38.124862 C 134.953881 38.124862 147.175935 25.625 147.175935 1.825387 " transform="matrix(0.252809,0,0,0.250628,-7.996443,9.401882)"/>
            <path style="fill-rule:evenodd;fill:rgb(100%,100%,100%);fill-opacity:1;stroke-width:6.370155;stroke-linecap:round;stroke-linejoin:miter;stroke:${color};stroke-opacity:1;stroke-miterlimit:4;" d="M 75.635969 -10.175728 C 75.635969 -10.175728 71.572251 -5.998716 71.572251 1.934488 M 75.635969 13.98236 C 75.635969 13.98236 71.572251 9.805349 71.572251 1.872145 " transform="matrix(0.252809,0,0,0.250628,-7.996443,9.401882)"/>
            <path style="fill-rule:evenodd;fill:rgb(100%,100%,100%);fill-opacity:1;stroke-width:6.370155;stroke-linecap:round;stroke-linejoin:miter;stroke:${color};stroke-opacity:1;stroke-miterlimit:4;" d="M 62.177802 -22.254771 C 62.177802 -22.254771 54.034916 -13.916335 54.034916 1.950074 M 62.177802 26.061404 C 62.177802 26.061404 54.034916 17.707381 54.034916 1.856559 " transform="matrix(0.252809,0,0,0.250628,-7.996443,9.401882)"/>
            <path style="fill-rule:evenodd;fill:rgb(100%,100%,100%);fill-opacity:1;stroke-width:6.370155;stroke-linecap:round;stroke-linejoin:miter;stroke:${color};stroke-opacity:1;stroke-miterlimit:4;" d="M 47.019982 -34.333815 C 47.019982 -34.333815 34.813378 -21.818367 34.813378 1.981246 M 47.019982 38.124862 C 47.019982 38.124862 34.813378 25.625 34.813378 1.825387 " transform="matrix(0.252809,0,0,0.250628,-7.996443,9.401882)"/>
            </g>`;
            return svg;
        }
    }
};