const sqlQuery = require('./query')
const util = require('./util')

class SqlQueryBuilder {
  constructor (options = {}) {
    // options
    this.preparedStatement = false
    this.convertColumnsToCamelCase = false

    this.table = null
    this.joinType = null
    this.whereCondition = null
    this.whereLikeCondition = null
    this.selectStatement = ''
    this.groupByStatement = ''
    this.orderByStatement = ''
    this.limitStatement = ''
    this.offsetStatement = ''
    this.isJoin = false
    this.isOrStatement = false
    this.isWhereCondition = false
    this.isWhereLikeCondition = false
    this.isWhereInCondition = false
    this.isWhereBetweenCondition = false
    this.joinStatement = {}
    this.whereStatement = {}
    this.whereInStatement = {}
    this.whereLikeStatement = {}
    this.whereBetweenStatement = {}
    this.query = ''

    this.setOptions(options)
  }

  setOptions (options = {}) {
    if (!Object.keys(options).length > 0) return this
    for (const key of Object.keys(options)) {
      this[key] = options[key]
    }
    return this
  }

  select (select, convertColumnsToCamelCase = this.convertColumnsToCamelCase) {
    this.selectStatement =
            convertColumnsToCamelCase ? sqlQuery.select(util.getAliases(select)) : sqlQuery.select(select)
    return this
  }

  from (table) {
    this.table = sqlQuery.from(table)
    return this
  }

  join (key, value, type) {
    this.isJoin = true
    this.joinType = type
    this.joinStatement[key] = value

    return this
  }

  where (key = '', value, condition = '=') {
    this.isWhereCondition = true
    this.whereStatement[key] = value
    if (condition) this.whereCondition = condition
    return this
  }

  orWhere (object) {
    for (const key of Object.keys(object)) {
      this.where(key, object[key])
      this.isOrStatement = true
    }
    return this
  }

  andWhere (object) {
    for (const key of Object.keys(object)) {
      this.where(key, object[key])
    }
    return this
  }

  whereLike (key, value, condition) {
    this.isWhereLikeCondition = true
    this.whereLikeStatement[key] = value

    if (condition) this.whereLikeCondition = condition
    return this
  }

  whereIn (key, array) {
    this.isWhereInCondition = true
    this.whereInStatement[key] = array
    return this
  }

  whereBetween (key, array, condition) {
    this.isWhereBetweenCondition = true
    if (condition) this.whereLikeCondition = condition
    this.whereBetweenStatement[key] = array

    return this
  }

  _parseJoin () {
    if (!util.isEmpty(this.joinStatement)) {
      return sqlQuery.parseJoin(this.joinStatement, this.joinType)
    }
    return false
  }

  _parseWhere () {
    if (!util.isEmpty(this.whereStatement)) {
      return sqlQuery.parseWhere(this.whereStatement, this.isOrStatement, this.whereCondition, this.preparedStatement)
    }

    return false
  }

  _parseWhereIn () {
    let whereClauseFound = false
    if (this.isWhereCondition) whereClauseFound = true

    if (!util.isEmpty(this.whereInStatement)) {
      return sqlQuery.parseWhereIn(this.whereInStatement, whereClauseFound, this.preparedStatement)
    }

    return false
  }

  _parseWhereLike () {
    let whereClauseFound = false

    if (this.isWhereCondition || this.isWhereInCondition) whereClauseFound = true

    if (!util.isEmpty(this.whereLikeStatement)) {
      return sqlQuery.parseWhereLike(this.whereLikeStatement, this.whereLikeCondition, whereClauseFound, this.preparedStatement)
    }

    return false
  }

  _parseWhereBetween () {
    let whereClauseFound = false

    if (this.isWhereCondition || this.isWhereInCondition || this.isWhereLikeCondition) {
      whereClauseFound = true
    }

    if (!util.isEmpty(this.whereBetweenStatement)) {
      return sqlQuery.parseWhereBetween(this.whereBetweenStatement, whereClauseFound)
    }

    return false
  }

  _parseWhereConditions () {
    let query = ''
    if (this.isWhereCondition) query += ` ${this._parseWhere()}`
    if (this.isWhereInCondition) query += ` ${this._parseWhereIn()}`
    if (this.isWhereLikeCondition) query += ` ${this._parseWhereLike()}`
    if (this.isWhereBetweenCondition) query += ` ${this._parseWhereBetween()}`
    return query
  }

  groupBy (key) {
    if (key) this.groupByStatement = sqlQuery.groupBy(key)
    return this
  }

  orderBy (key, order = 'ASC') {
    if (key) this.orderByStatement = sqlQuery.orderBy(key, order)
    return this
  }

  limit (number) {
    if (number) this.limitStatement = sqlQuery.limit(number)
    return this
  }

  offset (number) {
    if (number) this.offsetStatement = sqlQuery.offset(number)
    return this
  }

  queryRaw (query) {
    return query.trim()
  }

  // build final select query
  build () {
    let query = ''

    if (this.selectStatement) query += this.selectStatement

    query += ` ${this.table}`

    if (this.isJoin) query += ` ${this._parseJoin()}`

    query += this._parseWhereConditions()

    if (this.groupByStatement !== '') query += ` ${this.groupByStatement}`

    if (this.orderByStatement !== '') query += ` ${this.orderByStatement}`

    if (this.limitStatement !== '') query += ` ${this.limitStatement}`

    if (this.offsetStatement !== '') query += ` ${this.offsetStatement}`

    query += ';'

    return query.trim()
  }

  insert (table, data) {
    const last = Object.keys(data)[Object.keys(data).length - 1]
    let query = `INSERT INTO ${table} `

    query += '('
    Object.keys(data).forEach(key => {
      if (key !== last) query += `${key},`
      else query += `${key}`
    })
    query += ') VALUES ('

    Object.keys(data).forEach(key => {
      const value = data[key]
      if (key !== last) query += this.preparedStatement ? `${value},` : `'${value}',`
      else query += this.preparedStatement ? `${value}` : `'${value}'`
    })
    query += ')'

    return query.trim()
  }

  update (table, data) {
    let query = ''
    query += `UPDATE ${table} SET ${sqlQuery.update(data, this.preparedStatement)}`
    query += this._parseWhereConditions()
    return query.trim()
  }

  delete (table) {
    let query = ''
    query += `DELETE FROM ${table}`
    query += this._parseWhereConditions()
    return query.trim()
  }
}

module.exports = SqlQueryBuilder
