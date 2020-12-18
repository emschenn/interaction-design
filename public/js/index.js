// webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

let gumStream; //stream from getUserMedia()
let recorder; //WebAudioRecorder object
let input; //MediaStreamAudioSourceNode  we'll be recording
let encodingType; //holds selected encoding for resulting audio (file)
let encodeAfterRecord = true; // when to encode

// shim for AudioContext when it's not avb.
let AudioContext = window.AudioContext || window.webkitAudioContext;
//new audio context to help us record
let audioContext;

let audio = { data: null, name: "" };

// var for p5
let s;
let flag = false;

const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min) * 1000;
};

// ✨ set random start time here ✨
const rnd_start_time = getRandomInt(1, 5);

window.onload = () => init();
$("#restartButton").click(() => init());

const init = () => {
  audio = { data: null, name: "" };
  var d = new Date();
  var n = d.getDate();
  document.getElementById("date").innerHTML = n + " Dec, 2020";
  $("#canva").hide();
  stopButton.disabled = true;
  printButton.disabled = true;
  saveButton.disabled = true;
  restartButton.disabled = true;
};

$("#recordButton").click(() => {
  new Promise(function (resolve) {
    recordButton.disabled = true;
    randomButton.disabled = true;
    stopButton.disabled = false;
    saveButton.disabled = true;
    resolve("start recoding");
  }).then(startRecording());
});

$("#stopButton").click(() => {
  new Promise(function (resolve) {
    recordButton.disabled = false;
    randomButton.disabled = false;
    stopButton.disabled = true;
    saveButton.disabled = false;
    resolve("stop recoding");
  }).then(stopRecording());
});

$("#randomButton").click(() => {
  randomButton.disabled = true;
  recordButton.disabled = true;
  stopButton.disabled = true;
  saveButton.disabled = true;

  const randomlyStart = () => {
    return new Promise(function (resolve) {
      window.setTimeout(function () {
        startRecording();
        resolve("start recoding");
      }, rnd_start_time);
    });
  };
  const randomlyStop = () => {
    return new Promise(function (resolve) {
      window.setTimeout(function () {
        stopRecording();
        resolve("stop recoding");
      }, 16000);
    });
  };
  const buttonEnabled = () => {
    return new Promise(function () {
      randomButton.disabled = false;
      recordButton.disabled = false;
      stopButton.disabled = true;
      saveButton.disabled = false;
    });
  };
  randomlyStart().then(randomlyStop).then(buttonEnabled);
});

$("#saveButton").click(() => {
  let formdata = new FormData(); //create a from to of data to upload to the server
  formdata.append("soundBlob", audio.data, audio.name); // append the sound blob and the name of the file. third argument will show up on the server as req.file.originalname

  fetch("/upload", {
    method: "POST",
    body: formdata,
    headers: {
      enctype: "multipart/form-data",
    },
  })
    .then((res) => {
      if (res.status === 200) clearCanvas();
    })
    .then(analysisEmotion)
    .then(() => {
      geneQrcode();
      runP5();
    })
    .then(() => {
      restartButton.disabled = false;
      printButton.disabled = false;
    });
});

$("#printButton").click(() => {
  html2canvas(document.querySelector("#canva")).then((canvas) => {
    $(".ui.modal .content .image").empty();
    $(".ui.modal .content .image").append(canvas);
    $(".ui.modal .content .image canvas").css({
      width: `${400 * (5 / 9)}px`,
      height: `${608 * (5 / 9)}px`,
    });
    $(".ui.modal").modal("show");
  });
});

const clearCanvas = () => {
  clear();
  $("#qrcode").empty();
  $("#canva").show();
};

const analysisEmotion = () => {
  fetch(`/get-emotion?audio=${audio.name}`, {
    method: "GET",
  })
    .then((res) => {
      if (res.status === 200) return res.json();
      else return `error: ${res.err}`;
    })
    .then((result) => {
      console.log(result.emotion);
    });
};

const runP5 = async () => {
  s = await new Promise((resolve, reject) => {
    new p5.SoundFile(
      `saved_audio/${audio.name}`,
      (s) => resolve(s),
      (err) => reject(err)
    );
  });
  s.play();
  flag = true;
};

const geneQrcode = () => {
  const data = { audio: audio.name };
  fetch("/get-url", {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "content-type": "application/json",
    },
  })
    .then((res) => {
      if (res.status === 200) return res.json();
      else return `error: ${res.err}`;
    })
    .then((result) => {
      const url = `https://drive.google.com/file/d/${result.fileId}/view?usp=sharing`;
      new QRCode(document.getElementById("qrcode"), url);
    });
};

//record audio function
function startRecording() {
  __log("startRecording() called");
  var constraints = { audio: true, video: false };
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(function (stream) {
      __log(
        "getUserMedia() success, stream created, initializing WebAudioRecorder..."
      );
      audioContext = new AudioContext();

      gumStream = stream;
      input = audioContext.createMediaStreamSource(stream);
      encodingType = "wav";

      recorder = new WebAudioRecorder(input, {
        workerDir: "js/recorder/", // must end with slash
        encoding: encodingType,
        numChannels: 2, //2 is the default, wav encoding supports only 2
        onEncoderLoading: function (recorder, encoding) {
          __log("Loading " + encoding + " encoder...");
        },
        onEncoderLoaded: function (recorder, encoding) {
          __log(encoding + " encoder loaded");
        },
      });
      recorder.onComplete = function (recorder, blob) {
        __log("Encoding complete");
        audio.data = blob;
        createDownloadLink(blob, recorder.encoding);
      };
      recorder.setOptions({
        timeLimit: 120,
        encodeAfterRecord: encodeAfterRecord,
        ogg: { quality: 0.5 },
        wav: { bitRate: 160 },
      });
      recorder.startRecording();
      __log("Recording started");
    })
    .catch(function (err) {
      recordButton.disabled = false;
      stopButton.disabled = true;
    });
}

function stopRecording() {
  __log("stopRecording() called");
  gumStream.getAudioTracks()[0].stop();
  recorder.finishRecording();
  __log("Recording stopped");
}

function createDownloadLink(blob, encoding) {
  var url = URL.createObjectURL(blob);
  var au = document.createElement("audio");
  var div = document.createElement("div");
  var link = document.createElement("p");
  var fileReader = new FileReader();
  fileReader.onload = function (e) {
    data = e.target.result;
  };
  fileReader.readAsDataURL(blob);

  au.controls = true;
  au.src = url;

  link.href = url;
  link.download = new Date().toISOString() + "." + encoding;
  link.innerHTML = link.download;
  audio.name = link.download.replace(/:/gi, "_");

  div.innerHTML = "";
  recordingsList.innerHTML = "";

  // div.appendChild(au);
  // div.appendChild(link);
  // recordingsList.appendChild(div);
}

function __log(e, data) {
  console.log("\n" + e + " " + (data || ""));
}

//clientID 923508977284-9t191qu67stf4v17t0i1p82ftlh573bj.apps.googleusercontent.com
//clientSecret CzUURSoMFb3BAFNBMpGFNVyG
