<template>
  <div id="app">
    <Header />
    <router-view></router-view>
    <div class="whole_dim" v-show="showLoading || showWholeDim"></div>
    <Loading v-show="showLoading" />
  </div>
</template>

<script>
  import Header from './components/Header'
  import Loading from './components/Loading'

  export default {
    name: 'query-indexer',
    computed: {
      showWholeDim () {
        return this.$store.state.common.showWholeDim
      },
      showLoading () {
        return this.$store.state.common.showLoading
      }
    },
    components: {
      Header,
      Loading
    }
  }
</script>

<style scoped>
  div.whole_dim {width: 100%;height: 100%;background-color: #777;opacity: 0.7;z-index: 888;position: absolute;top: 0;left: 0;}
</style>
