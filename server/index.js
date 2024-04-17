const fs = require("fs");

let permanentdatabase = "./permanent.json";
let trialdatabase = "./trial.json";

let trialTime = 24;

const crypto = require("crypto");
const http = require("http");
const url = require("url");

const port = 3333;
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === "/newtoken" && parsedUrl.query.key) {
    console.log(parsedUrl.query.key);
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");

    if (parsedUrl.query.key && parsedUrl.query.discordId) {
      const token = await handleNewToken(
        parsedUrl.query.key,
        parsedUrl.query.discordId
      );
      res.end("Received new token: " + token);
    } else {
      res.end("Invalid parameters");
    }
  } else {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain");
    res.end("Not Found");
  }
});

server.listen(port, () => {
  console.log("Server is active and listening on port " + port);
});

async function handleNewToken(keyType, discordId) {
  if (keyType == "trial") {
    return generateTrialKey(discordId);
  } else if (keyType == "permanent") {
    return generatePermKey(discordId);
  } else {
    return "Invalid KeyType";
  }
}

async function generateTrialKey(discordId) {
  const token = await generateToken("trial");
  const expireTime = Date.now() + (await formattedExpireTime());

  let keyData = {
    key: token,
    expireTime: expireTime,
    creationTime: Date.now(),
    discordId: discordId,
    revoked: false,
    sessions: {},
  };

  const jsonData = JSON.stringify(keyData);

  if (!fs.existsSync(trialdatabase)) {
    fs.writeFileSync(trialdatabase, "[" + jsonData + "]");
    return token;
  } else {
    const existingData = JSON.parse(fs.readFileSync(trialdatabase, "utf8"));
    existingData.push(keyData);
    fs.writeFileSync(trialdatabase, JSON.stringify(existingData, null, 2));
    return token;
  }
}

async function generatePermKey(discordId) {
  let token = await generateToken("perm");

  let keyData = {
    key: token,
    creationTime: Date.now(),
    discordId: discordId,
    revoked: false,
    sessions: {},
  };

  const jsonData = JSON.stringify(keyData);

  if (!fs.existsSync(permanentdatabase)) {
    fs.writeFileSync(permanentdatabase, "[" + jsonData + "]");
    return token;
  } else {
    const existingData = JSON.parse(fs.readFileSync(permanentdatabase, "utf8"));
    existingData.push(keyData);
    fs.writeFileSync(permanentdatabase, JSON.stringify(existingData, null, 2));
    return token;
  }
}

async function generateToken(keyType) {
  const randomBytes = await crypto.randomBytes(8);
  const token =
    keyType + "_" + randomBytes.toString("hex").toUpperCase().substr(0, 16);
  return token;
}

function formattedExpireTime() {
  let time = trialTime * 60 * 60 * 1000;
  return time;
}
