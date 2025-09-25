# Netlify Serverless Functions Setup

This project uses [Netlify Functions](https://docs.netlify.com/functions/overview/) to run serverless code.  
Follow the steps below to set up and run locally with the `ntl` (Netlify CLI) tool.

---

## 🚀 Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later recommended)
- [Netlify CLI](https://docs.netlify.com/cli/get-started/)  
  Install globally:

  ```bash
  npm install -g netlify-cli
  ```

## 🛠 Setup

Clone the repository

git clone <your-repo-url>
cd <project-folder>

Install dependencies

npm install

"dependencies": {
"@netlify/functions": "^4.2.5",
"cheerio": "^1.1.2",
"dotenv": "^17.2.2",
"parsecurrency": "^1.1.1",
"scrapingbee": "^1.7.5"
},

"devDependencies": {
"@types/jest": "^30.0.0",
"jest": "^30.1.3",
"node-fetch": "^3.3.2",
"ts-jest": "^29.4.4",
"typescript": "^5.9.2"
}

This will install all packages listed in package.json.

Login to Netlify

ntl login

# to run the project

```bash
ntl dev
```

# To run unit test

```bash
npm test
```

---

## 📡 Example Usage with cURL

After running `ntl dev` locally or deploying to Netlify, you can call the serverless function using `curl`.

### Example 1: Query for Nintendo 3DS

```bash
curl "http://localhost:8888/.netlify/functions/comps?q=nintendo+3ds"
```

```bash
curl "http://localhost:8888/.netlify/functions/comps?q=playstation+5"
```

[build]
functions = "functions"
