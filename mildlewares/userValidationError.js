const Joi = require("joi");

// Define validation schema for contacts
const userSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Validate a contact before inserting into DB
const validateContact = (contact) => userSchema.validate(contact);

exports.createUserValidation = (req, res, next) => {
  const { error } = validateContact(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next(); // proceed to the next middleware or controller if validation passes
};
