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

This will install all packages listed in package.json.

Login to Netlify

ntl login

```bash
ntl dev
```

to run the project

[build]
functions = "functions"
