class Sound {
    constructor() {
        this.didmount = this.didmount.bind(this)
        this.initialize = this.initialize.bind(this)
        this.callapi = this.callapi.bind(this)
        this.analyser = this.analyser.bind(this)
        this.onAudioProcess = this.onAudioProcess.bind(this)
        this.graph = new Graph()
        this.initialize()
        this.didmount()
    }

    initialize() {
        this.sampleRate = 0
        this.duration = 0
        this.length = 0
        this.scriptProcessorNode = null
        this.audioBufferSourceNode = null
        // this.analyserNode = null
    }

    didmount() {
        this.video = document.getElementById("myVideo")
        this.debugText = document.getElementById("debugText")
        this.recTime = document.getElementById("recTime")
        this.analyser()
    }

    async callapi(sound = []) {
        try {
            console.log(sound.length)
            const res = await fetch("/link", {
                method: 'POST',
                body: JSON.stringify({ "sound": sound })
            })
            const json = await res.json()
            this.graph.ff(json.ff)
            return json.result
        } catch (e) {
            console.error(e)
            return ""
        }
    }

    async start() {
        return new Promise(async (resolve) => {
            this.data = null
            this.context = new AudioContext()
            this.scriptProcessorNode = this.context.createScriptProcessor(1024, 1, 1)
            this.analyserNode = this.context.createAnalyser()
            this.video.srcObject = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
            this.video.volume = 0
            const scriptProcessorNode = this.scriptProcessorNode
            const analyserNode = this.analyserNode
            const mediaStreamAudioSourceNode = this.context.createMediaStreamSource(this.video.srcObject)
            mediaStreamAudioSourceNode.connect(scriptProcessorNode)
            mediaStreamAudioSourceNode.connect(analyserNode)
            scriptProcessorNode.onaudioprocess = this.onAudioProcess
            scriptProcessorNode.connect(this.context.destination)
            resolve(this)
        })
    }

