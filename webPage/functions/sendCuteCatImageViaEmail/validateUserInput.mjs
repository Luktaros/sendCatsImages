import { object as joiObject, string as joiString } from 'joi';

/**
 * 
 * @param {*} reqBody
 */
async function validateUserInput(reqBody){
  let cleanUserInput = {};

  const schema = joiObject({
    senderFirstName: joiString().alphanum().min(3).max(30),
    senderLastName: joiString().alphanum().min(3).max(30),
    senderEmail: joiString().email({ minDomainSegments: 2}).required(),
    recipientFirstName: joiString().alphanum().min(3).max(30),
    recipientLastName: joiString().alphanum().min(3).max(30),
    recipientEmail: joiString().email({ minDomainSegments: 2}).required(),
  })

  await schema.validateAsync(req.body, { stripUnknown: true }).catch(()=>{
    res.status(406).send('Invalid input data.');
  });

}

export default validateUserInput;