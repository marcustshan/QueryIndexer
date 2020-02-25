/* eslint-disable space-before-function-paren */
/* eslint-disable no-unused-vars */
/* eslint-disable no-unused-expressions */

const state = {
  host: '',
  serviceName: '',
  user: '',
  password: '',
  rememberConnection: '',
  pool: {}
}

const getters = {
  connectionObj: state => {
    return {
      user: state.user,
      password: state.password,
      connectString: `${state.host}/${state.serviceName}`
    }
  }
}

const actions = {
  setHost(context, value) {
    context.commit('setHost', value)
  },
  setServiceName(context, value) {
    context.commit('setServiceName', value)
  },
  setUser(context, value) {
    context.commit('setUser', value)
  },
  setPassword(context, value) {
    context.commit('setPassword', value)
  },
  setRememberConnection(context, value) {
    context.commit('setRememberConnection', value)
  },
  setPool(context, value) {
    context.commit('setPool', value)
  }
}

const mutations = {
  setHost(state, value) {
    state.host = value
  },
  setServiceName(state, value) {
    state.serviceName = value
  },
  setUser(state, value) {
    state.user = value
  },
  setPassword(state, value) {
    state.password = value
  },
  setRememberConnection(state, value) {
    state.rememberConnection = value
  },
  setPool(state, value) {
    state.pool = value
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