    async stop() {
        return new Promise(async (resolve) => {
            console.log("stop")
            this.scriptProcessorNode.disconnect();
            this.analyserNode = this.context.createAnalyser()
            const audioBuffer = this.context.createBuffer(this.data.length, this.length, this.sampleRate);
            for (const i of Array(this.data.length).keys()) {
                let data = this.data[i]
                data = await this.callapi(data)
                audioBuffer.getChannelData(i).set(data)
            }
            this.audioBufferSourceNode = this.context.createBufferSource();
            this.audioBufferSourceNode.loop = false
            this.audioBufferSourceNode.loopStart = 0
            this.audioBufferSourceNode.playbackRate.value = 1.0
            this.audioBufferSourceNode.buffer = audioBuffer
            this.audioBufferSourceNode.loopEnd = audioBuffer.duration
            this.audioBufferSourceNode.connect(this.context.destination);
            this.audioBufferSourceNode.connect(this.analyserNode)
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

    analyser() {
        const id = setInterval(() => {
            if (!this.analyserNode) {
                this.graph.update([], [], [], [])
                return
            }
            this.analyserNode.minDecibels = -150
            this.analyserNode.maxDecibels = -30
            const frequencyData = new Uint8Array(this.analyserNode.frequencyBinCount);
            this.analyserNode.getByteFrequencyData(frequencyData);
            const timeDomainData = new Uint8Array(this.analyserNode.frequencyBinCount);
            this.analyserNode.getByteTimeDomainData(timeDomainData)
            const frequencyFloatData = new Float32Array(this.analyserNode.frequencyBinCount);
            this.analyserNode.getFloatFrequencyData(frequencyFloatData)
            const timeDomainFloatData = new Float32Array(this.analyserNode.frequencyBinCount);
            this.analyserNode.getFloatTimeDomainData(timeDomainFloatData)
            if (this.audioBufferSourceNode) console.log(this.context.destination)
            this.graph.update(frequencyData, timeDomainData, frequencyFloatData, timeDomainFloatData)
        }, 10);
    }

    onAudioProcess(e) {
        console.log("onaudioprocess", this.sampleRate, this.duration, this.length)
        this.sampleRate = e.inputBuffer.sampleRate
        this.duration += e.inputBuffer.duration
        this.length += e.inputBuffer.length
        this.data = !this.data ? new Array(e.inputBuffer.numberOfChannels).fill([]) : this.data
        for (const i of Array(this.data.length).keys()) {
            Array.prototype.push.apply(this.data[i], e.inputBuffer.getChannelData(i))
        }
        recTime.innerHTML = this.duration.toFixed(2)
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
        this.canvas = document.getElementById("soundChart")
        this.canvas.setAttribute("width", document.getElementById("leftBox").clientWidth);
        this.canvas.setAttribute("height", document.getElementById("leftBox").clientHeight);
        this.canvasContext = this.canvas.getContext('2d');
        this.update = this.update.bind(this)
        this.ff = this.ff.bind(this)
    }

    update(frequencyData, timeDomainData, frequencyFloatData, timeDomainFloatData) {
        const context = this.canvasContext
        const width = this.canvas.width
        const height = this.canvas.height
        context.clearRect(0, 0, width, height)
        context.font = "12px serif";
        context.textBaseline = "middle"

        context.strokeStyle = 'rgba(128, 128, 128, 0.3)';
        context.beginPath()
        context.moveTo(0, height / 2)
        context.lineTo(width, height / 2)
        context.stroke()

        context.beginPath()
        context.moveTo(width / 2, 0)
        context.lineTo(width / 2, height)
        context.stroke()
        context.fillText(44100 / 2, width / 2 - 18, height - 18);

        context.beginPath()
        context.moveTo(width / 4, 0)
        context.lineTo(width / 4, height)
        context.stroke()
        context.fillText(44100 / 4, width / 4 - 18, height - 18);

        context.beginPath()
        context.moveTo(width / 8, 0)
        context.lineTo(width / 8, height)
        context.stroke()
        context.fillText(Math.floor(44100 / 8), width / 8 - 18, height - 18);

        /*
        context.beginPath()
        for (var i = 0, len = frequencyData.length; i < len; i++) {
            var x = (i / len) * width
            var y = (1 - (frequencyData[i] / 255)) * height
            context.strokeStyle = 'rgba(0, 255, 0, 0.5)';
            if (i === 0) context.moveTo(x, y); else context.lineTo(x, y)
        }
        context.stroke()
        */
        /*
        context.beginPath()
        for (var i = 0, len = timeDomainData.length; i < len; i++) {
            var x = (i / len) * width
            var y = (1 - (timeDomainData[i] / 255)) * height
            context.strokeStyle = 'rgba(0, 0, 255, 0.5)';
            if (i === 0) context.moveTo(x, y); else context.lineTo(x, y)
        }
        context.stroke()
        */

        context.font = "16px serif";
        context.fillText(" -30dB", width - 60, 18);
        context.fillText(" -90dB", width - 60, height / 2);
        context.fillText("-150dB", width - 60, height - 18);
        context.beginPath()
        for (var i = 0, len = frequencyFloatData.length; i < len; i++) {
            var x = (i / len) * width
            var y = (-frequencyFloatData[i] - 30) * height / 120
            context.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            if (i === 0) context.moveTo(x, y); else context.lineTo(x, y)
        }
        context.stroke()

        context.fillText(" 1", 4, 18);
        context.fillText(" 0", 4, height / 2);
        context.fillText("-1", 4, height - 18);
        context.beginPath()
        for (var i = 0, len = timeDomainFloatData.length; i < len; i++) {
            var x = (i / len) * width
            var y = (timeDomainFloatData[i] * height / 2) + (height / 2)
            context.strokeStyle = 'rgba(0, 255, 0, 0.5)';
            if (i === 0) context.moveTo(x, y); else context.lineTo(x, y)
        }
        context.stroke()

        if (this.soundFF) {
            const center = Math.floor(this.soundFF.length / 1024 / 2)
            context.beginPath()
            for (var i = 0, len = 512; i < len; i++) {
                var x = (i / len) * width
                // var y = (this.soundFF[center * 1024 + i] * height / 2) + (height / 2)
                var y = (-this.soundFF[center * 1024 + i] - 30) * height / 120
                context.strokeStyle = 'rgba(0, 0, 255, 0.5)';
                if (i === 0) context.moveTo(x, y); else context.lineTo(x, y)
            }
            const a100 = Math.floor(this.soundFF[center * 1024 + 10])
            const a200 = Math.floor(this.soundFF[center * 1024 + 20])
            const a300 = Math.floor(this.soundFF[center * 1024 + 30])
            const a400 = Math.floor(this.soundFF[center * 1024 + 40])
            const a500 = Math.floor(this.soundFF[center * 1024 + 50])
            console.log(`${a100} ${a200} ${a300} ${a400} ${a500}`)
            const b100 = Math.floor(frequencyFloatData[10])
            const b200 = Math.floor(frequencyFloatData[20])
            const b300 = Math.floor(frequencyFloatData[30])
            const b400 = Math.floor(frequencyFloatData[40])
            const b500 = Math.floor(frequencyFloatData[50])
            console.log(`${b100} ${b200} ${b300} ${b400} ${b500}`)
            context.stroke()
        }
    }

    ff(soundFF = null) {
        console.log(soundFF)
        if (soundFF) this.soundFF = soundFF
    }
}

class Utils {
    zero(number, n = 0) {
        return (number + Array(n).fill("0").join("")).slice(-n);
    }
    sleep(msec) {
        return new Promise((resolve) => {
            setTimeout(() => { resolve() }, msec);
        })
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