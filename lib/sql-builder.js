const sqlQuery = require('./query')
const util = require('./util')

class SqlQueryBuilder {
  /**
   * @param {{preparedStatement?: boolean, convertColumnsToCamelCase?: boolean}} options 
   */
  constructor(options = {}) {
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
    this.whereString = ''
    this.whereKeyword = false
    this.setOptions(options)
  }
  /**
   * @param {{preparedStatement?: boolean, convertColumnsToCamelCase?: boolean}} options
   * @return {SqlQueryBuilder} 
   */
  setOptions(options) {
    if (!(Object.keys(options).length > 0)) return this
    for (const key of Object.keys(options)) {
      this[key] = options[key]
    }
    return this
  }
  /**
   * @param {string?} select 
   * @param {boolean} convertColumnsToCamelCase
   * @return {SqlQueryBuilder} 
   */
  select(select = '*', convertColumnsToCamelCase = this.convertColumnsToCamelCase) {
    if (select !== '*' && convertColumnsToCamelCase) {
      select = util.getAliases(select);
    }
    this.selectStatement = sqlQuery.select(select)
    return this
  }
  /**
   * @param {string} table 
   * @return {SqlQueryBuilder} 
   */
  from(table) {
    this.table = sqlQuery.from(table)
    return this
  }
  /**
   * @param {string} key column name
   * @param {string|number} value 
   * @param {string?} type type of join INNER/FULL/OUTER/LEFT/RIGHT
   * @return {SqlQueryBuilder}
   */
  join(key, value, type) {
    this.isJoin = true
    this.joinType = type
    this.joinStatement[key] = value

    return this
  }
  /**
   * @param {string} key column name
   * @param {string|number} value 
   * @param {string} condition 
   * @return {SqlQueryBuilder}
   */
  where(key, value, condition = '=') {
    this.isWhereCondition = true
    this.whereStatement[key] = {
      value: value,
      operator: this.isOrStatement ? 'OR' : 'AND',
      condition: condition
    }
    if (condition) this.whereCondition = condition
    return this
  }

  /**
   * @param {{[key:string]: string|number}} object
   * @return {SqlQueryBuilder}
   */
  orWhere(object) {
    this.isOrStatement = true
    for (const key of Object.keys(object)) {
      this.where(key, object[key]);
    }
    return this
  }

  /**
   * @param {{[key:string]: string|number}} object
   * @return {SqlQueryBuilder}
   */
  andWhere(object) {
    this.isOrStatement = false
    for (const key of Object.keys(object)) {
      this.where(key, object[key])
    }
    return this
  }
  /**
   * @param {string} key column name
   * @param {string|number} value 
   * @param {string?} condition 
   * @return {SqlQueryBuilder}
   */
  whereLike(key, value, condition) {
    this.isWhereLikeCondition = true
    this.whereLikeStatement[key] = value

    if (condition) this.whereLikeCondition = condition
    return this
  }
  /**
   * @param {string} key column name
   * @param {string|number[]} array array of values
   * @return {SqlQueryBuilder}
   */
  whereIn(key, array) {
    this.isWhereInCondition = true
    this.whereInStatement[key] = array
    return this
  }
  /**
   * @param {string} key column name
   * @param {string|number[]} array array of length 2
   * @param {string?} condition 
   * @return {SqlQueryBuilder}
   */
  whereBetween(key, array, condition) {
    this.isWhereBetweenCondition = true
    if (condition) this.whereLikeCondition = condition
    this.whereBetweenStatement[key] = array

    return this
  }

  _parseJoin() {
    if (!util.isEmpty(this.joinStatement)) {
      return sqlQuery.parseJoin(this.joinStatement, this.joinType)
    }
    return false
  }

  _parseWhere() {
    if (!util.isEmpty(this.whereStatement)) {
      return sqlQuery.parseWhere(this.whereStatement, this.isOrStatement, this.whereCondition, this.preparedStatement)
    }

    return false
  }

  _parseWhereIn() {
    let whereClauseFound = false
    if (this.isWhereCondition) whereClauseFound = true

    if (!util.isEmpty(this.whereInStatement)) {
      return sqlQuery.parseWhereIn(this.whereInStatement, whereClauseFound, this.preparedStatement)
    }

    return false
  }

