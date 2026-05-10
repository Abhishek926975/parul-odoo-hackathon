const validators = {
  required(value) {
    return value !== undefined && value !== null && String(value).trim() !== "";
  },
  email(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
  },
  min(value, length) {
    return String(value || "").length >= Number(length);
  },
};

export function validate(values, rules) {
  const errors = [];

  Object.entries(rules).forEach(([field, ruleString]) => {
    const value = values[field];

    ruleString.split("|").forEach((rule) => {
      const [name, argument] = rule.split(":");
      const isValid = validators[name]?.(value, argument);

      if (isValid === false) {
        if (name === "required") errors.push(`${field} is required`);
        if (name === "email") errors.push(`${field} must be a valid email`);
        if (name === "min") errors.push(`${field} must be at least ${argument} characters`);
      }
    });
  });

  return errors.length ? errors : null;
}
