const fs = require('fs');
const path = require('path');

const validateAccessKey = (key, callback) => {
  const accessKeysFilePath = path.join(__dirname, '..', 'accessKeys.json');
  if (!fs.existsSync(accessKeysFilePath)) {
    return callback(new Error('Clé d\'accès invalide.'));
  }

  const accessKeys = JSON.parse(fs.readFileSync(accessKeysFilePath, 'utf8'));
  const validKey = accessKeys.find(entry => entry.key === key);

  if (!validKey) {
    return callback(new Error('Clé d\'accès invalide.'));
  }

  callback(null, validKey);
};

module.exports = { validateAccessKey };
