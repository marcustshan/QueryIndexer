import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/index',
      name: 'index',
      component: require('@/views/Index').default
    },
    {
      path: '/indexer',
      name: 'indexer',
      component: require('@/views/Indexer').default
    },
    {
      path: '*',
      redirect: '/index'
    }
  ]
})
