
From a slow technology perspective, we designed Pablo to visualize auditory memories and explore the recalling processes. Pablo randomly records daily sound of users, visualizes the sound into an abstract image and prints it out with QR code of the sound file. In this manner, Pablo introduces time gaps for users to speculate and recall after they receive the picture card. We conducted a field trial with two participants and each with Pablo at home for two days.

We found that Pablo encourages the users to reflect on their memories in different aspects. Through associating images with sound and memories, the users give new interpretations on images. They start to think and reflect due to the slowness of this sense-making process and interact with their embodied memories 💭
[👉🏼 see the whole research atricle](https://dl.acm.org/doi/10.1145/3450741.3466630)

## README
This is a web for demonstrate the concept of Pablo: Once the TRY button is pressed, It will randomly record in the certain time interval and generate the picture card of the sound 🖨

### 👷🏻‍♀️ Built with
* [Express.js](https://expressjs.com/): node.js backend framework with multer for handling multipart/form-data 
* [WebAudioRecorder.js](https://github.com/higuma/web-audio-recorder-js): record audio
* [p5.js](https://p5js.org/): visualize audio
* [googleapis](https://developers.google.com/drive/api/v3/quickstart/nodejs): using Google Drive API to uplaod audio and return the url to access the audio
* [qrcode.js](https://davidshimjs.github.io/qrcodejs/): generate QR Code
* [html2canvas](https://html2canvas.hertzen.com/): transform the picture card to the jpeg file


### 👩🏻‍💻 Setup
1. Clone this repo to your desktop and run `npm install` to install all the dependencies
2. Generate your own `credentials.json` by following the [instruction](https://developers.google.com/maps/documentation/maps-static/get-api-key) and place the file in google_api/
4. Change the `folderId` to the ID of your google dirve folder where you want to upload the audio
5. Start the server by running `node app.js`

