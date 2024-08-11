const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./src/db/safeness.db');

function removeDuplicates() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      db.all(`
        SELECT id, user_id, username, name, changedAt
        FROM Prevnames
      `, (err, rows) => {
        if (err) {
          return reject(err.message);
        }

        let userMap = new Map();

        rows.forEach(row => {
          const key = row.user_id;
          const changedAt = parseInt(row.changedAt.match(/<t:(\d+):d>/)[1]);

          if (!userMap.has(key)) {
            userMap.set(key, []);
          }

          userMap.get(key).push({ ...row, changedAt });
        });

        userMap.forEach((records, key) => {
          records.sort((a, b) => a.changedAt - b.changedAt);

          let previousRecord = null;

          records.forEach((record, index) => {
            if (previousRecord && (record.changedAt - previousRecord.changedAt <= 60)) {
              db.run(`
                DELETE FROM Prevnames
                WHERE id = ?
              `, [record.id], (err) => {
                if (err) {
                  console.error(err.message);
                } else {
                  console.log(`Duplicate entry with ID ${record.id} deleted for user_id ${record.user_id}, name ${record.name}, changedAt ${record.changedAt}.`);
                }
              });
            } else {
              previousRecord = record;
            }
          });
        });

        db.run("COMMIT", (err) => {
          if (err) {
            console.error("Commit failed:", err.message);
            return reject("Commit failed: " + err.message);
          } else {
            console.log("Duplicates removed and changes committed.");
            resolve("Duplicates removed and changes committed.");
          }
        });
      });
    });
  });
}

module.exports = { removeDuplicates };
