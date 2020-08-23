# msql-qb
A very light-weight and simple mysql query builder lib, to write most commonly used mysql queries.

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
![NPM License](https://img.shields.io/npm/l/msql-qb)
[![GitHub version](https://badge.fury.io/gh/deveshucer%2Fmsql-qb.svg)](https://badge.fury.io/gh/deveshucer%2Fmsql-qb)

[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

# Motivation
- I was trying to solve the issues with our current implementation of the models that were written in direct plain text query.
- It was creating so much of code duplicity and very error-prone each time if we made any changes.
- Another issue was our Database has different styled column names in different tables. So to overcome from these problems, I build this package.

# Introduction
Simple but very useful mysql query builder. Build your common mysql queries with the special use case, where
you can also covert your column names from the snake_case, upper/lower case to camelCase as aliases.
Its doesn't have any dependencies. So very light-weight lib.

# Installation

This is a [Node.js](https://nodejs.org/en/) module available through the npm registry.

Before installing, [download and install Node.js](https://nodejs.org/en/download/). Node.js 10.22.0 or higher is recommended.

Installation can be done using the npm install command:

```
$ npm install msql-qb --save
$ npm i msql-qb --save
```

# Usage

#### SELECT
> **Important**: use `.build()` method at the last in the method chaining. It must be called in the case of `select` query only not in any other case.

```javascript
const QueryBuilder = require('msql-qb');
const qb = new QueryBuilder();

// use .build() method at the last in the method chaining. 
// And it must be called in the case of select query only not for any other query

// to select all columns
let query = qb
    .select()           // [col1, col2, col3, col4] can be passed in select
    .from("tableName")
    .where("column", "val")
    .build();
```

```javascript
const qb = new QueryBuilder();
// to select the specific columns
let query = qb
    .select("col1, col2, col3, col4")  // array of columns also can be passed 
    .from("tableName")
    .where("column", "val")
    .andWhere({col1: "val1", col2: "val2"})
    .build();
```

`group by`, `order by`, `limit`, and `offset` also can be used in proper order with `select` query
```javascript
const qb = new QueryBuilder();
// to select the specific columns
let query = qb
    .select(["col1", "col2", "col3", "col4"]) 
    .from("tableName")
    .where("column", "val")
    .orderBy("col1", "DESC") // default is ASC
    .groupBy("col2")
    .limit(100)
    .offset(10)
    .build();
```

#### INSERT

> Please note that `.build()` method is not available for below queries, and you do not require it for non-select queries.
```javascript
const QueryBuilder = require('msql-qb');

const qb = new QueryBuilder();
const data = {
  col1: "val1",
  col2: "val2",
  col3: "val3"
}
let query = qb.insert("tableName", data);

// or with prepared statement
query = qb.insert("tableName", {col1: '?', col2: '?', col3: '?'});
```

#### UPDATE

> use all `where` conditions before `update` cause method chaining is not available after `update`.
```javascript
const QueryBuilder = require('msql-qb');

const qb = new QueryBuilder();
const data = {
  col1: "val1",
  col2: "val2",
  col3: "val3"
}
let query = qb.where("column", "val").andWhere({column2: "val2"}).update("tableName", data);

// or with prepared statement
query = qb.where("column", '?').andWhere({column2: '?'}).update("tableName", {col1: '?', col2: '?'});
```
#### DELETE
> use all `where` conditions before `delete` cause.
```javascript
const QueryBuilder = require('msql-qb');

const qb = new QueryBuilder();
let query = qb.where("column", "val").andWhere({column2: "val2"}).delete("tableName");

// or with prepared statement
query = qb.andWhere({column: '?', column2: '?'}).delete("tableName");

```
### WHERE clause

> * Different where clause usages
> * all where clause are chain-able meaning you can call appropriate method after where.
```javascript
const QueryBuilder = require('msql-qb');
const qb = new QueryBuilder();

// best use of it if there is only one column condition
qb.where("col", "val", "!="); // condition could be any valid condition eg: >=, <=, !=, is

// you can join multiple where together like this
qb.where("col", "val", ">=").where("col2", "val2", "<="); // all condition will be joined by AND operator

// if there are multiple column condition but with equality (=) then use this
qb.andWhere({col1: "val1", col2: "val2", col3: "val3"});

// to use multiple condition with OR operator
qb.orWhere({col1: "val1", col2: "val2", col3: "val3"});

// for where like
qb.whereLike("col", "val");

// or
qb.whereLike("col", "%val%");

// where in
qb.whereIn("col", ["val1", "val2", "val3", "valN"]);

// between - 2nd param array must be of length 2 with having two values
qb.whereBetween("col", ["valA", "valB",]);

```

### Prepared Statement Queries
Set the `'preparedStatement'` option either in class constructor or later also you can set using `.setOptions({})` method.
```javascript
const QueryBuilder = require('msql-qb');
// parameterized or query for prepared statements
// set the 'preparedStatement' option as true in queryBuilder;
const qb = new QueryBuilder({
  "preparedStatement": true
});

// or you can set this option later also as following
qb.setOptions({
  "preparedStatement": true
});
```

> **Caution!** pass the column value `"?"` as placeholder, as given in the example.
```javascript
const QueryBuilder = require('msql-qb');
// pass the column values as '?' placeholder for value as given in below example
let query = qb
    .select()
    .from("tableName")
    .where("column", '?')
    .build();

let query = qb
    .select("col1, col2, col3, col4")
    .from("tableName")
    .where("column", "val")
    .orWhere({col1: '?', col2: '?'})
    .build();

```
### Special Use case
+ If you want to convert your column keys into `camelCase` format from the `snake_case` or from different lower and upper case formats.
+ You can enable this by setting `'convertColumnsToCamelCase'` option in the builder class.
+ or you can pass the second argument as `true` in the `select` method. as given in example.
+ **Caution**, it will only work if you have mentioned column names in the `select` method.

```javascript
const QueryBuilder = require('msql-qb');

const qb = new QueryBuilder({
  "convertColumnsToCamelCase": true
});

// or using 
qb.setOptions({
  "convertColumnsToCamelCase": true
});

// or you can use it like this
let query = qb
  .select("col_name1, col_name2, col_NAME3, COL_name4", true)
  .from("tableName")
  .where("key", "val")
  .orWhere({col1: "val1", col2: "val2"})
  .build();

console.log(query);

// OUTPUT:
// SELECT col_name1 AS colName1, col_name2 AS colName2, col_NAME3 AS colName3, COL_name4 AS colName4 
// FROM tableName 
// WHERE key = "val" OR col1 = "val1" OR col2 = "val2";

``` 
[![Twitter](https://img.shields.io/twitter/follow/Devesh299.svg?style=social&label=@Devesh299)](https://twitter.com/Devesh299)

# Notes
> * It's recommended for basic `select`, `insert`, `update`, `delete` operations and other simple `join` queries with different `where` conditions.
> * It is not tested for very complex queries. Please do test before writing complex queries.
> * This is the first version, in the future version it might not be the case, and you will be able to build complex queries without any issue. 
