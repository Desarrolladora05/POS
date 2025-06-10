const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateRequired = (value) => {
  return value && value.toString().trim().length > 0;
};

const validatePrice = (price) => {
  return !isNaN(price) && parseFloat(price) >= 0;
};

export { validateEmail, validatePassword, validateRequired, validatePrice };