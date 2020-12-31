let song, buttton, fft, space_between_lines;

let bass, lowMid, mid, highMid, treble;
let spectrum, level;
// function preload() {
//   s = loadSound("./saved_audio/1.m4a");
// }

function setup() {
  var canvas = createCanvas(340, 340);
  canvas.parent("p5");
  background(255);

  fft = new p5.FFT();
  frameRate(30);
}

function drawSpectrum() {
  spectrum = fft.analyze();
  // shearX(PI / 4.0)
  for (var i = 0; i < spectrum.length / 1.5; i++) {
    translate(0, 0);
    let h = map(spectrum[i], 0, 200, 0, 100);
    let dis = map(i, 0, 1023, 0, 500);
    ellipse(
      random(-30, 30) * cos(frameCount / 360),
      random(-30, 30) * sin(frameCount / 360),
      h / 30
    );
  }
}

function draw() {
  // background(255)
  if (flag) {
    level = s.getLevel();
    bass = fft.getEnergy("bass");
    lowMid = fft.getEnergy("lowMid");
    mid = fft.getEnergy("mid");
    highMid = fft.getEnergy("highMid");
    treble = fft.getEnergy("treble");
    let bins = [bass, lowMid, mid, highMid, treble];
    // fill(0)
    noStroke();
    translate(random(0, 800), random(0, 800));
    // rotate(frameCount/66)
    // let level1 = map(level,0,1,5,50)
    // level1 = lerp(level1,60,0.6)
    if (bins[0] / 3 + bins[1] / 2 > bins[3] + bins[4] + bins[2] / 2) {
      scale(1.3);
      fill(0, lerp(lowMid, mid, 0.6), bass);
    } else {
      scale(1);
      fill(mid * 2, lerp(highMid, bass / 3, 0.7), 0);
    }
    drawSpectrum();
    if (!s.isPlaying() && qrDone) {
      $("#printButton").fadeIn(1500);
      $("#resetButton").fadeIn(1500);
    }
    // console.log("Bass: "+bass+" lowMid: "+lowMid+" mid: "+mid+" highMid: "+highMid+" treble: "+treble);
  }
}

// function mousePressed() {
//   if (s.isPlaying()) {
//     s.pause();
//     // s.reset()
//     // translate(random(width),random(height))
//     draw();
//   } else {
//     s.play();
//     // background(255);
//   }
// }

// Chrome 70 will require user gestures to enable web audio api
// Click on the web page to start audio
function touchStarted() {
  getAudioContext().resume();
}
