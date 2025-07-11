export function validateEmail(email) {
  if (!email || typeof email !== "string") {
    return "Email is required.";
  }

  // Trim whitespace
  const trimmedEmail = email.trim();
  if (trimmedEmail.length === 0) {
    return "Email cannot be empty.";
  }

  // Basic email regex pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(trimmedEmail)) {
    return "Please enter a valid email address.";
  }

  return ""; // No error
}

export function validatePassword(password) {
  if (!password || typeof password !== "string") {
    return "Password is required.";
  }

  const trimmedPassword = password.trim();
  if (trimmedPassword.length === 0) {
    return "Password cannot be empty.";
  }

  if (trimmedPassword.length < 8) {
    return "Password must be at least 8 characters long.";
  }

  // You can add more checks here (e.g., uppercase, number, special char) if needed

  return ""; // No error
}