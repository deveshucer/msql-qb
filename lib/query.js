const select = select => {
  let selectString = select || '*';
  if (typeof select === 'object') selectString = select.join(', ')
  if (typeof select === 'string') selectString = select
  return `SELECT ${selectString}`
}

const from = table => {
  if (table) return `FROM ${table}`
  throw new Error('Table name is required')
}

const parseJoin = (joinObject, type = 'INNER') => {
  if (joinObject === {}) return ''

  const joinStatement = []
  for (const key of Object.keys(joinObject)) {
    const value = joinObject[key]
    joinStatement.push(`${type} JOIN ${key} ON ${value}`)
  }
  return joinStatement.join(' ')
}

const where = (wObject, isWhere = false, orStatement = false, preparedStmt = false) => {
  if (orStatement) return or(wObject, isWhere, preparedStmt)
  else return and(wObject, isWhere, preparedStmt)
}

/**
 * @param {{ string : { operator: string, value: string|number}}} wObject 
 * @param {boolean} isWhere
 * @returns {string} where string
 */
const and = (wObject, isWhere = false, preparedStmt = false) => {
  let where = isWhere ? '' : ' WHERE'
  let wStack = [];
  for (const key of Object.keys(wObject)) {
    const column = wObject[key]
    if (preparedStmt) wStack.push(`${key} ${column.operator} ?`);
    else wStack.push(`${key} ${column.operator} "${column.value}"`);
  }
  if (isWhere) where += ' AND ';
  return `${where} ${wStack.join(' AND ')}`;
}

/**
 * @param {{ string: { operator: string, value: string|number}}} wObject 
 * @param {boolean} isWhere
 * @returns {string} where string
 */
const or = (wObject, isWhere = false, preparedStmt = false) => {
  let where = isWhere ? '' : ' WHERE';
  let wStack = [];
  const columnCount = Object.keys(wObject).length;
  for (const key of Object.keys(wObject)) {
    const column = wObject[key];
    if (preparedStmt) wStack.push(`${key} ${column.operator} ?`);
    else wStack.push(`${key} ${column.operator} "${column.value}"`);
  }
  if (isWhere) where += ' OR ';
  if (columnCount === 1) return `${where} ${wStack.join(' OR ')}`;
  return `${where} (${wStack.join(' OR ')})`;
}

const parseWhere = (whereObject, orStatement = false, condition = '=', preparedStmt = false) => {
  const whereStatement = []
  const first = Object.keys(whereObject)[0];
  for (const key of Object.keys(whereObject)) {
    const oValue = whereObject[key]
    if (key !== first) whereStatement.push(oValue.operator)
    if (preparedStmt) whereStatement.push(`${key} ${oValue.condition} ?`)
    else whereStatement.push(`${key} ${oValue.condition} "${oValue.value}"`)
  }
  return `WHERE ${whereStatement.join(' ')}`
}

const parseWhereIn = (whereObject, where = false, preparedStmt = false) => {
  const whereStatement = []
  if (preparedStmt) {
    for (const key of Object.keys(whereObject)) {
      whereObject[key] = '?';
    }
  }
  for (const key of Object.keys(whereObject)) {
    const value = whereObject[key]
    let inString = `"${value.join('","')}"`
    if (preparedStmt) inString = `${value.join(',')}`
    whereStatement.push(`${key} IN (${inString})`)
  }
  return `${where ? 'AND' : 'WHERE'} ${whereStatement.join(' AND ')}`
}
/**
 * @param {Object} whereObject 
 * @param {boolean|string} orStatement 
 * @param {boolean} where 
 * @param {boolean} preparedStmt 
 */
const parseWhereLike = (whereObject, orStatement = false, where = false, preparedStmt = false) => {
  const whereStatement = []

  for (const key of Object.keys(whereObject)) {
    const value = whereObject[key]
    if (preparedStmt) whereStatement.push(`${key} LIKE ?`)
    else whereStatement.push(`${key} LIKE "${value}"`)
  }

  if (orStatement) return `${where ? 'AND' : 'WHERE'} ${whereStatement.join(' OR ')}`

  return `${where ? 'AND' : 'WHERE'} ${whereStatement.join(' AND ')}`
}

const parseWhereBetween = (whereObject, where = false, preparedStmt = false) => {
  const whereStatement = []

  for (const key of Object.keys(whereObject)) {
    let value = whereObject[key]
    if (preparedStmt) value = whereStatement.push(`${key} BETWEEN ? AND ? `)
    else whereStatement.push(`${key} BETWEEN ${value[0]} AND ${value[1]}`)
  }

  return `${where ? 'AND' : 'WHERE'} ${whereStatement.join(' AND ')}`
}

const groupBy = (key) => {
  if (key) return `GROUP BY ${key}`
  throw new Error('Key is required for groupBy')
}

const orderBy = (key, order) => {
  if (key) return `ORDER BY ${key} ${order}`
  throw new Error('Key is required for orderBy')
}

const limit = (number) => {
  if (number) return `LIMIT ${number}`
  throw new Error('Number is required for limit')
}

const offset = number => {
  if (number) return `OFFSET ${number}`
  throw new Error('Number is required for limit')
}

const update = (data, preparedStmt = false) => {
  const updateData = []

  for (const key of Object.keys(data)) {
    const value = data[key]
    if (preparedStmt) updateData.push(`${key} = ?`)
    else updateData.push(`${key} = "${value}"`)
  }
  return updateData.join(', ')
}

module.exports = {
  select,
  from,
  or,
  and,
  where,
  parseJoin,
  parseWhere,
  parseWhereIn,
  parseWhereLike,
  parseWhereBetween,
  groupBy,
  orderBy,
  limit,
  update,
  offset
}