import { object, string } from 'joi';

/**
 * Evaluate user input within req.body.
 * Remove unknown properties from the request body.
 *
 * @param { Object } reqBody The input request body to validate.
 * @returns { Object } { Object } The sanitized request body.
 * @throws { String } A string with detailed errors from request body.
 */
function validateUserInput(reqBody){
  let operationResult;

  const schema = object({
    senderFirstName: string().alphanum().min(3).max(30),
    senderLastName: string().alphanum().min(3).max(30),
    senderEmail: string().email({ minDomainSegments: 2}).required(),
    recipientFirstName: string().alphanum().min(3).max(30),
    recipientLastName: string().alphanum().min(3).max(30),
    recipientEmail: string().email({ minDomainSegments: 2}).required(),
  })

  operationResult = schema.validate(req.body, { stripUnknown: true });

  if (operationResult.error){
    throw operationResult.error.annotate();
  }

  return operationResult.value;
}

export default validateUserInput;