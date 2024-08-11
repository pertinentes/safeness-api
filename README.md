# Safeness Prevnames API

This project is an API designed to manage users' previous names, intended for use with the [safeness-prevnames](https://www.npmjs.com/package/safeness-prevnames) module. The API allows you to save, retrieve, and manage users' previous names in a SQLite database.

## Features

- **Save Previous Names:** Store users' previous names in the database.
- **Retrieve Previous Names:** Fetch the previous names of a specific user.
- **Delete Previous Names:** Remove all previous names for a given user.
- **Count Previous Names:** Get the total count of previous names stored in the database.

## Setup and Installation

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (version 16 or higher)

### 2. Install Dependencies

Clone this repository and then install the necessary dependencies:

```bash
git clone https://github.com/pertinentes/safeness-api.git
cd safeness-api
npm install
```

### 3. Configuration

Create a `config.js` file with the necessary configuration settings for the server. You will need to specify an access key to secure your API, along with your Discord token and webhook URLs.

Example `config.js`:

```javascript
module.exports = {
  token: '', // Your Discord Token
  dev: '', // Your Discord User ID
  startWebhookUrl: '', // Your Discord start webhook URL
  errorWebhookUrl: '', // Your Discord error webhook URL
};
```

### 4. Generate an Access Key

To secure your API, you need to generate an access key. Use the `getKey` command with the bot to generate a key that will be used in API requests.

Run the following command:

```bash
/getKey
```

This will generate a new access key. Copy the key and use it in your API requests as described below.

### 5. Start the Server

To start the API, run the following command:

```bash
node api.js
```

The server will then be accessible at `http://localhost:20005`.

### 6. Using the API

#### 1. Save a Previous Name

```http
POST /api/prevnames/save
```

Headers:
- `X-Access-Key: your-access-key`

Body (JSON):
```json
{
  "user_id": "userID",
  "username": "userUsername",
  "name": "userDisplayName",
  "changedAt": "2024-08-11T00:00:00Z"
}
```

#### 2. Retrieve Previous Names for a User

```http
GET /api/prevnames/users/:user_id
```

Headers:
- `X-Access-Key: your-access-key`

#### 3. Delete Previous Names for a User

```http
GET /api/prevnames/clear/:user_id
```

Headers:
- `X-Access-Key: your-access-key`

#### 4. Count the Total Number of Previous Names

```http
GET /api/prevnames/count
```

Headers:
- `X-Access-Key: your-access-key`

## Important Links

- **npm Module:** [safeness-prevnames](https://www.npmjs.com/package/safeness-prevnames)
- **GitHub Repository:** [Link to GitHub Repo](https://github.com/pertinentes/safeness-prevnames)

## Contributing

Contributions are welcome! If you would like to contribute to this project, consider starring this project it would be greatly appreciated!

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
