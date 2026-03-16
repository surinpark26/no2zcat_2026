let img;
let fft;
let amplitude;
let audio;

let blink = 0;
let blinkTarget = 0;

let eyeRows = [];

function preload() {

  img = loadImage("/image/eyes.jpg");

}

function setup() {

  createCanvas(windowWidth, windowHeight);

  imageMode(CENTER);

  fft = new p5.FFT(0.8,1024);
  audio = loadSound(URL.createObjectURL(file), () => {

  audio.loop();
  amplitude.setInput(audio);

});

  const fileInput = document.getElementById("audioFile");

  if(fileInput){

    fileInput.addEventListener("change", e => {

      const file = e.target.files[0];

      if(file){

        if(audio){
          audio.stop();
        }

        audio = loadSound(URL.createObjectURL(file), () => {

          audio.loop();

        });

      }

    });

  }

  eyeRows = [
    img.height * 0.35,
    img.height * 0.50,
    img.height * 0.65
  ];

}

function draw() {

  background(0);

  translate(width/2, height/2);

  let scaleFactor = min(width/img.width, height/img.height) * 0.9;

  scale(scaleFactor);

  let level = amplitude.getLevel();

  if(level > 0.18 && blink < 0.05){

    blinkTarget = 1;

  }

  blink = lerp(blink, blinkTarget, 0.25);

  blinkTarget = lerp(blinkTarget, 0, 0.05);
  blinkTarget = sin(frameCount * 0.1) * 0.5 + 0.5;

  image(img,0,0);

  drawBlink(blink);

}

function drawBlink(amount){

  push();

  translate(-img.width/2, -img.height/2);

  noStroke();
  fill(0);

  for(let r of eyeRows){

    let h = 40 * amount;

    rect(0, r-h, img.width, h);
    rect(0, r, img.width, h);

  }

  pop();

}

function windowResized(){

  resizeCanvas(windowWidth, windowHeight);

}