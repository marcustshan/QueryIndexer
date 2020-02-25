/* eslint-disable space-before-function-paren */
/* eslint-disable no-unused-vars */
/* eslint-disable no-unused-expressions */

const state = {
  showWholeDim: false,
  showLoading: false
}

const actions = {
  setShowWholeDim(context, value) {
    context.commit('setShowWholeDim', value)
  },
  setShowLoading(context, value) {
    context.commit('setShowLoading', value)
  }
}

const mutations = {
  setShowWholeDim(state, value) {
    state.showWholeDim = value
  },
  setShowLoading(state, value) {
    state.showLoading = value
  }
}

export default {
  state,
  actions,
  mutations
}
