<template>
  <v-app>
    <v-app-bar app dark color="primary" class="align-center">
      <img class="mr-2" height="50px" src="/img/logo_white.png" />
      <v-toolbar-title class="display-1 mr-10">
        <span>SharedAirDFW</span>
      </v-toolbar-title>
      <!-- <v-btn x-large depressed exact text :to="{name : 'home'}">
        <span class="mr-2">Map</span>
      </v-btn>-->
      <v-btn x-large depressed exact text @click="showPM=true;">
        <span class="mr-2">What is Particulate Matter?</span>
      </v-btn>
      <v-dialog v-model="showPM" max-width="50%">
        <particulate-matter @close="showPM=false;"></particulate-matter>
      </v-dialog>
      <v-spacer></v-spacer>
      <v-btn x-large exact text @click="showAbout=true;">
        <span class="mr-2">About</span>
      </v-btn>
      <v-dialog v-model="showAbout" max-width="50%">
        <about @close="showAbout=false;"></about>
      </v-dialog>
    </v-app-bar>
    <v-content>
      <router-view />
    </v-content>
  </v-app>
</template>

<style>
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
</style>

<script>
import About from "@/components/about";
import ParticulateMatter from "@/components/particulate-matter";
export default {
  name: "App",
  components: {
    About,
    ParticulateMatter
  },
  data: () => ({
    showAbout: false,
    showPM: false
  })
};
</script>
