import Vue from 'vue'

import App from './App'
import router from './router'
import store from './store'

import moment from 'vue-moment'

const hljs = require('highlight.js')
console.log(hljs)

const vueHighlightJS = {}
vueHighlightJS.install = function install (Vue) {
  Vue.directive('highlightjs', {
    deep: true,
    bind: function bind (el, binding) {
      // on first bind, highlight all targets
      var targets = el.querySelectorAll('code')
      var target
      var i

      for (i = 0; i < targets.length; i += 1) {
        target = targets[i]

        if (typeof binding.value === 'string') {
          // if a value is directly assigned to the directive, use this
          // instead of the element content.
          target.textContent = binding.value
        }

        hljs.highlightBlock(target)
        hljs.lineNumbersBlock(target)
      }
    },
    componentUpdated: function componentUpdated (el, binding) {
      // after an update, re-fill the content and then highlight
      var targets = el.querySelectorAll('code')
      var target
      var i

      for (i = 0; i < targets.length; i += 1) {
        target = targets[i]
        if (typeof binding.value === 'string') {
          target.textContent = binding.value
          hljs.highlightBlock(target)
        }
      }
    }
  })
}

Vue.use(vueHighlightJS)
Vue.use(require('vue-moment'))

require('./assets/css/reset.css')
require('./assets/css/common.css')
require('./assets/css/themes/a11y-dark.css')

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
