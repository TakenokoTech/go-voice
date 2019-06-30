(async () => {
    const Sound = (await import('./sound.js')).Sound;
    console.log(new Sound())
})()

window.AudioContext = window.AudioContext || window.webkitAudioContext;

// DOM
const video = document.getElementById("myVideo")
const debugText = document.getElementById("debugText")
const soundChart = document.getElementById("soundChart")
const recTime = document.getElementById("recTime")

let context = null
var processor = null;
var duration = 0.0;
var length = 0;
var sampleRate = 0;
var floatData = null;

function init() {
    duration = 0.0
    length = 0
    floatData = null
}

// START
async function startRec() {
    $("#recBox").css("display", "none");
    $("#recBtn").prop("disabled", true);
    $("#stopBox").css("display", "block");

    // ELEMENT
    context = new AudioContext();

    const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
    video.srcObject = stream
    video.volume = 0

    const input = context.createMediaStreamSource(stream);
    processor = context.createScriptProcessor(1024, 1, 1);
    input.connect(processor);

    processor.onaudioprocess = (e) => {
        console.log("onaudioprocess")
        graph(e.inputBuffer.getChannelData(0))
        sampleRate = e.inputBuffer.sampleRate;
        duration += e.inputBuffer.duration;
        length += e.inputBuffer.length;
        floatData = !floatData ? new Array(e.inputBuffer.numberOfChannels).fill([]) : floatData;
        for (i of Array(floatData.length).keys()) {
            float32Array = e.inputBuffer.getChannelData(i);
            Array.prototype.push.apply(floatData[i], float32Array);
        }
        recTime.innerHTML = Math.round(duration * 100) / 100;
    };
    processor.connect(context.destination);
}


async function stopRec() {
    $("#recBox").css("display", "block");
    $("#stopBox").css("display", "none");

    if (processor) {
        processor.disconnect();
        processor.onaudioprocess = null;
        processor = null;
    }

    const audioBuffer = context.createBuffer(floatData.length, length, sampleRate);
    for (i of Array(floatData.length).keys()) {
        audioBuffer.getChannelData(i).set(floatData[i]);
    }
    console.log(audioBuffer);

    var source = context.createBufferSource();
    source.buffer = audioBuffer
    source.loop = false
    source.loopStart = 0
    source.loopEnd = audioBuffer.duration
    source.playbackRate.value = 1.0
    source.connect(context.destination);
    source.start(0);
    source.onended = (e) => {
        console.log("audio stopped.");
        $("#recBtn").prop("disabled", false);
        init()
    };

    // 
    let playtime = 0.0;
    playTime.innerHTML = "Ready...";
    const id = setInterval(() => {
        if (!floatData) clearInterval(id);
        playtime += 0.01;
        const realtime = Math.round(playtime * 100) / 100;
        const maxtime = Math.round(source.buffer.duration * 100) / 100;
        playTime.innerHTML = Math.min(realtime, maxtime) + " / " + maxtime;
    }, 9.9);
}

let count = 0
function graph(inputdata) {
    if (count++ < 5) { return } else { count = 0 }
    inputdata = inputdata.filter((v, i) => i % (inputdata.length / 32) == 0)
    new Chart(soundChart, {
        type: "line", data: {
            labels: inputdata.map((v, i) => i + 1), datasets: [{
                label: "voice",
                data: inputdata.map(v => v * 10),
                borderColor: "rgba(242,105,57,1)",
                backgroundColor: "rgba(0,0,0,0)",
                pointBorderColor: "rgba(0,0,0,0)",
                pointBackgroundColor: "rgba(0,0,0,0)",
            }]
        }, options: { animation: false }
    })
    debugText.innerHTML = "<div>" + inputdata.map(v => v * 10).join("</div><div>") + "</div>"
}