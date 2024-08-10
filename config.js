// config.js
require('dotenv').config();

function env(variable, defaultValue = undefined) {
    const value = process.env[variable];
    if (value === undefined) {
        if (defaultValue === undefined) {
            throw new Error(`Environment variable ${variable} is not set and no default value was provided.`);
        }
        return defaultValue;
    }
    return value;
}

module.exports = env;
