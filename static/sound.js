class Sound {
    constructor() {
        this.didmount = this.didmount.bind(this)
        this.initialize = this.initialize.bind(this)
        this.onAudioProcess = this.onAudioProcess.bind(this)
        this.initialize()
        this.didmount()
    }

    initialize() {
        this.graph = new Graph()
        this.sampleRate = 0
        this.duration = 0
        this.length = 0
        this.data = null
        this.scriptProcessorNode = null
        this.audioBufferSourceNode = null
    }

    didmount() {
        this.video = document.getElementById("myVideo")
        this.debugText = document.getElementById("debugText")
        this.recTime = document.getElementById("recTime")
    }

    async start() {
        this.context = new AudioContext()
        this.scriptProcessorNode = this.context.createScriptProcessor(1024, 1, 1)

        return new Promise(async (resolve) => {
            this.video.srcObject = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
            this.video.volume = 0
            const scriptProcessorNode = this.scriptProcessorNode
            const mediaStreamAudioSourceNode = this.context.createMediaStreamSource(this.video.srcObject)
            mediaStreamAudioSourceNode.connect(scriptProcessorNode)
            scriptProcessorNode.onaudioprocess = this.onAudioProcess
            scriptProcessorNode.connect(this.context.destination)
            resolve(this)
        })
    }

    async stop() {
        this.audioBufferSourceNode = this.context.createBufferSource();
        this.audioBufferSourceNode.loop = false
        this.audioBufferSourceNode.loopStart = 0
        this.audioBufferSourceNode.playbackRate.value = 1.0

        return new Promise(async (resolve) => {
            this.scriptProcessorNode.disconnect();
            const audioBuffer = this.context.createBuffer(this.data.length, this.length, this.sampleRate);
            for (const i of Array(this.data.length).keys()) audioBuffer.getChannelData(i).set(this.data[i]);
            this.audioBufferSourceNode.buffer = audioBuffer
            this.audioBufferSourceNode.loopEnd = audioBuffer.duration
            this.audioBufferSourceNode.connect(this.context.destination);
            this.audioBufferSourceNode.start(0);
            this.audioBufferSourceNode.onended = (e) => {
                console.log("audio stopped.");
                this.initialize()
                resolve(this)
            };

            console.log(audioBuffer);
            this.onPlaying()
        })
    }

    onAudioProcess(e) {
        console.log("onaudioprocess")
        // debugText.innerHTML = "<div>" + e.inputBuffer.getChannelData(0).map(v => v * 10).join("</div><div>") + "</div>"
        this.sampleRate = e.inputBuffer.sampleRate
        this.duration += e.inputBuffer.duration
        this.length += e.inputBuffer.length
        this.data = !this.data ? new Array(e.inputBuffer.numberOfChannels).fill([]) : this.data
        for (const i of Array(this.data.length).keys()) Array.prototype.push.apply(this.data[i], e.inputBuffer.getChannelData(i))
        recTime.innerHTML = this.duration.toFixed(2)
        this.graph.update(e.inputBuffer.getChannelData(0))
    }

    onPlaying(playtime = 0.0) {
        const maxtime = this.audioBufferSourceNode.buffer.duration
        playTime.innerHTML = "Ready...";
        const id = setInterval(() => {
            if (!this.data) clearInterval(id);
            playtime += 0.01;
            playTime.innerHTML = Math.min(playtime, maxtime).toFixed(2) + " / " + maxtime.toFixed(2);
        }, 9.9);
    }
}

class Graph {
    constructor() {
        this.count = 0
        this.soundChart = document.getElementById("soundChart")
    }
    update(inputdata) {
        if (this.count++ < 10) { return } else { this.count = 0 }
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
    }
}

class Utils {
    zero(number, n = 0) {
        return (number + Array(n).fill("0").join("")).slice(-n);
    }
}

/** */
const sound = new Sound()
const utils = new Utils()

async function startRec() {
    $("#recBox").css("display", "none")
    $("#recBtn").prop("disabled", true)
    $("#stopBox").css("display", "block")
    await sound.start()
    $("#stopBtn").prop("disabled", false);
    console.info("startRec")
}

async function stopRec() {
    $("#recBox").css("display", "block");
    $("#stopBox").css("display", "none");
    $("#stopBtn").prop("disabled", true);
    await sound.stop()
    $("#recBtn").prop("disabled", false);
    console.info("stopRec")
}