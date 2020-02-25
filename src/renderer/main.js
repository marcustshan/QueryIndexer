import Vue from 'vue'

import App from './App'
import router from './router'
import store from './store'

import moment from 'vue-moment'
import VueLodash from 'vue-lodash'
import { ipcRenderer } from 'electron'

Vue.use(require('vue-moment'))
const options = { name: 'lodash' }
Vue.use(VueLodash, options)

require('./assets/css/reset.css')
require('./assets/css/common.css')
// require('./assets/css/themes/a11y-dark.css')

const oracledb = require('oracledb')
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.config.productionTip = false

Vue.prototype.oracle = oracledb
Vue.prototype.alert = (msg) => { alert(msg, 'Query Indexer') }

let connection = ipcRenderer.sendSync('get_connection')
if (connection && Object.keys(connection).length > 0) {
  store.dispatch('setHost', connection.host)
  store.dispatch('setServiceName', connection.serviceName)
  store.dispatch('setUser', connection.user)
  store.dispatch('setPassword', connection.password)
  store.dispatch('setRememberConnection', connection.rememberConnection)
}

/* eslint-disable no-new */
window.rootVm = new Vue({
  components: { App },
  router,
  moment,
  store,
  template: '<App/>'
}).$mount('#app')
