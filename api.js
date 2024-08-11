const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');
const config = require('./config.js');
const { validateAccessKey } = require('./src/utils/access');
const { toDiscordTimestamp, sendWebhookMessage, sendErrorToWebhook, checkForDuplicatesAndRemove } = require('./src/utils/fonction');
const Bot = require('./src/client/index.js');

const app = express();
const port = 20005;

const client = new Bot(config);
client.start().catch(console.error);

const dbPath = path.resolve(__dirname, 'src', 'db', 'safeness.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS Prevnames (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      name TEXT NOT NULL,
      changedAt TEXT NOT NULL,
      UNIQUE(user_id, name, changedAt) ON CONFLICT IGNORE
    );
  `);
});
const ascii = `
\x1b[34m⠀⠀⠀⠀⠀⠀⢀⣤⣶⣶⣖⣦⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀
\x1b[34m⠀⠀⠀⠀⢀⣾⡟⣉⣽⣿⢿⡿⣿⣿⣆⠀⠀⠀⠀⠀⠀⠀
\x1b[34m⠀⠀⠀⢠⣿⣿⣿⡗⠋⠙⡿⣷⢌⣿⣿⠀⠀⠀⠀⠀⠀⠀
\x1b[34m⣷⣄⣀⣿⣿⣿⣿⣷⣦⣤⣾⣿⣿⣿⡿⠀⠀⠀⠀⠀⠀⠀
\x1b[34m⠈⠙⠛⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⡀⠀⢀⠀⠀⠀⠀
\x1b[34m⠀⠀⠀⠸⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⠻⠿⠿⠋⠀⠀⠀⠀
\x1b[34m⠀⠀⠀⠀⠹⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀
\x1b[34m⠀⠀⠀⠀⠀⠈⢿⣿⣿⣿⣿⣿⣿⣇⠀⠀⠀⠀⠀⠀⠀⡄
\x1b[34m⠀⠀⠀⠀⠀⠀ ⠙⢿⣿⣿⣿⣿⣿⣆⠀⠀⠀⠀⢀⡾⠀
\x1b[34m⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⣿⣿⣿⣿⣷⣶⣴⣾⠏⠀⠀
\x1b[34m⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠛⠛⠛⠋⠁⠀⠀⠀
`
const text = `
\x1b[34m▒█▀▀▀█ ░█▀▀█ ▒█▀▀▀ ▒█▀▀▀ ▒█▄░▒█ ▒█▀▀▀ ▒█▀▀▀█ ▒█▀▀▀█ ░░ ░█▀▀█ ▒█▀▀█ ▀█▀ 
\x1b[34m░▀▀▀▄▄ ▒█▄▄█ ▒█▀▀▀ ▒█▀▀▀ ▒█▒█▒█ ▒█▀▀▀ ░▀▀▀▄▄ ░▀▀▀▄▄ ▀▀ ▒█▄▄█ ▒█▄▄█ ▒█░ 
\x1b[34m▒█▄▄▄█ ▒█░▒█ ▒█░░░ ▒█▄▄▄ ▒█░░▀█ ▒█▄▄▄ ▒█▄▄▄█ ▒█▄▄▄█ ░░ ▒█░▒█ ▒█░░░ ▄█▄
`
        console.log(`${ascii}${text}`)

app.use(bodyParser.json());

app.use((req, res, next) => {
  const accessKey = req.header('X-Access-Key');
  if (!accessKey) {
    return res.status(401).json({ error: 'Vous avez besoin d\'une clé d\'accès.' });
  }

  validateAccessKey(accessKey, (err, keyData) => {
    if (err) {
      return res.status(401).json({ error: err.message });
    }
    req.keyData = keyData;
    next();
  });
});

app.get('/api/prevnames/count', (req, res) => {
  const { role } = req.keyData;
  
  if (role === 'public' || role === 'dev' || role === 'bot') {
    db.get('SELECT COUNT(*) as count FROM Prevnames', (err, row) => {
      if (err) {
        console.error('Erreur lors de la récupération du nombre de noms précédents :', err.message);
        sendErrorToWebhook(err);
        return res.status(500).json({ error: 'Erreur interne du serveur.' });
      }
      res.status(200).json({ count: row.count });
    });
  } else {
    res.status(403).json({ error: 'Accès interdit.' });
  }
});

app.get('/api/prevnames/clear/:user_id', (req, res) => {
  const { user_id } = req.params;
  const { role } = req.keyData;

  if (role === 'bot' || role === 'dev') {
    if (!user_id) {
      return res.status(400).json({ error: 'Paramètre user_id manquant dans la requête.' });
    }

    db.run('DELETE FROM Prevnames WHERE user_id = ?', [user_id], function (err) {
      if (err) {
        console.error(`Erreur lors de la suppression des prevnames pour l'utilisateur ${user_id} :`, err.message);
        sendErrorToWebhook(err);
        return res.status(500).json({ error: 'Erreur interne du serveur lors de la suppression des prevnames.' });
      }
      res.json({ message: `Prevnames supprimés avec succès pour l'utilisateur ${user_id}` });
    });
  } else {
    res.status(403).json({ error: 'Accès interdit.' });
  }
});

app.post('/api/prevnames/save', (req, res) => {
  const { role } = req.keyData;
  const { user_id, username, name, changedAt } = req.body;

  if (role === 'bot' || role === 'dev') {
    if (!user_id || !username || !name || !changedAt) {
      return res.status(400).json({ error: 'Tous les champs sont requis.' });
    }

    const discordTimestamp = toDiscordTimestamp(changedAt);

    db.run(`
      INSERT INTO Prevnames (user_id, username, name, changedAt)
      VALUES (?, ?, ?, ?)
    `, [user_id, username, name, discordTimestamp], function(err) {
      if (err) {
        console.error('Erreur lors de l\'insertion des données :', err.message);
        sendErrorToWebhook(err);
        return res.status(500).json({ error: 'Erreur interne du serveur.' });
      }

      checkForDuplicatesAndRemove(db);
      res.status(200).json({ message: 'Données sauvegardées avec succès.' });
    });
  } else {
    res.status(403).json({ error: 'Accès interdit.' });
  }
});

app.get('/api/prevnames/users/:user_id', (req, res) => {
  const { user_id } = req.params;
  const { role } = req.keyData;

  if (role === 'public' || role === 'bot' || role === 'dev') {
    db.all('SELECT * FROM Prevnames WHERE user_id = ?', [user_id], (err, rows) => {
      if (err) {
        console.error('Erreur lors de la récupération des données :', err.message);
        sendErrorToWebhook(err);
        return res.status(500).json({ error: 'Erreur interne du serveur.' });
      }
      res.status(200).json(rows);
    });
  } else {
    res.status(403).json({ error: 'Accès interdit.' });
  }
});

app.listen(port, '0.0.0.0', async () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
  try {
    const startMessage = `**[START]** Serveur démarré sur le port ${port}`;
    await sendWebhookMessage(config.startWebhookUrl, startMessage);

    checkForDuplicatesAndRemove(db);
  } catch (err) {
    console.error('Erreur lors de l\'envoi du message de démarrage :', err.message);
    sendErrorToWebhook(err);
  }
});