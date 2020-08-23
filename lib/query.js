const select = select => {
  if (select) {
    let selectString = ''

    if (typeof select === 'object') selectString = select.join(', ')
    if (typeof select === 'string') selectString = select

    return `SELECT ${selectString}`
  }
  return 'SELECT *'
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

const parseWhere = (whereObject, orStatement = false, condition = '=', preparedStmt = false) => {
  const whereStatement = []

  for (const key of Object.keys(whereObject)) {
    const value = whereObject[key]
    if (preparedStmt) whereStatement.push(`${key} ${condition} ${value}`)
    else whereStatement.push(`${key} ${condition} "${value}"`)
  }

  if (orStatement) return `WHERE ${whereStatement.join(' OR ')}`
  return `WHERE ${whereStatement.join(' AND ')}`
}

const parseWhereIn = (whereObject, where = false, preparedStmt = false) => {
  const whereStatement = []

  for (const key of Object.keys(whereObject)) {
    const value = whereObject[key]
    let inString = `"${value.join('","')}"`
    if (preparedStmt) inString = `${value.join(',')}`
    whereStatement.push(`${key} IN (${inString})`)
  }
  return `${where ? 'AND' : 'WHERE'} ${whereStatement.join(' AND ')}`
}

const parseWhereLike = (whereObject, orStatement = false, where = false, preparedStmt = false) => {
  const whereStatement = []

  for (const key of Object.keys(whereObject)) {
    const value = whereObject[key]
    if (preparedStmt) whereStatement.push(`${key} LIKE ${value}`)
    else whereStatement.push(`${key} LIKE "${value}"`)
  }

  if (orStatement) return `${where ? 'AND' : 'WHERE'} ${whereStatement.join(' OR ')}`

  return `${where ? 'AND' : 'WHERE'} ${whereStatement.join(' AND ')}`
}

const parseWhereBetween = (whereObject, where = false) => {
  const whereStatement = []

  for (const key of Object.keys(whereObject)) {
    const value = whereObject[key]
    whereStatement.push(`${key} BETWEEN ${value[0]} AND ${value[1]}`)
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
    if (preparedStmt) updateData.push(`${key} = ${value}`)
    else updateData.push(`${key} = "${value}"`)
  }
  return updateData.join(', ')
}

module.exports = {
  select,
  from,
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