const db = require('./db');

db.query('SELECT 1 + 1 AS solution', (err, results) => {
  if (err) throw err;
  console.log('The solution is: ', results[0].solution);
});
