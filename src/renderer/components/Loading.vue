<template>
  <div>
    <div class="loading_container" v-show="showLoading">
      <div class="loader"></div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'common-loading',
    computed: {
      showLoading () {
        return this.$store.state.common.showLoading
      }
    }
  }
</script>

<style scoped>
  .loading_container {width: 400px;height: 200px;z-index: 889;position: absolute;top: 0;left: 0;right: 0;bottom: 0;margin: auto; text-align: center;}
  .loader { border: 16px solid #f3f3f3; border-radius: 50%; border-top: 16px solid #3498db; width: 120px; height: 120px; -webkit-animation: spin 2s linear infinite; /* Safari */ animation: spin 2s linear infinite; margin: auto; }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