  _parseWhereLike() {
    let whereClauseFound = false

    if (this.isWhereCondition || this.isWhereInCondition) whereClauseFound = true

    if (!util.isEmpty(this.whereLikeStatement)) {
      return sqlQuery.parseWhereLike(this.whereLikeStatement, this.whereLikeCondition, whereClauseFound, this.preparedStatement)
    }

    return false
  }

  _parseWhereBetween() {
    let whereClauseFound = false

    if (this.isWhereCondition || this.isWhereInCondition || this.isWhereLikeCondition) {
      whereClauseFound = true
    }

    if (!util.isEmpty(this.whereBetweenStatement)) {
      return sqlQuery.parseWhereBetween(this.whereBetweenStatement, whereClauseFound)
    }

    return false
  }

  _parseWhereConditions() {
    let query = ''
    if (this.isWhereCondition) query += ` ${this._parseWhere()}`
    if (this.isWhereInCondition) query += ` ${this._parseWhereIn()}`
    if (this.isWhereLikeCondition) query += ` ${this._parseWhereLike()}`
    if (this.isWhereBetweenCondition) query += ` ${this._parseWhereBetween()}`
    return query
  }

  _onDuplicateKeyUpdate(updates) {
    if (util.isEmpty(updates)) return ''
    let query = " ON DUPLICATE KEY UPDATE "
    const lastUpdate = Object.keys(updates)[Object.keys(updates).length - 1]
    Object.keys(updates).forEach(key => {
      let value = updates[key]
      if (key !== lastUpdate) {
        query += this.preparedStatement ? `${key} = ?, ` : `${key} = "${value}", `
      } else {
        query += this.preparedStatement ? `${key} = ?` : `${key} = "${value}"`
      }
    })
    return query.trim()
  }
  /**
   * @param {string} key column name
   * @return {SqlQueryBuilder}
   */
  groupBy(key) {
    if (key) this.groupByStatement = sqlQuery.groupBy(key)
    return this
  }
  /**
   * @param {string} key column name
   * @param {string} order  ASC/DESC ascending or descending
   * @return {SqlQueryBuilder}
   */
  orderBy(key, order = 'ASC') {
    if (key) this.orderByStatement = sqlQuery.orderBy(key, order)
    return this
  }
  /**
   * @param {number} limit records limit
   * @return {SqlQueryBuilder}
   */
  limit(limit) {
    if (limit) this.limitStatement = sqlQuery.limit(limit)
    return this
  }

  /**
   * @param {number} offset 
   * @return {SqlQueryBuilder}
   */
  offset(offset) {
    if (offset) this.offsetStatement = sqlQuery.offset(offset)
    return this
  }

  /**
   * @param {string} query 
   * @return {string} query string
   */
  queryRaw(query) {
    return query.trim()
  }

  /**
   * @returns {string} query string
   */
  build() {
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

  /**
   * @param {string} table table name
   * @param {{[key: string]: string|number}} data
   * @param {boolean} duplicateKeyUpdate
   * @param {{[key:string]:string|number|null}} updates
   * @return {string} insert query
   */
  insert(table, data, duplicateKeyUpdate = false, updates = null) {
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
      if (key !== last) query += this.preparedStatement ? `?,` : `'${value}',`
      else query += this.preparedStatement ? `?` : `'${value}'`
    })
    query += ')'
    if (duplicateKeyUpdate && updates) query += ` ${this._onDuplicateKeyUpdate(updates)}`
    return query.trim()
  }
  /**
   * @param {string} table table name
   * @param {{[key:string]:string|number}} data
   * @return {string} query 
   */
  update(table, data) {
    let query = ''
    query += `UPDATE ${table} SET ${sqlQuery.update(data, this.preparedStatement)}`
    query += this._parseWhereConditions()
    return query.trim()
  }

  /**
   * @param {string} table table name
   * @return {string} query 
   */
  delete(table) {
    let query = ''
    query += `DELETE FROM ${table}`
    query += this._parseWhereConditions()
    return query.trim()
  }
}

module.exports = SqlQueryBuilder