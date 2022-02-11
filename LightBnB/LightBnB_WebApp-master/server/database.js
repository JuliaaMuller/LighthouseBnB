const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg')

const db = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  let queryString = `
  SELECT *
  FROM users
  WHERE email = $1;`
  let values = [email];

  return db.query(queryString, values)
  .then((res) => res.rows[0])
  .catch(err => console.log(err));
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  let queryString = `
  SELECT *
  FROM users
  WHERE id = $1;`;
  let values = [id];

  return db.query(queryString, values)
  .then((res) => res.rows[0])
  .catch(err => console.log(err));
}
exports.getUserWithId = getUserWithId;

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  let queryString = `
  INSERT INTO users(name, email, password)
  VALUES ($1, $2, $3)
  RETURNING *;`;
  let values = [user.name, user.email, user.password];

  return db.query(queryString, values)
  .then(res => res.rows[0])
  .catch(err => console.log(err));

}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  let queryString = `
  SELECT * FROM reservations
  WHERE guest_id = $1
  LIMIT $2;
  `
  let values = [guest_id, limit];

  return db.query(queryString, values)
  .then(res => res.rows)
  // .catch(err => console.log(err));
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

 const getAllProperties = function (options, limit = 10) {
  
  // return db.query(`SELECT * FROM properties`)
  // .then(res => res.rows)
  // 1
  let queryParams = [];
  let filters = []
  // 2
  let queryString = `SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id`;

  // 3
  if (options.city) {
    queryParams.push(`${options.city}`);
    filters.push(` city LIKE $${queryParams.length} `);
  }

  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    filters.push(` user LIKE $${queryParams.length} `);
  }

  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(`${options.minimum_price_per_night}`);
    filters.push(` cost_per_night > ($${queryParams.length})*100`);
  }
  if (options.maximum_price_per_night) {
    queryParams.push(`${options.maximum_price_per_night}`);
    filters.push(` cost_per_night < ($${queryParams.length})*100`);
  }

  if (filters.length) {
    queryString += `WHERE ${filters.join(' AND ')}`;
  }

  // 4
  
  queryString += `
  GROUP BY properties.id
  `;

  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryString += ` HAVING avg(property_reviews.rating) > $${queryParams.length} `;
  }
  queryParams.push(limit);

  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};`

  // 5
  // console.log(queryString, queryParams);

  // 6
  return db.query(queryString, queryParams)
  .then(res => res.rows);
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
 const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;