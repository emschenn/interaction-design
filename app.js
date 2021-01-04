const express = require("express");
const fs = require("mz/fs");
const multer = require("multer"); //use multer to upload blob data
const upload = multer(); // set multer to be the upload variable (just like express, see above ( include it, then use it/set it up))
const async = require("async");
const readline = require("readline");
const { google } = require("googleapis");
const { PythonShell } = require("python-shell");
const { file } = require("googleapis/build/src/apis/file");

const SCOPES = ["https://www.googleapis.com/auth/drive"];
const TOKEN_PATH = "./google_api/token.json";
const CREDENTIALS_PATH = "./google_api/credentials.json";
const PYTHON_SCRIPT_PATH = "./analysis_emotion/main.py";
const SAVED_AUDIO_PATH = "/public/saved_audio/";
const SAVED_IMAGE_PATH = "/public/saved_image/";

const app = express();
app.use(express.static("public"));
app.use(express.json({ limit: "50mb" }));

app.post("/upload-audio-google", uploadAudioToGoogle);

app.post("/upload-image-google", uploadImageToGoogle);

app.get("/get-emotion", pythonProcess);

app.post("/save-audio", upload.single("soundBlob"), function (req, res, next) {
  //console.log(req.file); // see what got uploaded
  let uploadLocation = __dirname + SAVED_AUDIO_PATH + req.file.originalname; // where to save the file to. make sure the incoming name has a .wav extension
  try {
    fs.writeFileSync(
      uploadLocation,
      Buffer.from(new Uint8Array(req.file.buffer))
    );
  } catch (err) {
    console.error(err);
  }
  res.sendStatus(200);
});

app.post("/save-image", function (req, res) {
  const { url, name } = req.body;
  const data = url.replace(/^data:image\/\w+;base64,/, "");
  const filename = name.replace(".wav", ".jpeg");
  let uploadLocation = __dirname + SAVED_IMAGE_PATH + filename;
  try {
    fs.writeFile(uploadLocation, Buffer.from(data, "base64"));
  } catch (err) {
    console.error(err);
  }
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

/*
 *
 get-emotion: 
  - run python script with pre-trained model
  - return emotion
 *
 */
function pythonProcess(req, res) {
  let options = {
    args: req.query.audio,
  };
  console.log(options);
  PythonShell.run(PYTHON_SCRIPT_PATH, options, (err, data) => {
    console.log(data);
    if (err) return res.status(400).send(err);
    return res.status(200).send({
      emotion: data[0],
    });
  });
}

/*
 *
upload-audio-google:
  - upload audio file to google drive
  - set the permissions to anyone can read
  - return share url
 *
 */
function uploadImageToGoogle(req, res) {
  let filename = req.body.image;
  filename = filename.replace(".wav", ".jpeg");
  console.log(filename);
  const folderId = "1H66g3Z9AmuECBpa-8lRyj2VUnt7D6hIt";
  const resource = {
    name: filename,
    parents: [folderId],
  };
  const media = {
    mimeType: "image/jpeg",
    body: fs.createReadStream(`./public/saved_image/${filename}`),
  };
  fs.readFile(CREDENTIALS_PATH, (err, content) => {
    if (err) return res.status(400).send(err);
    authorize(JSON.parse(content), resource, media, res);
  });
}

function uploadAudioToGoogle(req, res) {
  const filename = req.body.audio;
  const resource = {
    name: filename,
  };
  const media = {
    mimeType: "audio/mpeg",
    body: fs.createReadStream(`./public/saved_audio/${filename}`),
  };
  fs.readFile(CREDENTIALS_PATH, (err, content) => {
    if (err) return res.status(400).send(err);
    authorize(JSON.parse(content), resource, media, res);
  });
}

function authorize(credentials, resource, media, res) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client);
    oAuth2Client.setCredentials(JSON.parse(token));
    return uploadFile(oAuth2Client, resource, media, res);
  });
}

function getAccessToken(oAuth2Client) {
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
      uploadFile(oAuth2Client);
    });
  });
}

function uploadFile(auth, resource, media, res) {
  const drive = google.drive({ version: "v3", auth });
  drive.files.create(
    {
      resource: resource,
      media: media,
      fields: "id",
    },
    function (err, { data }) {
      if (err) {
        console.log(err);
      } else {
        console.log("File Id: ", data.id);
        updateFile(auth, data.id, res);
        return data.id;
      }
    }
  );
}

function updateFile(auth, fileId, res) {
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
        function (err) {
          if (err) {
            console.error(err);
            permissionCallback(err);
          } else {
            console.log("Permission ID: ", res.id);
            permissionCallback();
            return res.status(200).send({
              fileId: fileId,
            });
          }
        }
      );
    },
    function (err) {
      if (err) console.error(err);
    }
  );
}
