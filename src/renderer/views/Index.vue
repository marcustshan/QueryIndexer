<template>
  <div>
    <div class="connection_container">
      <div class="connection_form">
        <h1>Query Indexer</h1>
        <div class="form_item">
          <label class="bold" for="host">Host : </label>
          <input class="form_input" type="text" id="host" placeholder="host : port" v-model="host" @keyup.enter="fnFocusElement('serviceName')" />
        </div>
        <div class="form_item">
          <label class="bold" for="serviceName">Service Name : </label>
          <input class="form_input" type="text" id="serviceName" placeholder="Service Name" v-model="serviceName" @keyup.enter="fnFocusElement('user')" />
        </div>
        <div class="form_item">
          <label class="bold" for="user">User : </label>
          <input class="form_input" type="text" id="user" placeholder="User" v-model="user" @keyup.enter="fnFocusElement('password')" />
        </div>
        <div class="form_item">
          <label class="bold" for="password">Password : </label>
          <input class="form_input" type="password" id="password" placeholder="Password" v-model="password" />
        </div>
        <div class="form_item checkbox">
          <label class="bold" for="rememberInfo">Remember : </label>
          <input class="form_input" type="checkbox" true-value="Y" false-value="N" id="rememberInfo" v-model="rememberConnection" />
        </div>
        <div class="form_item">
          <button @click="fnConnect">
            Connect
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import { ipcRenderer } from 'electron'
  import { dbUtil } from '../util/db-util'

  export default {
    name: 'index',
    data () {
      return {
        host: '',
        serviceName: '',
        user: '',
        password: '',
        rememberConnection: '',
        connection: {}
      }
    },
    methods: {
      fnFocusElement (elementID) {
        document.getElementById(elementID).focus()
      },
      fnConnect () {
        this.$store.dispatch('setHost', this.host)
        this.$store.dispatch('setServiceName', this.serviceName)
        this.$store.dispatch('setUser', this.user)
        this.$store.dispatch('setPassword', this.password)
        this.$store.dispatch('setRememberConnection', this.rememberConnection)
  
        if (this.rememberConnection === 'Y') {
          ipcRenderer.send('set_connection', {
            host: this.host,
            serviceName: this.serviceName,
            user: this.user,
            password: this.password,
            rememberConnection: this.rememberConnection
          })
        } else {
          ipcRenderer.send('set_connection', {
            host: '',
            serviceName: '',
            user: '',
            password: '',
            rememberConnection: this.rememberConnection
          })
        }
  
        dbUtil.setConnection(this.$store.getters.connectionObj).then(result => {
          if (result.status === 'OK') {
            this.$store.dispatch('setPool', result.pool)
            this.$router.push('/indexer')
          } else {
            this.alert(result.error)
          }
        }).catch(error => {
          this.alert(error)
        })
      },
      fnGetConnectionInfo () {
        let connection = ipcRenderer.sendSync('get_connection')
        if (connection && Object.keys(connection).length > 0) {
          this.host = connection.host
          this.serviceName = connection.serviceName
          this.user = connection.user
          this.password = connection.password
          this.rememberConnection = connection.rememberConnection
        }
      }
    },
    mounted () {
      this.fnGetConnectionInfo()
    }
  }
</script>

<style scoped>
  div.connection_container { width: 600px; height: 400px; border: 1px solid #ccc; border-radius: 10px; background-color: #f9f9f9; position: absolute; top: 0; left: 0; right: 0; bottom: 0; margin: auto; }
  div.connection_form {width: 100%; height: 100%; padding: 20px; text-align: center;}
  div.form_item {margin-top: 20px;}
  div.form_item.checkbox {text-align: left; margin-left: 67px;}
  label {display: inline-block; width: 110px; height: 30px; line-height: 30px; text-align: right;}
  input[type="text"].form_input, input[type="password"].form_input {display: inline-block; width: 300px; height: 30px; line-height: 30px; text-indent: 10px; margin-left: 10px; border: 1px solid #ccc;}
  input[type="checkbox"] { margin-left: 10px; display: inline-block; width: 20px; height: 20px; border: 2px solid #bcbcbc; cursor: pointer; margin-top: 5px; }
  input[type="checkbox"]:checked { background-color: #5e6a6f; }
</style>
