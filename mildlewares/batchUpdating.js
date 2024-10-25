const pool = require("./../utils/dbconnect"); // Assuming you use pg Pool

// Batch insert/update contacts logic
exports.batchProcessContactsInFile = async (req, res, contacts) => {
  const { id } = req; // Assuming user id is provided via authentication middleware
  const insertValues = [];
  const params = [];
  let index = 1;
  console.log(id);
  contacts.forEach((contact) => {
    const { name, email, phone_number, address, timezone } = contact;
    insertValues.push(
      `($${index++}, $${index++}, $${index++}, $${index++}, $${index++}, $${index++})`
    );
    params.push(id, name, email, phone_number, address, timezone);
  });

  const insertQuery = `
    INSERT INTO contacts (user_id, name, email, phone_number, address, timezone)
    VALUES ${insertValues.join(", ")}
    ON CONFLICT (email) DO UPDATE 
    SET name = EXCLUDED.name, phone_number = EXCLUDED.phone_number, address = EXCLUDED.address, timezone = EXCLUDED.timezone
    RETURNING *;
  `;

  const result = await pool.query(insertQuery, params);
  return result.rows;
};
