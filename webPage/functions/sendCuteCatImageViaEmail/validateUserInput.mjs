import joi from 'joi';

/**
 * Evaluate user input within req.body.
 * Remove unknown properties from the request body.
 *
 * @param { Object } reqBody The input request body to validate.
 * @returns { Object } { Object } The sanitized request body.
 * @throws { String } A string with detailed errors from request body.
 */
function validateUserInput(reqBody){
  if (!reqBody){
    throw new Error ('Missing reqBody parameter to sanitize');
  }

  let operationResult;

  const schema = joi.object({
    senderFirstName: joi.string().alphanum().min(3).max(30),
    senderLastName: joi.string().alphanum().min(3).max(30),
    senderEmail: joi.string().email({ minDomainSegments: 2}).required(),
    recipientFirstName: joi.string().alphanum().min(3).max(30),
    recipientLastName: joi.string().alphanum().min(3).max(30),
    recipientEmail: joi.string().email({ minDomainSegments: 2}).required(),
  })

  operationResult = schema.validate(reqBody, { stripUnknown: true });

  if (operationResult.error){
    throw operationResult.error.annotate();
  }

  return operationResult.value;
}

export default validateUserInput;