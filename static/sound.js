class Sound {
    constructor() {
        this.didmount = this.didmount.bind(this)
        this.initialize = this.initialize.bind(this)
        this.callapi = this.callapi.bind(this)
        this.analyser = this.analyser.bind(this)
        this.onAudioProcess = this.onAudioProcess.bind(this)
        this.onAudioPlaying = this.onAudioPlaying.bind(this)
        this.graph = new Graph()
        this.waveform = new Waveform()
        this.initialize()
        this.didmount()
    }

    initialize() {
        this.sampleRate = 0
        this.duration = 0
        this.length = 0
        this.scriptProcessorNode = null
        this.audioBufferSourceNode = null
        this.timer = null
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
            const high = +$("#highpass").val()
            const low = +$("#lowpass").val()
            const shift = +$("#shift").val()
            console.log(sound.length)
            const body = {}
            body["sound"] = sound
            if (low > 1) body["lowpass"] = Math.pow(2, low)
            if (high > 1) body["highpass"] = Math.pow(2, high)
            if (shift != 0) body["shift"] = shift
            const res = await fetch("/link", {
                method: 'POST',
                body: JSON.stringify(body)
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
            this.analyserNode = this.context.createAnalyser()
            this.video.srcObject = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
            this.video.volume = 0
            const analyserNode = this.analyserNode
            const mediaStreamAudioSourceNode = this.context.createMediaStreamSource(this.video.srcObject)
            mediaStreamAudioSourceNode.connect(analyserNode)
            //
            this.scriptProcessorNode = this.context.createScriptProcessor(1024, 1, 1)
            const scriptProcessorNode = this.scriptProcessorNode
            mediaStreamAudioSourceNode.connect(scriptProcessorNode)
            scriptProcessorNode.onaudioprocess = this.onAudioProcess
            scriptProcessorNode.connect(this.context.destination)
            resolve(this)

            this.timer = setInterval(() => {
                stopRec()
            }, 5000);
        })
    }

    async stop() {
        return new Promise(async (resolve) => {
            console.log("stop")
            clearInterval(this.timer);
            this.scriptProcessorNode.disconnect();
            for (const i of Array(this.data.length).keys()) {
                let data = this.data[i]
                this.data[i] = await this.callapi(data)
            }

            const audioBuffer = this.context.createBuffer(this.data.length, this.length, this.sampleRate);
            this.initialize()
            this.analyserNode = this.context.createAnalyser()
            for (const i of Array(this.data.length).keys()) {
                audioBuffer.getChannelData(i).set(this.data[i])
            }
            this.audioBufferSourceNode = this.context.createBufferSource();
            this.audioBufferSourceNode.loop = false
            this.audioBufferSourceNode.loopStart = 0
            this.audioBufferSourceNode.playbackRate.value = 1.0
            this.audioBufferSourceNode.buffer = audioBuffer
            this.audioBufferSourceNode.loopEnd = audioBuffer.duration
            this.audioBufferSourceNode.connect(this.context.destination);
            this.audioBufferSourceNode.connect(this.analyserNode)
            //
            this.scriptProcessorNode = this.context.createScriptProcessor(1024, 1, 1)
            const scriptProcessorNode = this.scriptProcessorNode
            this.audioBufferSourceNode.connect(scriptProcessorNode)
            scriptProcessorNode.onaudioprocess = this.onAudioPlaying
            scriptProcessorNode.connect(this.context.destination)

            this.audioBufferSourceNode.start(0);
            this.audioBufferSourceNode.onended = (e) => {
                console.log("audio stopped.");
                scriptProcessorNode.onaudioprocess = null
                this.initialize()
                startRec()
                resolve(this)
            };
            console.log(audioBuffer);
        })
    }

    analyser() {
        const id = setInterval(() => {
            if (!this.analyserNode) {
                this.graph.update([], [], [], [])
                this.waveform.update([])
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
            this.graph.update(frequencyData, timeDomainData, frequencyFloatData, timeDomainFloatData)
            if (this.data) this.waveform.update(this.data[0])
        }, 10);
    }

    onAudioProcess(e) {
        console.log("onAudioProcess", this.sampleRate, this.duration, this.length)
        this.sampleRate = e.inputBuffer.sampleRate
        this.duration += e.inputBuffer.duration
        this.length += e.inputBuffer.length
        this.data = !this.data ? new Array(e.inputBuffer.numberOfChannels).fill([]) : this.data
        if (e.inputBuffer.getChannelData(0)[0] == 0 && e.inputBuffer.getChannelData(0)[1] == 0) {
            return
        }
        for (const i of Array(this.data.length).keys()) {
            Array.prototype.push.apply(this.data[i], e.inputBuffer.getChannelData(i))
        }
        recTime.innerHTML = this.duration.toFixed(2)
    }

    onAudioPlaying(e) {
        console.log("onAudioPlaying", this.sampleRate, this.duration, this.length)
        this.sampleRate = e.inputBuffer.sampleRate
        this.duration += e.inputBuffer.duration
        this.length += e.inputBuffer.length
        const maxtime = this.audioBufferSourceNode.buffer.duration
        playTime.innerHTML = (this.duration).toFixed(2) + " / " + maxtime.toFixed(2);
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
        this.div = 4
        const samplerate = 44100 / this.div
        frequencyFloatData = frequencyFloatData.slice(0, frequencyFloatData.length / this.div);
        timeDomainFloatData = timeDomainFloatData.slice(0, timeDomainFloatData.length / this.div);
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
        context.fillText(Math.floor(samplerate / 4), width / 2 - 18, height - 18);

        context.beginPath()
        context.moveTo(width / 4, 0)
        context.lineTo(width / 4, height)
        context.stroke()
        context.fillText(Math.floor(samplerate / 8), width / 4 - 18, height - 18);

        context.beginPath()
        context.moveTo(width / 8, 0)
        context.lineTo(width / 8, height)
        context.stroke()
        context.fillText(Math.floor(samplerate / 16), width / 8 - 14, height - 18);

        context.beginPath()
        context.moveTo(width / 16, 0)
        context.lineTo(width / 16, height)
        context.stroke()
        context.fillText(Math.floor(samplerate / 32), width / 16 - 14, height - 18);

        const high = +$("#highpass").val()
        context.strokeStyle = '#0079c266';
        context.beginPath()
        context.moveTo(Math.pow(2, high) * (width / 512), 0)
        context.lineTo(Math.pow(2, high) * (width / 512), height)
        context.stroke()

        const low = +$("#lowpass").val()
        context.strokeStyle = '#6cbb5a66';
        context.beginPath()
        context.moveTo(Math.pow(2, low) * (width / 512), 0)
        context.lineTo(Math.pow(2, low) * (width / 512), height)
        context.stroke()

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
            for (var i = 0, len = 512 / this.div; i < len; i++) {
                var x = (i / len) * width
                // var y = (this.soundFF[center * 1024 + i] * height / 2) + (height / 2)
                var y = (-this.soundFF[center * 1024 + i] - 30) * height / 120
                context.strokeStyle = 'rgba(0, 0, 255, 0.5)';
                if (i === 0) context.moveTo(x, y); else context.lineTo(x, y)
            }
            context.stroke()
        }
    }

    ff(soundFF = null) {
        console.log(soundFF)
        if (soundFF) this.soundFF = soundFF
    }
}

class Waveform {
    constructor() {
        this.canvas = document.getElementById("waveform")
        this.canvas.setAttribute("width", document.getElementById("waveformBox").clientWidth);
        this.canvas.setAttribute("height", document.getElementById("waveformBox").clientHeight);
        this.canvasContext = this.canvas.getContext('2d');
        this.update = this.update.bind(this)
    }

    update(data) {
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

        const len = sound.length - (1024 * 4)
        const max = 1024 * 32
        context.beginPath()
        for (let i = 0; i < max; i++) {
            const x = (i / max) * width
            const y = (data[len - i] * height / 2) + (height / 2)
            context.strokeStyle = 'rgba(255, 0, 0, 0.25)';
            if (i === 0) context.moveTo(x, y); else context.lineTo(x, y)
        }
        context.stroke()
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

$("#recBtn").prop("disabled", false);