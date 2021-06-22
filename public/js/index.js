let state = 0;

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
let qrDone = false;
let style = 1;
let replay = false;

const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min) * 1000;
};

// ✨ set random start time here ✨
const rnd_start_time = getRandomInt(1, 2);

window.onload = () => init();

const init = () => {
  //$(".ui.modal").modal("show");

  audio = { data: null, name: "" };
  flag = false;
  qrDone = false;
  replay = false;
  var d = new Date();
  var n = d.getDate();
  document.getElementById("date").innerHTML = n + " Jun, 2021";
  $(".canva").hide();
};

const randomRecording = () => {
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
      }, 5000); //16000
    });
  };
  randomlyStart().then(randomlyStop);
};

const generate = () => {
  let formdata = new FormData(); //create a from to of data to upload to the server
  formdata.append("soundBlob", audio.data, audio.name); // append the sound blob and the name of the file. third argument will show up on the server as req.file.originalname

  fetch("/save-audio", {
    method: "POST",
    body: formdata,
    headers: {
      enctype: "multipart/form-data",
    },
  })
    .then((res) => {
      if (res.status === 200 && !replay) clearCanvas();
    })
    .then(() => {
      if (!replay) geneQrcode();
      else {
        $("#date").show();
        $("#qrcode").show();
      }
      runP5();
    });
};

const clearCanvas = () => {
  clear();
  $("#qrcode").empty();
  $("#date").hide();
  $(".canva").show();
};

// $("#print").click(() => {
//   html2canvas(document.querySelector(".canva")).then((canvas) => {
//     const data = {
//       url: canvas.toDataURL("image/jpeg", 0.8),
//       name: audio.name,
//     };
//     fetch("/save-image", {
//       method: "POST",
//       body: JSON.stringify(data),
//       headers: {
//         "content-type": "application/json",
//       },
//     });
//     $(".ui.modal .content .image").empty();
//     $(".ui.modal .content .image").append(canvas);
//     $(".ui.modal .content .image canvas").css({
//       width: `${400 * (5 / 9)}px`,
//       height: `${608 * (5 / 9)}px`,
//     });
//     $("#uploadImage").html("<em>Upload</em> Img");
//     $(".ui.modal").modal("show");
//   });
// });

$(".start-button").on("click", function () {
  if ($(this).hasClass("disable")) return;
  clearCanvas();
  if (state === 0) {
    $(".start-button").text("recording...");
    randomRecording();
    replay = false;
  } else if (state === 1) {
    generate();
    state = 0;
  }
});

$("ul").on("click", "li", function () {
  if ($(this).hasClass("disable")) return;
  if ($(this).hasClass("select")) return;
  $("li").removeClass("select");
  $(this).addClass("select");
  style = $(this).attr("value");
  if (style === 2) {
    drawingContext.shadowColor = color(255, 100);
    drawingContext.shadowOffsetY = -3;
    drawingContext.shadowBlur = 2;
    pixelDensity(3);
  } else if (style === 3) {
    pixelDensity(2);
  }
  if (state == 1) {
    replay = true;
    generate();
  }
});

const runP5 = async () => {
  s = await new Promise((resolve, reject) => {
    new p5.SoundFile(
      `saved_audio/2021-06-22T06_30_22.202Z.wav`,
      (s) => {
        resolve(s);
        s.loop = false;
        s.play();
        console.log("start the song");
        s.onended(sayDone);
        flag = true;
        $("li").addClass("disable");
        $(".start-button").addClass("disable");
      },
      (err) => {
        reject(err);
        console.log(err);
      }
    );
  });
};

function sayDone(elt) {
  $("li").removeClass("disable");
  $(".start-button").removeClass("disable");
  flag = false;
}

const geneQrcode = () => {
  const data = { audio: audio.name };
  fetch("/upload-audio-google", {
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
      console.log(url);
      new QRCode("qrcode", {
        text: url,
        width: 100,
        height: 100,
      });
    })
    .then(() => {
      $("#qrcode").fadeIn(300);
      qrDone = true;
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
        state = 1;
        $(".start-button").text("start");
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

  // div.appendChild(au);
  // div.appendChild(link);
  // recordingsList.appendChild(div);
}

function __log(e, data) {
  console.log("\n" + e + " " + (data || ""));
}

//clientID 923508977284-9t191qu67stf4v17t0i1p82ftlh573bj.apps.googleusercontent.com
//clientSecret CzUURSoMFb3BAFNBMpGFNVyG
