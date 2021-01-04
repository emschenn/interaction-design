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
let emotion;
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
const rnd_start_time = getRandomInt(1, 10);

window.onload = () => init();
$("#resetButton").click(() => init());

const init = () => {
  //$(".ui.modal").modal("show");

  audio = { data: null, name: "" };
  flag = false;
  qrDone = false;
  replay = false;
  var d = new Date();
  var n = d.getDate();
  document.getElementById("date").innerHTML = n + " Jan, 2021";
  $("#canva").hide();
  $("#placeholder").hide();
  $("#startButton").show();
  $("#description").hide();
  $("#progressBar").hide();
  $("#replayButton").hide();
  $("#resetButton").hide();
  $("#print").hide();
  $("#qrcode").hide();
  $("#recorder").hide();
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
      }, 16000); //16000
    });
  };
  randomlyStart().then(randomlyStop);
};

$("#startButton").click(() => {
  $("#startButton").fadeOut("", () => {
    $("#startButton").hide();
    $("#progressBar").fadeIn(300);
    $("#description").fadeIn(300);
    $("#recorder").show(300);
  });
  randomRecording();
  const elem = document.getElementById("counter");
  let wid = 60;
  let id = setInterval(frame, 100); //200
  function frame() {
    if (wid == 365) {
      $("#recorder").hide();
      $("#placeholder").fadeIn(300);
      $("#description").fadeOut(500);
      $("#progressBar").fadeOut(500);
      clearInterval(id);
    } else {
      wid = wid + 1;
      elem.style.width = wid + "px";
    }
  }
});

$("#placeholder").click(() => {
  $("#placeholder .play").hide();
  $(".on-hover").hide();
  $("#placeholder .choose-style").fadeIn(300);

  // $("#placeholder").fadeOut(300);
  //generate();
});

$("#placeholder .choose-style #style1").click(() => {
  $("#placeholder").fadeOut(300);
  style = 1;
  generate();
});
$("#placeholder .choose-style #style2").click(() => {
  $("#placeholder").fadeOut(300);
  style = 2;
  drawingContext.shadowColor = color(255, 100);
  drawingContext.shadowOffsetY = -3;
  drawingContext.shadowBlur = 2;
  pixelDensity(3);
  generate();
});
$("#placeholder .choose-style #style3").click(() => {
  $("#placeholder").fadeOut(300);
  style = 3;
  pixelDensity(2);
  generate();
});

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
    .then(analysisEmotion)
    .then(() => {
      if (!replay) geneQrcode();
      else {
        $("#date").show();
        $("#qrcode").show();
      }
      runP5();
    });
};

$("#print").click(() => {
  html2canvas(document.querySelector("#canva")).then((canvas) => {
    const data = {
      url: canvas.toDataURL("image/jpeg", 0.8),
      name: audio.name,
    };
    fetch("/save-image", {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "content-type": "application/json",
      },
    });
    $(".ui.modal .content .image").empty();
    $(".ui.modal .content .image").append(canvas);
    $(".ui.modal .content .image canvas").css({
      width: `${400 * (5 / 9)}px`,
      height: `${608 * (5 / 9)}px`,
    });
    $("#uploadImage").html("<em>Upload</em> Img");
    $(".ui.modal").modal("show");
  });
});

$("#uploadImage").click(() => {
  $("#uploadImage").text("Uploading...");
  const data = { image: audio.name };
  fetch("/upload-image-google", {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "content-type": "application/json",
    },
  }).then((res) => {
    if (res.status === 200) {
      $("#uploadImage").html("<em>Done!</em>");
      //$("#uploadImage").attr("disabled", true);
      return res.json();
    } else return `error: ${res.err}`;
  });
});

$("#replayButton").click(() => {
  replay = true;

  $("#placeholder").fadeIn(300);
  $("#placeholder .choose-style").fadeIn(300);
  $("#qrcode").hide();
  $("#date").hide();
  $("#print").hide();

  clear();
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
      emotion = result.emotion;
      console.log(emotion);
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
