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

function drawSpectrum1() {
  spectrum = fft.analyze();
  for (var i = 0; i < spectrum.length; i++) {
    translate(0, 0);
    let h = map(spectrum[i], 0, 200, 0, 100);
    let dis = map(i, 0, 1023, 0, 500);
    rotate(frameCount / 76);
    ellipse(random(-50, 50) * cos(dis), random(-50, 50) * sin(dis), h / 30);
  }
}

function drawSpectrum2() {
  let spectrum = fft.analyze();
  shearX(PI / 4.0);
  bass = fft.getEnergy("bass");
  lowMid = fft.getEnergy("lowMid");
  mid = fft.getEnergy("mid");
  highMid = fft.getEnergy("highMid");
  treble = fft.getEnergy("treble");
  let bins = [bass, lowMid, mid, highMid, treble];
  beginShape();
  for (var i = 0; i < spectrum.length / 2; i++) {
    let h = map(spectrum[i], 0, 200, 0, 100);
    let dis = map(i, 0, 1023, 0, 1000);
    if (bins[0] / 2.4 + bins[1] / 1.8 > bins[3] + bins[4] + bins[2] / 2) {
      fill(
        treble * 2 + highMid * random(0.2, 0.6),
        250 - random(1, 3) * highMid,
        (bass * random(0.2, 0.5) * h) / 20
      );
    } else {
      fill(
        (highMid * h * dis) / 70 + mid + treble,
        mid * random(h / 20, 0.1) + lowMid * random(0.6, h / 100),
        0
      );
    }
    ellipse(-250 + dis * 0.5 + h / 5, -h * 2, h / 40);
    if (h < 2) {
      noFill();
    }
  }
  endShape();
}

function drawSpectrum3() {
  spectrum = fft.analyze();
  for (var i = 0; i < spectrum.length; i++) {
    translate(0, 0);
    let h = map(spectrum[i], 0, 200, 0, 100);
    let dis = map(i, 0, 1023, 0, 500);
    ellipse(
      random(5, 15) + random(30, 80) * (1 + sin(frameCount % 180)),
      random(5, 15) + random(30, 80) * (1 + cos(frameCount % 180)),
      h / 50
    );
  }
}
function draw() {
  // background(255)
  if (flag) {
    if (style == 1) {
      bass = fft.getEnergy("bass");
      lowMid = fft.getEnergy("lowMid");
      mid = fft.getEnergy("mid");
      highMid = fft.getEnergy("highMid");
      treble = fft.getEnergy("treble");
      let bins = [bass, lowMid, mid, highMid, treble];
      noStroke();
      translate(width / 2, height / 2);
      translate(random(-700, 700), random(-700, 700));
      rotate(frameCount / 76);
      if (bins[0] / 2.4 + bins[1] / 1.4 > bins[3] + bins[4] + bins[2] / 2) {
        scale((lowMid / 110) * random(0.28, 0.8) + bass / 450);
        fill(0, lerp(mid * 2.4, lowMid, 0.7), bass * 2.2 * random(0.5, 1.2));
      } else {
        scale(treble / 60 + highMid / 800 + random(0.1, 0.5));
        fill(
          treble * random(1, 4) + highMid * random(1, 1.5),
          255 - mid * random(0.2, 3),
          0
        );
      }
      drawSpectrum1();
    } else if (style == 2) {
      fill(0);
      noStroke();
      translate(width / 2, height / 2);
      rotate(frameCount / 50);
      drawSpectrum2();
    } else if (style == 3) {
      bass = fft.getEnergy("bass");
      lowMid = fft.getEnergy("lowMid");
      mid = fft.getEnergy("mid");
      highMid = fft.getEnergy("highMid");
      treble = fft.getEnergy("treble");
      let bins = [bass, lowMid, mid, highMid, treble];
      noStroke();
      translate(width / 2, height / 2);
      translate(random(-700, 700), random(-700, 700));
      // calm happy fearful disgust四種模式
      if (emotion == "happy") {
        if (bins[0] / 2.4 + bins[1] / 1.4 > bins[3] + bins[4] + bins[2] / 2) {
          scale((lowMid / 140) * random(0.2, 0.8) + bass / 500);
          fill(
            lowMid + mid * random(1, 1.5),
            random(100, 255),
            255 - bass / 4 - random(100, 200)
          );
        } else {
          scale(treble / 30 + highMid / 550 + random(0.4, 0.75));
          fill(
            highMid * random(2, 4) + treble * random(4, 12),
            lowMid * random(0.1, 0.5) + treble * random(1.5, 8),
            0
          );
        }
      }
      if (emotion == "disgust") {
        if (bins[0] / 2.4 + bins[1] / 1.4 > bins[3] + bins[4] + bins[2] / 2) {
          scale((lowMid / 100) * random(0.2, 0.8) + bass / 500);
          fill(
            lowMid * random(1, 5),
            bass * random(0.6, 1.5) + lowMid / 2,
            highMid * random(1, 1.5) + bass
          );
        } else {
          scale(treble / 30 + highMid / 550 + random(0.3, 0.75));
          fill(
            treble * random(highMid / treble, (mid * 1.5) / treble),
            treble * random(2, 10),
            150 + highMid * random(1, 1.5)
          );
        }
      }
      if (emotion == "calm") {
        if (bins[0] / 2.4 + bins[1] / 1.4 > bins[3] + bins[4] + bins[2] / 2) {
          scale((lowMid / 100) * random(0.2, 0.8) + bass / 500);
          fill(0, lerp(mid * 2, lowMid, 0.7), bass * 2 * random(0.5, 1.5));
        } else {
          scale(treble / 30 + highMid / 450 + random(0.3, 0.85));
          fill(
            0,
            mid * random(1, 1.6) + highMid * random(1, 1.5),
            lerp(mid * 2, lowMid, 0.7)
          );
        }
      }
      if (emotion == "fearful") {
        if (bins[0] / 2.4 + bins[1] / 1.4 > bins[3] + bins[4] + bins[2] / 2) {
          scale((lowMid / 120) * random(0.1, 0.8) + bass / 500);
          fill(0, lerp(mid, lowMid, random(0.7, 0.9)), random(0, 100));
        } else {
          scale(treble / 50 + highMid / 4000 + random(0.2, 0.6));
          fill(
            random(50, 100),
            treble * random(1, 5),
            255 - mid * random(1, 2) + highMid * random(1, 2)
          );
        }
      }

      drawSpectrum3();
    }
    if (replay == true) {
      $("#print").hide();
      if (s.isPlaying()) replay = false;
    } else if (!s.isPlaying() && qrDone) {
      $("#print").fadeIn(1500);
      $("#replayButton").fadeIn(1500);
      $("#resetButton").fadeIn(1500);
    }
    // console.log("Bass: "+bass+" lowMid: "+lowMid+" mid: "+mid+" highMid: "+highMid+" treble: "+treble);
  }
}

// Chrome 70 will require user gestures to enable web audio api
// Click on the web page to start audio
function touchStarted() {
  getAudioContext().resume();
}
