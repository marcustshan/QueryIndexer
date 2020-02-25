<template>
  <div class="indexer_container">
    <div class="search_objects_area" v-show="showObjectsArea">
      <div class="search_objects_hide" @click="fnShowHideObjectsArea(false)">◁</div>
      <div class="search_objects_title">
        <h3>Object Search</h3>
      </div>
      <div class="search_objects_container">
        <input class="search_input" type="text" placeholder="object name or table name" @keyup.enter="fnSearchObject()" v-model="searchObjectName" />
        <ul class="search_object_list">
          <li class="search_object_item" :class="object.OBJECT_TYPE === 'TABLE' ? 'table' : ''" v-for="(object, index) in searchObjectList" v-bind:key="index">
            <div class="search_object_icon" :class='fnGetObjectType(object.OBJECT_TYPE)'>{{ fnGetObjectType(object.OBJECT_TYPE) }}</div>
            <div class="search_object_name" v-if="object.OBJECT_TYPE === 'TABLE'" @dblclick="fnGetTableInfo(object.OBJECT_NAME)">
              {{ object.OBJECT_NAME }}<br />{{ object.COMMENTS }}
            </div>
            <div class="search_object_name" v-else @dblclick="fnGetObjectSource(object.OBJECT_NAME)">{{ object.OBJECT_NAME }}</div>
          </li>
        </ul>
      </div>
    </div>
    <div id="codeArea" class="code_area">
      <div class="search_objects_show" v-show="!showObjectsArea" @click="fnShowHideObjectsArea(true)">▷</div>
      <div id="objectListContainer" class="object_list_container">
        <ul class="object_list">
          <li class="object_item" :class="selectedObject.objectName === obj.objectName ? 'selected' : ''" v-for="(obj, index) in objectList" v-bind:key="index">
            <span @click="fnGetObjectSource(obj.objectName)">{{ obj.objectName }}</span>
            <span v-if="obj.indexList"> ({{ obj.indexList.length }})</span>
            <div @click="fnRemoveObject(index)" class="remove_object">X</div>
          </li>
        </ul>
      </div>
      <div class="code_container" id="codeContainer">
        <PrismEditor
          :selectedLine="selectedLine"
          :lineNumbers="true"
          :objectName="selectedObject.objectName"
          :code="code"
          language="sql"
          :lineNumbersClickEvent="fnClickLineNumber"
          ref="editor"
        ></PrismEditor>
      </div>
    </div>
    <div class="indexes_area">
      <div class="indexes_title">
        <h3>Index List</h3>
        <div class="indexes_button_container">
          <button @click="fnImportIndexes">
            Import
          </button>
          <button @click="fnExportIndexes">
            Export
          </button>
        </div>
      </div>
      <div class="indexes_container">
        <ul>
          <li class="index_item" v-for="(objIndex, index) in selectedObject.indexList" v-bind:key="index">
            <div class="line" @click="fnScrollTo(objIndex.line)">{{ objIndex.line }}</div>
            : {{ objIndex.comment }}
          </li>
        </ul>
      </div>
    </div>
    <Comment
      v-if="showComment"
      :closeFunction="fnCloseCommentPopup"
      :saveFunction="fnSaveComment"
      :selectedLineObj="selectedLineObj"
    ></Comment>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import Prism from 'prismjs'
import PrismSql from 'prismjs/components/prism-sql'
import PrismEditor from '../components/Editor'
import Comment from '../components/Comment'
import { dbUtil } from '../util/db-util'

