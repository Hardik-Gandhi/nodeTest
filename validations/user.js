const Joi = require('joi');
const common = require('../common');

exports.registration = (payload) => {
    let userSchema = Joi.object({
        firstName: Joi.string().required().messages({
            'string.base': "Firstname should be a type of 'text'",
            'string.empty': "Firstname cannot be an empty field",
            'any.required': "Firstname is a required field"
          }),
        lastName: Joi.string().required().messages({
            'string.base': "Lastname should be a type of 'text'",
            'string.empty': "Lastname cannot be an empty field",
            'any.required': "Lastname is a required field"
          }),
        email: Joi.string().email().required().messages({
            'string.base': "Email should be a type of 'text'",
            'string.empty': "Email cannot be an empty field",
            'any.required': "Email is a required field"
          }),
        password: Joi.string().required().messages({
            'string.base': "Password should be a type of 'text'",
            'string.empty': "Password cannot be an empty field",
            'any.required': "Password is a required field"
          }),
        dateOfBirth: Joi.string().pattern(common.validDate).required().messages({
            'string.base': "Date of birth should be a type of 'text'",
            'string.empty': "Date of birth cannot be an empty field",
            'any.required': "Date of birth is a required field",
            "string.pattern.base": "Date of birth should be in YYYY-MM-DD format"
          }),
    });

    let userValidation = userSchema.validate(payload, { abortEarly: false });
    if (userValidation.error) {
      console.log(userValidation.error);
      return ({status: false, message: userValidation.error.details[0].message});
    }
    return ({status: true, payload: userValidation.value});
}