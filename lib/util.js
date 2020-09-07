/**
 * @param {object} obj 
 * @returns {boolean}
 */
const isEmpty = (obj) => {
  return (Object.keys(obj).length === 0)
}
/**
 * @param {string} str
 * @returns {string} titleCase string
 */
const toTitleCase = (str) => {
  if (!str) return str
  if (str.length === 1) return str.toUpperCase()
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase().trim()
}

const containsSubPart = (str, delimiter) => {
  if (!str.includes(delimiter)) return [false, []]
  return [true, str.split(delimiter)]
}

/**
 * @param {string} field 
 * @param {string} delimiter 
 * @return {string} camelCase string
 */
const camelCase = (field, delimiter = '_') => {
  field = field.replace(/\s|/g, '')
  let [hasSubParts, parts] = containsSubPart(field, delimiter)
  if (!hasSubParts) return field.toLowerCase().trim()

  parts = parts.map((part, index) => {
    if (index === 0) return part.toLowerCase().trim()
    return toTitleCase(part)
  })
  return parts.join('')
}
/**
 * @param {string[]} fields 
 * @param {string} delimiter default _
 */
const convertToCamelCase = (fields = [], delimiter = '_') => {
  return fields.map((field) => {
    return camelCase(field.trim(), delimiter)
  })
}
/**
 * @param {string|string[]} fields 
 * @param {string} delimiter default _
 * @return {string} 
 */
const getAliases = (fields, delimiter = '_') => {
  if (typeof fields === 'string') {
    if (fields.includes('*')) return fields
    if (fields.includes(',')) fields = fields.split(',')
  } else if (!Array.isArray(fields)) {
    throw new Error('syntax error in select statement, fields should be in comma(,) separated style or in array')
  }
  if (!Array.isArray(fields)) return fields;

  const aliases = convertToCamelCase(fields)
  const keys = fields.map((field, index) => {
    if (field === aliases[index]) return aliases[index]
    return field + ' AS ' + aliases[index]
  })
  return keys.join(',')
}

module.exports = {
  isEmpty,
  getAliases,
  toTitleCase,
  camelCase
}