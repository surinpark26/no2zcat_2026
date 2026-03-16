let song, fft, noiseGen, themeColor, activeColor;
let userIP = "0.0.0.0";
let isBasicMode = false;
let fontData = "◆●▲$@B%8&WM#*o2zcathkbdpqwmZQLCJUYX○◇△zcvuxrjf?-_+~<>i!;:,\"^`'. ";

let uiPos, uiVel;
let frozenCells = {}; // 멈춘 셀 정보를 담는 객체
const COLS = 80;
const ROWS = 50;

function setup() {
    createCanvas(windowWidth, windowHeight);
    activeColor = color(255);
    uiPos = createVector(random(50, 100), random(50, 100));
    uiVel = createVector(0.4, 0.3);

    fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => {
            userIP = data.ip;
            document.getElementById('ip-val').innerText = userIP;
            let p = userIP.split('.');
            themeColor = color(map(p[0]||0,0,255,150,255), map(p[1]||0,0,255,150,255), map(p[2]||0,0,255,150,255));
        });

    fft = new p5.FFT(0.9, 1024);
    noiseGen = new p5.Noise('white');
    noiseGen.amp(0);
    noiseGen.start();

    document.getElementById('audioFile').onchange = (e) => {
        if (song) song.stop();
        song = loadSound(URL.createObjectURL(e.target.files[0]), () => song.play());
    };
    document.getElementById('basicColorBtn').onclick = () => isBasicMode = true;
    document.getElementById('ipColorBtn').onclick = () => isBasicMode = false;
}

function draw() {
    fft.analyze();
    let subBass = fft.getEnergy(20, 60);
    let kick = fft.getEnergy(60, 150);
    let mid = fft.getEnergy(500, 2000);

    background(0, map(subBass, 0, 255, 30, 90));
    activeColor = isBasicMode ? color(255) : (themeColor || color(0, 255, 0));

    if (song && song.isPlaying()) {
        // --- 데이터 프리즈 트리거 ---
        if (kick > 205 || subBass > 225) {
            triggerFreeze(mid, kick);
        }

        // 아스키 렌더링 (프리즈 처리 포함)
        drawGlitchAscii(mid, kick, activeColor);
        
        // 픽셀 소팅 효과
        if (kick > 210) {
            let x = random(width);
            copy(x, 0, random(100, 250), height, x + random(-5, 5), random(10, 30), random(100, 250), height);
        }

        if (mouseIsPressed) {
            copy(mouseX-100, mouseY, 200, 10, mouseX-100, mouseY+random(10, 50), 200, height-mouseY);
        }
    }

    updateFloatingUI(activeColor);
}

// 특정 영역을 멈추게 하는 함수
function triggerFreeze(energy, bass) {
    // 5~30% 사이의 영역 크기 결정
    let totalCells = COLS * ROWS;
    let freezeCount = floor(random(0.05, 0.3) * totalCells);
    
    // 바코드 끝처럼 우글우글한 형태를 위해 세로 줄 단위로 무작위 생성
    let startI = floor(random(0, COLS - 10));
    let startJ = floor(random(0, ROWS - 20));
    let baseWidth = floor(random(5, 20));
    let baseHeight = floor(random(10, 30));

    let now = millis();

    for (let j = startJ; j < startJ + baseHeight; j++) {
        // 줄마다 너비를 다르게 해서 우글우글한 '바코드 끝' 형태 구현
        let rowWidth = baseWidth + floor(random(-5, 5));
        for (let i = startI; i < startI + rowWidth; i++) {
            if (i >= 0 && i < COLS && j >= 0 && j < ROWS) {
                let key = i + "," + j;
                // 현재 상태 스냅샷 저장
                let n = noise(i * 0.1, j * 0.1, frameCount * 0.05) * 255;
                let val = (energy * 0.6) + (n * 0.4);
                
                frozenCells[key] = {
                    char: fontData.charAt(floor(map(val, 100, 255, fontData.length - 1, 0))),
                    alpha: map(bass, 0, 255, 30, 105),
                    size: map(bass, 0, 255, 5, 25),
                    expiry: now + 500 // 0.5초 후 해제
                };
            }
        }
    }
}

function drawGlitchAscii(energy, bass, c) {
    let w = width / COLS;
    let h = height / ROWS;
    let now = millis();
    noStroke();
    textAlign(CENTER, CENTER);
    
    for (let i = 0; i < COLS; i++) {
        for (let j = 0; j < ROWS; j++) {
            let key = i + "," + j;
            
            // 프리즈 된 셀인지 확인
            if (frozenCells[key]) {
                if (now < frozenCells[key].expiry) {
                    // 멈춘 데이터 출력
                    let f = frozenCells[key];
                    fill(red(c), green(c), blue(c), f.alpha);
                    textSize(f.size);
                    text(f.char, i * w + w/2, j * h + h/2);
                    continue; // 다음 루프로
                } else {
                    delete frozenCells[key]; // 만료 시 삭제
                }
            }

            // 일반 렌더링 로직
            let n = noise(i * 0.1, j * 0.1, frameCount * 0.05) * 255;
            let val = (energy * 0.6) + (n * 0.4); 

            if (val < 100) {
                if (random(1) > 0.98) {
                    fill(red(c), green(c), blue(c), 50);
                    textSize(8);
                    text(random([".", ","]), i*w + w/2, j*h + h/2);
                }
                continue;
            }

            let charIdx = floor(map(val, 100, 255, fontData.length-1, 0));
            let alpha = map(bass, 0, 255, 30, 105);
            fill(red(c), green(c), blue(c), alpha);
            textSize(map(bass, 0, 255, 5, 25)); 
            text(fontData.charAt(charIdx), i*w+w/2, j*h+h/2);
        }
    }
}

function updateFloatingUI(c) {
    let ui = select('#ascii-ui-box');
    uiPos.add(uiVel);
    if (uiPos.x <= 0 || uiPos.x + 480 >= width) uiVel.x *= -1;
    if (uiPos.y <= 0 || uiPos.y + 160 >= height) uiVel.y *= -1;
    ui.position(uiPos.x, uiPos.y);
    ui.style('color', `rgb(${red(c)}, ${green(c)}, ${blue(c)})`);
}

function keyPressed() {
    noiseGen.amp(0.6, 0.05); 
    setTimeout(() => noiseGen.amp(0, 0.2), 100);
}

function mousePressed() { if (getAudioContext().state !== 'running') getAudioContext().resume(); }
// ... (보내주신 코드 붙여넣기 - 맨 마지막 줄의 잉여 } 는 지워주세요!) ...

// ⭐️ Astro + p5.js 호환을 위한 필수 연결 코드
window.setup = setup;
window.draw = draw;
window.windowResized = function() { resizeCanvas(windowWidth, windowHeight); };
window.mousePressed = mousePressed;
window.keyPressed = keyPressed;