export default {
  name: 'indexer',
  components: {
    Prism,
    PrismSql,
    PrismEditor,
    Comment
  },
  data () {
    return {
      searchObjectList: [],
      objectList: [],
      selectedObject: {},
      code: '',
      indexList: [],
      themes: [],
      selectedTheme: 'prism-tomorrow.css',
      selectedLineObj: {},
      selectedLine: -1,
      showComment: false,
      showObjectsArea: true,
      searchObjectName: ''
    }
  },
  methods: {
    fnRemoveObject (index) {
      if (this.selectedObject.objectName === this.objectList[index].objectName) {
        this.selectedObject = {}
        this.code = ''
      }
      this.objectList.splice(index, 1)
      if (this.objectList && this.objectList.length > 0) {
        this.fnGetObjectSource(this.objectList[0].objectName)
      }
    },
    fnImportIndexes () {
      let workPath = ipcRenderer.sendSync('get_workPath')
      const fs = require('fs')
      const { dialog } = require('electron').remote
      let options = {
        title: 'Import Indexes',
        defaultPath: workPath,
        buttonLabel: 'Import',

        filters: [
          {name: 'json', extensions: ['json']},
          {name: 'All Files', extensions: ['*']}
        ]
      }
      dialog.showOpenDialog(options, (filename) => {
        if (filename && filename.length > 0) {
          let content = fs.readFileSync(filename[0], 'utf-8')
          this.objectList = JSON.parse(content)
          this.selectedObject = this.objectList[0]
          this.code = this.selectedObject.code
        }
      })
    },
    fnExportIndexes () {
      let workPath = ipcRenderer.sendSync('get_workPath')
      const fs = require('fs')
      const { dialog } = require('electron').remote
      let options = {
        title: 'Export Indexes',
        defaultPath: workPath,
        buttonLabel: 'Export',

        filters: [
          {name: 'json', extensions: ['json']},
          {name: 'All Files', extensions: ['*']}
        ]
      }
      dialog.showSaveDialog(options, (filename) => {
        if (filename && filename.length > 0) {
          fs.writeFileSync(filename, JSON.stringify(this.objectList), 'utf-8')
          ipcRenderer.send('set_workPath', filename.substring(0, filename.lastIndexOf('\\')))
        }
      })
    },
    fnGetTableInfo (tableName) {
      let queryString = `
      SELECT LOWER(A.COLUMN_NAME) AS COLUMN_NAME, A.DATA_TYPE, A.DATA_LENGTH, A.DATA_DEFAULT, A.NULLABLE, B.COMMENTS, LENGTH(A.COLUMN_NAME) AS COLUMN_LENGTH,
      CASE WHEN C.CONSTRAINT_TYPE = 'P' THEN 'Y' ELSE 'N' END AS PK_YN
      FROM ALL_TAB_COLUMNS A
      JOIN ALL_COL_COMMENTS B ON A.OWNER = B.OWNER AND A.TABLE_NAME = B.TABLE_NAME AND A.COLUMN_NAME = B.COLUMN_NAME
      LEFT OUTER JOIN (
      SELECT A.OWNER, A.TABLE_NAME, B.COLUMN_NAME, A.CONSTRAINT_NAME, A.CONSTRAINT_TYPE, A.SEARCH_CONDITION
      FROM USER_CONSTRAINTS A, USER_CONS_COLUMNS B
      WHERE A.CONSTRAINT_NAME = B.CONSTRAINT_NAME
      AND A.OWNER = B.OWNER
      AND A.TABLE_NAME = B.TABLE_NAME
      AND A.TABLE_NAME = '${tableName}'
      AND A.CONSTRAINT_TYPE = 'P'
      ) C ON A.OWNER = C.OWNER AND A.TABLE_NAME = C.TABLE_NAME AND A.COLUMN_NAME = C.COLUMN_NAME
      AND A.TABLE_NAME = B.TABLE_NAME
      AND A.COLUMN_NAME = B.COLUMN_NAME
      WHERE A.TABLE_NAME = '${tableName}' ORDER BY A.COLUMN_ID
      `

      dbUtil.executeQuery(queryString).then(result => {
        if (result.status === 'OK') {
          console.log(result)
        }
      }).catch(error => {
        this.alert(error)
      })
    },
    fnGetObjectSource (objectName) {
      if (this.selectedObject.objectName === objectName) {
        return
      }

      let existObject = this._.find(this.objectList, (obj) => {
        return obj.objectName === objectName
      })

      if (existObject) {
        this.selectedObject = existObject
        this.code = this.selectedObject.code
        this.$nextTick(() => {
          document.getElementById('codeContainer').scrollTop = 0
        })

        return
      }

      let newObject = {}
      newObject.objectName = objectName

      let queryString = `
      SELECT TEXT FROM ALL_SOURCE WHERE NAME = '${objectName}'
      `
      let code = ''
      dbUtil.executeQuery(queryString).then(result => {
        if (result.status === 'OK') {
          result.rows.forEach((row) => {
            code += row.TEXT
          })
          this.code = code
          newObject.code = code

          this.selectedObject = JSON.parse(JSON.stringify(newObject))
          this.objectList.push(this.selectedObject)

          this.$nextTick(() => {
            document.getElementById('codeContainer').scrollTop = 0
          })
        }
      }).catch(error => {
        this.alert(error)
      })
    },
    fnGetObjectType (type) {
      return type[0]
    },
    fnSearchObject () {
      let queryString = `
      SELECT * FROM (
      SELECT DISTINCT OBJECT_NAME, OBJECT_TYPE, '' AS COMMENTS
      FROM ALL_PROCEDURES WHERE
      UPPER(OBJECT_NAME) LIKE '%' || UPPER('${this.searchObjectName}') || '%'
      AND OBJECT_TYPE IN ('TABLE', 'PACKAGE', 'PROCEDURE', 'FUNCTION')
      UNION
      SELECT A.TABLE_NAME AS OBJECT_NAME, 'TABLE' AS OBJECT_TYPE, B.COMMENTS
      FROM ALL_TABLES A
      JOIN ALL_TAB_COMMENTS B ON A.OWNER = B.OWNER AND A.TABLE_NAME = B.TABLE_NAME
      WHERE UPPER(A.TABLE_NAME) LIKE '%' || UPPER('${this.searchObjectName}') || '%'
      ) ORDER BY OBJECT_TYPE, OBJECT_NAME
      `
      dbUtil.executeQuery(queryString).then(result => {
        if (result.status === 'OK') {
          this.searchObjectList = []
          this.searchObjectList.push(...result.rows)
        }
      }).catch(error => {
        this.alert(error)
      })
    },
    fnShowHideObjectsArea (show) {
      if (show) {
        document.getElementById('codeArea').style.width = 'calc(100% - 800px)'
        document.getElementById('objectListContainer').style.paddingLeft = '10px'
      } else {
        document.getElementById('codeArea').style.width = 'calc(100% - 400px)'
        document.getElementById('objectListContainer').style.paddingLeft = '45px'
      }
      this.showObjectsArea = show
    },
    fnScrollTo (line) {
      this.selectedLine = line
      let codeContainer = document.getElementById('codeContainer')
      let selectedLineOffetTop = document.getElementById(`${this.selectedObject.objectName}__line${line}`).offsetTop
      codeContainer.scrollTop = selectedLineOffetTop - 60
    },
    fnSaveComment (comment) {
      if (!this.selectedObject.indexList) {
        this.selectedObject.indexList = []
      }
      this.selectedLineObj.comment = comment
      this.selectedObject.indexList.push(this.selectedLineObj)
      this.fnCloseCommentPopup()
    },
    fnCloseCommentPopup () {
      this.$store.dispatch('setShowWholeDim', false)
      this.showComment = false
    },
    fnClickLineNumber (line, lineText) {
      if (!this.code) {
        return
      }
      this.selectedLine = line
      this.$store.dispatch('setShowWholeDim', true)
      this.selectedLineObj = { line, lineText }
      this.showComment = true
    },
    fnGetConnectionInfo () {
      let connection = ipcRenderer.sendSync('get_connection')
      this.host = connection.host
      this.serviceName = connection.serviceName
      this.user = connection.user
      this.password = connection.password
      this.rememberConnection = connection.rememberConnection
    },
    fnSetThemes () {
      this.themes = []
      this.themes.push('default')
      this.themes.push('coy')
      this.themes.push('dark')
      this.themes.push('funky')
      this.themes.push('okaidia')
      this.themes.push('solarizedlight')
      this.themes.push('tomorrow')
      this.themes.push('twilight')
    },
    fnSetCurrentTheme (theme) {
      delete require.cache[`./node_modules/prismjs/themes/${this.selectedTheme}`]
      if (theme === 'default') {
        this.selectedTheme = 'prism.css'
      } else {
        this.selectedTheme = `prism-${theme}.css`
      }
      import(`prismjs/themes/${this.selectedTheme}`)
    }
  },
  mounted () {
    // this.fnGetConnectionInfo()
    this.fnSetThemes()
    import(`prismjs/themes/${this.selectedTheme}`)
  }
}
</script>

