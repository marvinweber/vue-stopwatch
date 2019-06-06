<template>
  <v-container>
    <v-layout
            text-xs-center
            wrap
            grow
            xs12
    >
      <v-flex xs12>
        <v-img
          :src="require('../assets/timer-icon.svg')"
          class="my-3"
          contain
          height="100"
        ></v-img>
      </v-flex>

      <!-- Stopwatch Section -->
      <v-flex mb-4>
        <h1 class="display-3 font-weight-bold mb-3" v-html="formatTime(lapsedMilliseconds)"></h1>

        <v-btn v-if="state === 'reset'" @click="start" color="success" v-shortkey="['s']" @shortkey="start">Start</v-btn>

        <v-btn v-if="state === 'paused'" @click="resume" color="blue" v-shortkey="['s']" @shortkey="resume">Resume</v-btn>
        <v-btn v-if="state === 'started'" @click="pause" v-shortkey="['s']" @shortkey="pause">Stop</v-btn>

        <v-btn v-if="state === 'started'" @click="saveInterval" color="primary" v-shortkey="{1: ['i'], 2: ['space']}" @shortkey="saveInterval">Save Interval</v-btn>

        <v-btn v-if="state === 'paused'" @click="reset" color="warning" v-shortkey="['ctrl', 'r']" @shortkey="reset">Reset</v-btn>

        <v-btn v-if="stopwatchIntervals.length > 0 && state !== 'started'" @click="csvExport(stopwatchIntervals)" color="success">
          Export Intervals to CSV
        </v-btn>
      </v-flex>

      <!-- Interval Section -->
      <v-flex v-if="stopwatchIntervals.length > 0" xs12>
        <h2 class="headline font-weight-bold mb-3">Intervals</h2>
        <v-layout justify-center>
          <template>
            <v-data-table
                    :headers="stopwatchIntervalHeaders"
                    :items="stopwatchIntervals"
                    class="elevation-1"
            >
              <template v-slot:items="props">
                <td class="text-xs-left">{{ props.item.id }}</td>
                <td class="text-xs-left">{{ formatTime(props.item.interval) }}</td>
                <td class="text-xs-left"><v-text-field v-model="props.item.note" @change="storeInstance" height="20"></v-text-field></td>
                <td class="justify-center layout px-0"><v-icon @click="removeInterval(props.item)">delete</v-icon></td>
              </template>
            </v-data-table>
          </template>
        </v-layout>
      </v-flex>

      <!-- Settings Dialog -->
      <v-dialog v-model="settingsDialog" persistent max-width="600px">
        <v-card>
          <v-card-title>
            <span class="headline">Stopwatch Settings</span>
            <v-spacer></v-spacer>
            <v-btn @click="settingsDialog = false" flat icon><v-icon>close</v-icon></v-btn>
          </v-card-title>
          <v-card-text>
            <v-container grid-list-md>
              <v-layout wrap>
                <v-flex xs12 sm6>
                  <v-select
                          :items="[',', ';', ':', '.']"
                          label="Milliseconds Separator"
                          v-model="millisecondsSeparator"
                          required
                  ></v-select>
                </v-flex>
                <v-flex xs12 sm6>
                  <v-select
                          :items="[0, 1, 2, 3]"
                          label="Milliseconds Digit amount"
                          v-model="millisecondsDigitAmount"
                          required
                  ></v-select>
                </v-flex>
                <v-flex xs12>
                  <v-text-field label="CSV-Export File Name" v-model="csvExportFileName" required></v-text-field>
                </v-flex>
                <v-flex xs12>
                  <h3>CSV-Export Column Order / Select Columns</h3>
                  <div class="text-xs-center">
                    <span v-for="(column, index) in csvExportColumnOrder" :key="column.column">
                      <v-chip :color="column.render === true ? 'green' : 'lightgrey'" @click="column.render = !column.render">{{ column.heading }}</v-chip>
                      <v-btn v-if="index < csvExportColumnOrder.length - 1" @click="swapArray(csvExportColumnOrder, index, index + 1)" flat icon><v-icon>swap_horiz</v-icon></v-btn>
                    </span>
                  </div>
                  <small>Change the order and select which columns should be exported to the CSV-file (click on column-name to enable/ disable).</small>
                </v-flex>
                <v-flex xs12>
                  <v-switch
                        v-model="autoSaveState"
                        label="Autosave when Stopwatch is running"
                        class="mb-0"
                  ></v-switch>
                  <small>Save started time and intervals in the local storage (stopwatch can be restored, when the browser unexpectedly closed)</small>
                </v-flex>
                <h3 class="mt-4">Update interval of the displayed Stopwatch</h3>
                <v-flex xs9>
                  <v-slider v-model="intervalUpdateTime" :min="1" :max="100"></v-slider>
                </v-flex>
                <v-flex xs3>
                  <v-text-field v-model="intervalUpdateTime" type="number" :min="1" :max="100"></v-text-field>
                </v-flex>
                <small>
                  That only affects the refresh-time of the displayed time.
                  It does <strong>not</strong> affect the accuracy of the stopwatch itself.
                </small>
              </v-layout>
            </v-container>
          </v-card-text>
          <v-card-actions>
            <v-btn color="error" flat @click="deleteStoredSettings">Delete stored settings</v-btn>
            <v-spacer></v-spacer>
            <v-btn color="blue darken-1" @click="saveSettings">Save</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Help-Dialog -->
      <v-dialog v-model="helpDialog" max-width="600px">
        <v-card>
          <v-card-title>
            <span class="headline">Stopwatch Help</span>
            <v-spacer></v-spacer>
            <v-btn @click="helpDialog = false" icon><v-icon>close</v-icon></v-btn>
          </v-card-title>
          <v-card-text>
            <v-container grid-list-md>
              <v-layout wrap>
                <v-flex xs12>
                  <h3>Keyboard Shortcuts</h3>
                  Start / Stop / Resume: <v-chip>s</v-chip><br />
                  Add interval: <v-chip>i</v-chip> or <v-chip>space</v-chip><br />
                  Reset: <v-chip>ctrl + r</v-chip>
                </v-flex>
              </v-layout>
            </v-container>
          </v-card-text>
        </v-card>
      </v-dialog>

      <!-- Settings deleted snackbar -->
      <v-snackbar v-model="settingsDeletedSnackbar" bottom :timeout="20000">
        Settings deleted! Default settings will be applied on page-reload...
        <v-btn color="blue" flat @click="settingsDeletedSnackbar = false">
          Close
        </v-btn>
      </v-snackbar>

      <!-- Stored Instance Detected Dialog -->
      <v-dialog v-model="storedInstanceDetectedModal" persistent max-width="290">
        <v-card>
          <v-card-title class="headline">Stored instance detected!</v-card-title>
          <v-card-text>There is a running instance of the stopwatch saved in your browser's local storage.<br/>Should that be restored?</v-card-text>
          <v-card-actions>
            <v-btn color="red darken-1" flat @click="discardStoredInstance">No</v-btn>
            <v-spacer></v-spacer>
            <v-btn color="green darken-1" flat @click="restoreStoredInstance">Yes!</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-layout>
  </v-container>
