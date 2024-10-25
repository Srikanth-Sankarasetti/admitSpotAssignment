const pool = require("./../utils/dbconnect");
const AppError = require("./../mildlewares/appError");
const catchAsync = require("./../mildlewares/catchAsync");
const Joi = require("joi");
const xlsx = require("xlsx"); // <-- Add this line
const { parse } = require("json2csv");

const {
  batchProcessContactsInFile,
} = require("./../mildlewares/batchUpdating");

const contactSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  phone_number: Joi.string().min(10).max(15).required(), // changed to string
  address: Joi.string().optional(),
  timezone: Joi.string().required(),
});

const validateContact = (contact) => {
  return contactSchema.validate(contact);
};

exports.createContact = catchAsync(async (req, res, next) => {
  const { id } = req;
  const { name, email, phone_number, address, timezone } = req.body;

  //checking contact is already available or not
  const IsContactAvailable = await pool.query(
    `select * from contacts where user_id=$1 and name=$5 and email=$2 and phone_number=$3 and address=$4 and timezone=$6`,
    [id, name, email, phone_number, address, timezone]
  );

  if (IsContactAvailable.rows.length !== 0) {
    return next(
      new AppError(
        "Contact details already register, please add new contact details",
        402
      )
    );
  }
  const query = `insert into contacts(user_id,name,email,phone_number,address,timezone) values($1,$2,$3,$4,$5,$6)`;
  const newContact = await pool.query(query, [
    id,
    name,
    email,
    phone_number,
    address,
    timezone,
  ]);
  res.status(200).send({
    status: "Success",
    message: "Contact added successfully",
  });
});

exports.getAllContacts = catchAsync(async (req, res, next) => {
  const { id } = req;
  const {
    name = "",
    email = "",
    timezone = "",
    sort_by = "created_at",
  } = req.query;
  const sqlQuery = ` SELECT * 
    FROM contacts
    WHERE user_id = $1
    AND (COALESCE(NULLIF($2, ''), name) = name)
    AND (COALESCE(NULLIF($3, ''), email) = email)
    AND (COALESCE(NULLIF($4, ''), timezone) = timezone)
    ORDER BY 
      CASE WHEN $5 = 'name' THEN name END,
      CASE WHEN $5 = 'email' THEN email END,
      CASE WHEN $5 = 'created_at' THEN created_at END,
      CASE WHEN $5 = 'timezone' THEN timezone END
    ASC;`;
  const allContacts = await pool.query(sqlQuery, [
    id,
    name,
    email,
    timezone,
    sort_by,
  ]);
  if (allContacts.rows.length === 0) {
    return next(
      new AppError("no contacts available, please add contacts", 404)
    );
  }
  res.status(200).send({
    status: "success",
    results: allContacts.rows.length,
    allContacts: allContacts.rows,
  });
});

exports.deleteContactById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const isContactAvailable = await pool.query(
    `select * from contacts where id=$1`,
    [id]
  );
  if (isContactAvailable.rows.length === 0) {
    return next(new AppError("Cotact details not availble with this Id", 404));
  }
  await pool.query(`delete from contacts where id=$1`, [id]);
  res.status(200).send({
    status: "Success",
    message: "Contact details deleted succesfully",
  });
});

exports.updateContact = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, email, phone_number, address, timezone } = req.body;
  const isContactAvailable = await pool.query(
    `select * from contacts where id=$1`,
    [id]
  );
  if (isContactAvailable.rows.length === 0) {
    return next(new AppError("Cotact details not availble with this Id", 404));
  }

  const fieldsToUpdate = [];
  const values = [];
  let index = 1;
  if (name) {
    fieldsToUpdate.push(`name = $${index}`);
    values.push(name);
    index++;
  }
  if (email) {
    fieldsToUpdate.push(`email = $${index}`);
    values.push(email);
    index++;
  }
  if (phone_number) {
    fieldsToUpdate.push(`phone_number = $${index}`);
    values.push(phone_number);
    index++;
  }
  if (address) {
    fieldsToUpdate.push(`address = $${index}`);
    values.push(address);
    index++;
  }
  if (timezone) {
    fieldsToUpdate.push(`timezone = $${index}`);
    values.push(timezone);
    index++;
  }

  // Ensure at least one field is being updated
  if (fieldsToUpdate.length === 0) {
    return next(new AppError("No valid fields to update", 400));
  }

  // Add the contact ID to the query values
  values.push(id);

  await pool.query(
    `UPDATE contacts 
    SET ${fieldsToUpdate.join(", ")}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${index}`,
    values
  );
  res.status(200).send({
    status: "success",
    message: "contact details updated",
  });
});

exports.batchProcessContacts = catchAsync(async (req, res, next) => {
  const contacts = req.body.contacts;
  const { id } = req;
  const insertValues = [];
  const params = [];
  let index = 1;

  contacts.forEach((contact) => {
    const { name, email, phone_number, address, timezone } = contact;
    insertValues.push(
      `($${index++}, $${index++}, $${index++}, $${index++}, $${index++}, $${index++})`
    );
    params.push(id, name, email, phone_number, address, timezone);
  });

  const insertQuery = `
      INSERT INTO contacts (user_id,name, email, phone_number, address, timezone)
      VALUES ${insertValues.join(", ")}
      ON CONFLICT (email) DO UPDATE 
      SET name = EXCLUDED.name, phone_number = EXCLUDED.phone_number, address = EXCLUDED.address, timezone = EXCLUDED.timezone
      RETURNING *;
    `;

  const result = await pool.query(insertQuery, params);

  res.status(200).json({
    status: "success",
    data: {
      contacts: result.rows,
    },
    message:
      "Adding/updating multiple contacts via a single request successful",
  });
});

exports.uploadExcelContacts = catchAsync(async (req, res, next) => {
  const filePath = req.file.path;
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  const contacts = [];
  sheetData.forEach((row) => {
    // Ensure all keys are lowercase to match your Joi schema
    const normalizedRow = {};
    Object.keys(row).forEach((key) => {
      let value = row[key];
      // Convert number to string (if applicable)
      if (typeof value === "number") {
        value = value.toString();
      }
      normalizedRow[key.toLowerCase()] = value;
    });

    const { error } = validateContact(normalizedRow);
    if (error) {
      console.log("Validation Error:", error.details[0].message); // Log the validation error
    } else {
      contacts.push(normalizedRow); // Push to contacts if no error
    }
  });
  console.log(contacts);
  if (contacts.length > 0) {
    const result = await batchProcessContactsInFile(req, res, contacts); // Bulk insert/update logic
    res.status(200).send({
      status: "success",
      message: "Contacts uploaded successfully",
      data: result,
    });
  } else {
    res
      .status(400)
      .send({ status: "fail", message: "No valid contacts found in the file" });
  }
});

// Download contacts as Excel
exports.downloadContactsExcel = catchAsync(async (req, res, next) => {
  const { id } = req;
  const contacts = await pool.query(`select * from contacts where user_id=$1`, [
    id,
  ]); // Fetch all contacts from the DB
  console.log(contacts.rows);

  // Convert contacts to Excel sheet format
  const worksheet = xlsx.utils.json_to_sheet(contacts.rows); // Use contacts.rows
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Contacts");

  // Create an Excel file buffer
  const excelFile = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

  // Set headers and send the Excel file for download
  res.header(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.attachment("contacts.xlsx");
  res.status(200).send(excelFile);
});
