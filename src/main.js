import Vue from 'vue'
import './plugins/vuetify'
import App from './App.vue'

// Vue-Dependencies
Vue.use(require('vue-shortkey'));

Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
}).$mount('#app');