</template>

<script>
  const CSV_SEPARATOR = ';';

  export default {
    data: () => ({
      // general stopwatch stuff
      state: 'reset',
      startTime: Date.now(),
      currentTime: Date.now(),
      interval: null,
      intervalUpdateTime: 10,
      pauses: [],
      pausedTime: 0,

      // stopwatch interval
      stopwatchIntervals: [],
      intervalKeyCounter: 1,
      stopwatchIntervalHeaders: [
        { text: '#', value: 'id' },
        { text: 'Time since start', value: 'interval' },
        { text: 'Note', value: 'note' },
        { text: 'Actions', value: 'id', sortable: false }
      ],

      // settings
      millisecondsDigitAmount: 1,
      millisecondsSeparator: ':',
      csvExportFileName: 'export',
      csvExportColumnOrder: [
        { column: 'id', heading: 'Interval ID', render: true },
        { column: 'interval', heading: 'Interval', render: true },
        { column: 'note', heading: 'Note', render: true }
      ],
      autoSaveState: true,

      // dialog and modal
      settingsDialog: false,
      helpDialog: false,
      storedInstanceDetectedModal: false,
      settingsDeletedSnackbar: false
    }),
    mounted() {
      this.loadSettings();
      this.checkForInstance();
    },
    destroyed() {
      this.stopUpdateInterval();
    },
    computed: {
      lapsedMilliseconds() {
        return this.currentTime - this.startTime - this.pausedTime;
      }
    },
    methods: {
      formatTime(lapsed) {
        if (lapsed === undefined || lapsed === null) {
          lapsed = this.lapsedMilliseconds;
        }

        let time = this.formatHours(lapsed) +
                ':' + this.formatMinutes(lapsed) +
                ':' + this.formatSeconds(lapsed);
        if (this.millisecondsDigitAmount > 0) {
          time += this.millisecondsSeparator +
                  this.formatMilliseconds(lapsed).substring(0, this.millisecondsDigitAmount);
        }

        return time;
      },
      formatHours(lapsed) {
        const hrs = Math.floor((lapsed / 1000 / 60 / 60));
        return hrs >= 10 ? hrs : '0' + hrs;
      },
      formatMinutes(lapsed) {
        const min = Math.floor((lapsed / 1000 / 60) % 60);
        return min >= 10 ? min : '0' + min;
      },
      formatSeconds(lapsed) {
        const sec = Math.floor((lapsed / 1000) % 60);
        return sec >= 10 ? sec : '0' + sec;
      },
      formatMilliseconds(lapsed) {
        const mil = Math.ceil(lapsed % 1000);

        if (mil < 10) {
          return '00' + mil;
        } else if (mil < 100) {
          return '0' + mil;
        } else {
          return '' + mil;
        }
      },

      start() {
        this.startTime = Date.now();
        this.state = 'started';
        this.startUpdateInterval();

        this.storeInstance();
      },
      reset: function() {
        this.stopUpdateInterval();

        this.state = "reset";
        this.startTime = Date.now();
        this.currentTime = Date.now();
        this.stopwatchIntervals = [];
        this.intervalKeyCounter = 1;
        this.pauses = [];
        this.pausedTime = 0;

        this.discardStoredInstance();
      },
      pause: function() {
        this.stopUpdateInterval();
        this.state = "paused";

        this.pauses.push({
          pauseStart: Date.now(),
          pauseEnd: null,
          pauseLength: null
        });

        this.storeInstance();
      },
      resume: function() {
        const end = Date.now();
        const start = this.pauses[this.pauses.length - 1].pauseStart;
        const length = end - start;

        this.pausedTime += length;
        this.pauses[this.pauses.length - 1].pauseEnd = end;
        this.pauses[this.pauses.length - 1].pauseLength = length;
        this.state = "started";

        this.startUpdateInterval();
        this.storeInstance();
      },

      updateCurrentTime() {
        this.currentTime = Date.now();
      },
      /** Start updating of current time */
      startUpdateInterval() {
        this.interval = setInterval(this.updateCurrentTime, this.intervalUpdateTime);
      },
      /** Stop updating of current time */
      stopUpdateInterval() {
        clearInterval(this.interval);
      },

      /** Save new interval (with current time) */
      saveInterval() {
        let interval = this.lapsedMilliseconds;
        this.stopwatchIntervals.push({
          id: this.intervalKeyCounter,
          interval: interval,
          note: ''
        });
        this.intervalKeyCounter++;

        this.storeInstance();
      },
      /** Remove specific interval from intervals */
      removeInterval(element) {
        const index = this.stopwatchIntervals.indexOf(element);
        this.stopwatchIntervals.splice(index, 1);

        this.storeInstance();
      },

      /**
       * Export current state (intervals) to a csv-file and download the file.
       */
      csvExport() {
        let csvContent = "data:text/csv;charset=utf-8,";

        // Headers
        let headers = [];
        for (const [key, column] of Object.entries(this.csvExportColumnOrder)) {
          if (column.render) {
            headers.push(column.heading);
          }
        }
        const headersRow = headers.join(CSV_SEPARATOR);
        csvContent += headersRow + '\n';

        // Body / Entries
        for (const [key, value] of Object.entries(this.stopwatchIntervals)) {
          let cells = [];
          for (const [key, column] of Object.entries(this.csvExportColumnOrder)) {
            if (column.render) {
              // Special case to catch the interval that has to be rendered
              // todo add renderer for that -> outsource from this for
              if (column.column === 'interval') {
                cells.push(this.formatTime(value[column.column]));
              } else {
                cells.push(value[column.column]);
              }
            }
          }
          csvContent += cells.join(CSV_SEPARATOR) + '\n';
        }

        // CSV-"Security"
        csvContent.replace(/(^\[)|(\]$)/gm, "");

        // Creating file and download
        const data = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", data);
        link.setAttribute("download", this.csvExportFileName + '.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },

      openHelpDialog() {
        this.helpDialog = true;
      },
      openSettingsDialog() {
        this.settingsDialog = true;
      },

      /** Save current settings-state to the local storage */
      saveSettings() {
        localStorage.setItem('settings', JSON.stringify({
          millisecondsDigitAmount: this.millisecondsDigitAmount,
          csvExportFileName: this.csvExportFileName,
          millisecondsSeparator: this.millisecondsSeparator,
          autoSaveState: this.autoSaveState,
          csvExportColumnOrder: this.csvExportColumnOrder,
          intervalUpdateTime: this.intervalUpdateTime
        }));
        this.settingsDialog = false;
      },
      /** Load current settings state from the local storage */
      loadSettings() {
        // Check, if settings have been saved in Local Storage
        let settings = localStorage.getItem('settings');
        if (settings === null || settings === undefined) {
          return;
        }
        settings = JSON.parse(settings);

        this.csvExportFileName = settings.csvExportFileName;
        this.millisecondsDigitAmount = settings.millisecondsDigitAmount;
        this.millisecondsSeparator = settings.millisecondsSeparator !== undefined ? settings.millisecondsSeparator : this.millisecondsSeparator;
        this.autoSaveState = settings.autoSaveState !== undefined ? settings.autoSaveState : this.autoSaveState;
        this.csvExportColumnOrder = settings.csvExportColumnOrder !== undefined ? settings.csvExportColumnOrder : this.csvExportColumnOrder;
        this.intervalUpdateTime = settings.intervalUpdateTime !== undefined ? settings.intervalUpdateTime : this.intervalUpdateTime;
      },
      deleteStoredSettings() {
        localStorage.removeItem('settings');
        this.settingsDialog = false;
        this.settingsDeletedSnackbar = true;
      },

      /**
       * Store the current state of the instance.
       */
      storeInstance() {
        if (!this.autoSaveState) {
          this.discardStoredInstance();
          return;
        }

        localStorage.setItem('instance-intervals', JSON.stringify(this.stopwatchIntervals));
        localStorage.setItem('instance-intervalKeyCounter', this.intervalKeyCounter);
        localStorage.setItem('instance-startTime', this.startTime);
        localStorage.setItem('instance-pauses', JSON.stringify(this.pauses));
        localStorage.setItem('instance-pausedTime', this.pausedTime);
        localStorage.setItem('instance-state', this.state);
      },
      /**
       * Check whether an instance had been started but not reset manually, that is usually the
       * case when the browser/ system crashes or the user accidentally closed the browser (tab).
       */
      checkForInstance() {
        if (localStorage.getItem('instance-startTime') !== null) {
          this.storedInstanceDetectedModal = true;
        }
      },
      /**
       * Restore the stored instance and start the stopwatch with the old parameters again.
       */
      restoreStoredInstance() {
        const instance = localStorage.getItem('instance-startTime');
        const intervals = localStorage.getItem('instance-intervals');
        const intervalKeyCounter = localStorage.getItem('instance-intervalKeyCounter');
        const pauses = localStorage.getItem('instance-pauses');
        const pausedTime = localStorage.getItem('instance-pausedTime');
        const state = localStorage.getItem('instance-state');

        if (instance !== null) {
          this.startTime = instance;
          this.pausedTime = parseInt(pausedTime);

          if (intervals !== null && intervals !== undefined) {
            this.stopwatchIntervals = JSON.parse(intervals);
            this.intervalKeyCounter = intervalKeyCounter;
          }
          if (pauses !== null && pauses !== undefined) {
            this.pauses = JSON.parse(pauses);
          }

          this.state = state;
          if (this.state === 'started') {
            this.startUpdateInterval();
          } else if (this.state === 'paused') {
            this.currentTime = this.pauses[this.pauses.length - 1].pauseStart;
          }
        }

        this.storedInstanceDetectedModal = false;
      },
      /**
       * Delete the stored instance.
       */
      discardStoredInstance() {
        localStorage.removeItem('instance-startTime');
        localStorage.removeItem('instance-intervals');
        localStorage.removeItem('instance-intervalKeyCounter');
        localStorage.removeItem('instance-pausedTime');
        localStorage.removeItem('instance-pauses');
        localStorage.removeItem('instance-state');
        this.storedInstanceDetectedModal = false;
      },

      /**
       * Swap two elements in an array.
       * (Helper function)
       */
      swapArray(array, l, m) {
        let a = array[l];
        let b = array[m];

        // Use Vue.set() to prevent re-loading/ binding problems in v-for
        this.$set(array, l, b);
        this.$set(array, m, a);
      }
    }
  }
</script>

<style>

</style>
