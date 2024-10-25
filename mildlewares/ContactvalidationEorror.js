const Joi = require("joi");

// Define validation schema for contacts
const contactSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  phone_number: Joi.number().min(10).max(15).required(),
  address: Joi.string().optional(),
  timezone: Joi.string().required(),
});

// Validate a contact before inserting into DB
const validateContact = (contact) => contactSchema.validate(contact);

exports.createContactValidation = (req, res, next) => {
  const { error } = validateContact(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next(); // proceed to the next middleware or controller if validation passes
};