<style scoped>
div.indexer_container { height: calc(100% - 60px); }

div.search_objects_area { position: relative; width: 400px; height: 100%; float: left; border-right: 1px solid #ccc; }
div.search_objects_hide { position: absolute; top: 6px; right: 6px; width: 30px; height: 30px; text-align: center; background-color: #fff; border: 1px solid #ccc; border-radius: 5px; cursor: pointer; }
div.search_objects_show { position: absolute; top: 6px; left: 6px; width: 30px; height: 30px; text-align: center; background-color: #fff; border: 1px solid #ccc; border-radius: 5px; cursor: pointer; }
div.search_objects_title { width: 100%; height: 60px; line-height: 60px; padding-left: 15px; border-bottom: 1px solid #ccc; }
div.search_objects_container { width: 100%; height: calc(100% - 60px); }
input.search_input { width: 380px; height: 30px; line-height: 30px; text-indent: 10px; margin: 10px 0 10px 10px; border: 1px solid #ccc; }
ul.search_object_list { height: calc(100% - 70px); overflow-y: auto; }
li.search_object_item { position: relative; padding-left: 35px; width: 100%; height: 40px; line-height: 40px; border-bottom: 1px solid #ccc; }
li.search_object_item.table { line-height: 20px; }
li.search_object_item.table div.search_object_name {font-size: 15px;}
div.search_object_name { cursor: pointer; font-weight: 600; }
div.search_object_icon { position: absolute; top: 8px; left: 5px; text-align: center; width: 24px; height: 24px; line-height: 24px; border-radius: 12px; font-weight: 600; }
div.search_object_icon.T { background-color: yellow; }
div.search_object_icon.F { background-color: hotpink; }
div.search_object_icon.P { background-color: gray; }

div.code_area { position: relative; width: calc(100% - 800px); height: 100%; float: left; border-right: 1px solid #ccc; }
div.object_list_container {width: 100%; height: 60px; overflow-x: auto; overflow-y: hidden; padding: 0 10px;}
ul.object_list {width: max-content; height: 60px;}
li.object_item {position:relative; display: inline-block; width: fit-content; height: 30px; line-height: 30px; background-color: #ccc; padding: 0 28px 0 7px; margin: 5px 0 0 5px; font-weight: 600; cursor: pointer;}
li.object_item:first-child {margin-left: 0}
li.object_item.selected {background-color: #1577bb; color: #f1f1f1; font-weight: 600; cursor: default}
div.remove_object { position: absolute; top: 6px; right: 3px; border-radius: 10px; width: 20px; height: 20px; line-height: 20px; text-align: center; background-color: #d44343; color: #f8f40e; cursor: pointer; font-size: 12px; }

div.indexes_area { width: 400px; height: 100%; float: left; }

div.objects_container { width: 100%; height: 40px; border-bottom: 1px solid #ccc; }
div.code_container { width: 100%; height: calc(100% - 60px); overflow: auto; }

div.indexes_title { position: relative; width: 100%; height: 60px; line-height: 60px; padding-left: 15px; border-bottom: 1px solid #ccc; }
div.indexes_button_container {position: absolute; height: 30px; line-height: 30px; top: 10px; right: 5px;}
div.indexes_container {width: 100%; height: calc(100% - 60px);}
li.index_item { padding: 10px; border-bottom: 1px solid #ccc; }
div.line { display: inline-block; width: 50px; padding: 0 5px; cursor: pointer; text-align: center; background-color: #210041; color: #f1f1f1; font-weight: 600; }
</style>
