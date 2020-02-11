import Vue from 'vue'

import App from './App'
import router from './router'
import store from './store'

import moment from 'vue-moment'

Vue.use(require('vue-moment'))

require('./assets/css/reset.css')
require('./assets/css/common.css')
// require('./assets/css/themes/a11y-dark.css')

const oracledb = require('oracledb')

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.config.productionTip = false

Vue.prototype.oracle = oracledb

/* eslint-disable no-new */
window.rootVm = new Vue({
  components: { App },
  router,
  moment,
  store,
  template: '<App/>'
}).$mount('#app')
