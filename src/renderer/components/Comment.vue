<template>
  <div class="comment_container">
    <h1>Comment</h1>
    <div class="close" @click="closeFunction"></div>
    <div class="editor_container">
    <PrismEditor
      :lineNumbers="false"
      :code="code"
      language="sql"
      ref="editor"
    ></PrismEditor>
    </div>
    <div class="comment_form">
      <div class="form_item">
        <label class="bold" for="comment">Comment : </label>
        <textarea class="form_input" id="comment" placeholder="Comment" v-model="comment" />
      </div>
    </div>
    <div class="button_container">
      <button @click="saveFunction(comment)">
        Save
      </button>
      <button @click="closeFunction()">
        Close
      </button>
    </div>
  </div>
</template>

<script>
  import Prism from 'prismjs'
  import PrismSql from 'prismjs/components/prism-sql'
  import PrismEditor from '../components/Editor'

  export default {
    name: 'comment',
    props: ['selectedLineObj', 'closeFunction', 'saveFunction'],
    components: {
      Prism,
      PrismSql,
      PrismEditor
    },
    data () {
      return {
        comment: '',
        code: ''
      }
    },
    mounted () {
      this.code = `${this.selectedLineObj.line}  ${this.selectedLineObj.lineText}`
      document.getElementById('comment').focus()
    }
  }
</script>

<style scoped>
  div.comment_container {border-radius: 5px; padding: 10px; z-index: 889; width: 80%; height: 500px; border: 1px solid #ccc; background-color: #f9f9f9; position: absolute; top: 0; left: 0; right: 0; bottom: 0; margin: auto;}
  div.comment_container .close { position: absolute; right: 5px; top: 5px; width: 32px; height: 32px; opacity: 0.5; cursor: pointer; }
  div.comment_container .close:hover { opacity: 1; }
  div.comment_container .close:before, .close:after { position: absolute; left: 15px; content: ' '; height: 33px; width: 2px; background-color: #333; }
  div.comment_container .close:before { transform: rotate(45deg); }
  div.comment_container .close:after { transform: rotate(-45deg); }

  div.editor_container {height: 25px;}

  div.connection_form {width: 100%; height: 100%;}
  div.form_item {margin-top: 20px;}
  label {display: inline-block; height: 30px; line-height: 30px;}
  .form_input {display: inline-block; width: 90%; height: 300px; text-indent: 10px; margin-left: 10px; border: 1px solid #ccc;}

  div.button_container {position: absolute; bottom: 25px; text-align: center; width: 100%;}
  div.button_container button:first-child {margin-right: 20px;}
</style>
