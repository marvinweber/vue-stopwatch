<template>
  <v-app>
    <v-toolbar app>
      <v-toolbar-title class="headline text-uppercase">
        <span>Stopwatch <v-icon>timer</v-icon></span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn
              flat
              target="_blank"
              @click="openHelp"
      >
        <v-icon>help</v-icon>
      </v-btn>
      <v-btn
              flat
              target="_blank"
              @click="openSettings"
      >
        <v-icon>settings</v-icon>
      </v-btn>
      <v-btn
        flat
        href="https://github.com/weberonede/vue-stopwatch"
        target="_blank"
      >
        <v-icon>code</v-icon>
      </v-btn>
    </v-toolbar>

    <v-content>
      <Stopwatch ref="stopwatch"/>
    </v-content>
  </v-app>
</template>

<script>
import Stopwatch from './components/Stopwatch'

export default {
  name: 'App',
  components: {
    Stopwatch
  },
  data () {
    return {
      //
    }
  },
  methods: {
    openSettings() {
      this.$refs.stopwatch.openSettingsDialog();
    },
    openHelp() {
      this.$refs.stopwatch.openHelpDialog();
    }
  }
}
</script>
