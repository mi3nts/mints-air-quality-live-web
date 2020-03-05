import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import vuetify from './plugins/vuetify';
import axios from "axios";
import 'leaflet-velocity/dist/leaflet-velocity';
import 'leaflet-velocity/dist/leaflet-velocity.css';

Vue.config.productionTip = false
Vue.prototype.$axios = axios;

new Vue({
  router,
  vuetify,
  render: h => h(App)
}).$mount('#app')
