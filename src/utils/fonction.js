const config = require('../../config');
const axios = require("axios")

function toDiscordTimestamp(isoDate) {
  const date = new Date(isoDate);
  return `<t:${Math.floor(date.getTime() / 1000)}:d>`;
}

async function sendWebhookMessage(webhookUrl, message) {
  try {
    await axios.post(webhookUrl, { content: message });
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message au webhook :', error.message);
    sendErrorToWebhook(error);
  }
}

function sendErrorToWebhook(error) {
  sendWebhookMessage(config.errorWebhookUrl, `Erreur survenue sur le serveur : ${error.message}`);
}

function checkForDuplicatesAndRemove(db) {
  db.all('SELECT id, user_id, username, name, changedAt FROM Prevnames', (err, rows) => {
    if (err) {
      console.error('Erreur lors de la récupération des données :', err.message);
      sendErrorToWebhook(err);
      return;
    }

    const duplicates = {};
    rows.forEach(entry => {
      const key = `${entry.user_id}-${entry.name}`;
      const changedAt = parseInt(entry.changedAt.match(/<t:(\d+):d>/)[1]);

      if (!duplicates[key]) {
        duplicates[key] = [];
      }
      duplicates[key].push({ ...entry, changedAt });
    });

    Object.keys(duplicates).forEach(key => {
      const entries = duplicates[key];
      entries.sort((a, b) => a.changedAt - b.changedAt);

      for (let i = 1; i < entries.length; i++) {
        if (entries[i].name === entries[i - 1].name && (entries[i].changedAt - entries[i - 1].changedAt <= 60)) {
          const idToRemove = entries[i].id;
          db.run('DELETE FROM Prevnames WHERE id = ?', [idToRemove], err => {
            if (err) {
              console.error('Erreur lors de la suppression des doublons :', err.message);
              sendErrorToWebhook(err);
            }
          });
        }
      }
    });
  });
}

module.exports = {
  toDiscordTimestamp,
  sendWebhookMessage,
  sendErrorToWebhook,
  checkForDuplicatesAndRemove,
};
