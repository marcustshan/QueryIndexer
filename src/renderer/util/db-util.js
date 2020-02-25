const dbUtil = {}

dbUtil.setConnection = async function (connectionObj) {
  window.rootVm.$store.dispatch('setShowLoading', true)
  let connection
  const returnResult = {
    status: 'ERROR'
  }

  try {
    connection = await window.rootVm.oracle.getConnection(window.rootVm.$store.getters.connectionObj)

    returnResult.status = 'OK'
    returnResult.connection = connection
    return returnResult
  } catch (err) {
    returnResult.error = err
    return returnResult
  } finally {
    connection.close()
    window.rootVm.$store.dispatch('setShowLoading', false)
  }
}

dbUtil.executeQuery = async function (queryString, params) {
  window.rootVm.$store.dispatch('setShowLoading', true)
  let connection
  let result

  try {
    connection = await window.rootVm.oracle.getConnection(window.rootVm.$store.getters.connectionObj)

    if (params && Object.keys(params) > 0) {
      result = await connection.execute(queryString, params)
    } else {
      result = await connection.execute(queryString)
    }
    result.status = 'OK'
    return result
  } catch (err) {
    console.error(err)
    result.status = 'ERROR'
    result.error = err
    return result
  } finally {
    if (connection) {
      try {
        await connection.close()
      } catch (err) {
        console.error(err)
      }
    }

    window.rootVm.$store.dispatch('setShowLoading', false)
  }
}

export { dbUtil }
