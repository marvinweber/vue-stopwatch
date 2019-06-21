import Vue from 'vue'
import 'material-design-icons/iconfont/material-icons.css'
import './plugins/vuetify'
import App from './App.vue'
import 'typeface-roboto'

// Vue-Dependencies
Vue.use(require('vue-shortkey'));

Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
}).$mount('#app');
