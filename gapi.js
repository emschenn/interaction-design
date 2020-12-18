const fs = require("fs");
const async = require("async");
const readline = require("readline");
const { google } = require("googleapis");
const SCOPES = ["https://www.googleapis.com/auth/drive"];
const TOKEN_PATH = "token.json";

let mp3Id = "";
let url = "";
new Promise(function getURL() {
  fs.readFile("credentials.json", (err, content) => {
    if (err) return console.log("Error loading client secret file:", err);
    authorize(JSON.parse(content), uploadFile);
  });
}).then(() => {
  console.log(mp3Id);
  url = `https://drive.google.com/file/d/${mp3Id}/view?usp=sharing`;
  console.log(url);
});

function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client); //list files and upload file
    //callback(oAuth2Client, '0B79LZPgLDaqESF9HV2V3YzYySkE');//get file
  });
}

function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error("Error retrieving access token", err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client).them(updateFile(mp3Id));
    });
  });
}

function uploadFile(auth) {
  const drive = google.drive({ version: "v3", auth });
  var fileMetadata = {
    name: "test.mp3",
  };
  var media = {
    mimeType: "audio/mpeg",
    body: fs.createReadStream("the-alphabeat.mp3"),
  };
  drive.files.create(
    {
      resource: fileMetadata,
      media: media,
      fields: "id",
    },
    function (err, res) {
      if (err) {
        // Handle error
        console.log(err);
      } else {
        console.log("File Id: ", res.data.id);
        updateFile(auth, res.data.id);
        mp3Id = res.data.id;
      }
    }
  );
}

function updateFile(auth, fileId) {
  const drive = google.drive({ version: "v3", auth });
  var permissions = [
    {
      type: "anyone",
      role: "writer",
    },
  ];
  async.eachSeries(
    permissions,
    function (permission, permissionCallback) {
      drive.permissions.create(
        {
          resource: permission,
          fileId: fileId,
          fields: "id",
        },
        function (err, res) {
          if (err) {
            // Handle error...
            console.error(err);
            permissionCallback(err);
          } else {
            console.log("Permission ID: ", res.id);
            permissionCallback();
          }
        }
      );
    },
    function (err) {
      if (err) {
        // Handle error
        console.error(err);
      } else {
        // All permissions inserted
      }
    }
  );
}
