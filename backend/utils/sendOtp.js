// Placeholder: plug in an SMS / email provider here (MSG91, Twilio, Nodemailer...).
// For now the OTP is only printed in the server console.
module.exports = async (user, otp) => {
  console.log(`[OTP] ${user.phone} -> ${otp}`);
};
