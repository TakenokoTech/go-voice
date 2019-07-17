const video = document.getElementById("myVideo")
const debugText = document.getElementById("debugText")
const recTime = document.getElementById("recTime")

class AutoEffect {
    constructor() {
        this.start = this.start.bind(this)
        this.recordingTime = 0
        this.data = []
        this.graph = new Graph()
        this.waveform = new Waveform()
        this.analyser()
    }

    async start() {
        const context = new AudioContext()
        let recordingData = []
        let playingData = []
        this.analyserNode = context.createAnalyser()
        const analyserNode = this.analyserNode

        // video dom
        video.srcObject = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
        video.volume = 0
        const mediaStreamAudioSourceNode = context.createMediaStreamSource(video.srcObject)

        // node
        const recordingProcessorNode = context.createScriptProcessor(1024, 1, 1)
        recordingProcessorNode.onaudioprocess = (e) => {
            // console.log("onaudioprocess", recordingData.length)
            this.recordingTime += e.inputBuffer.length
            const d = e.inputBuffer.getChannelData(0)
            if (d[0] != 0 && d[1] != 0) {
                Array.prototype.push.apply(recordingData, d)
                Array.prototype.push.apply(this.data, d)
            }
        }

        // connect
        recordingProcessorNode.connect(context.destination)
        mediaStreamAudioSourceNode.connect(recordingProcessorNode)
        // mediaStreamAudioSourceNode.connect(analyserNode)

        // play
        const play = (e = null) => {
            const startTime = performance.now();
            if (playingData.length == 0) {
                setTimeout(play, 10)
                return
            }
            // audio buffer
            const audioBuffer = context.createBuffer(1, playingData.length, 44100);
            audioBuffer.getChannelData(0).set(playingData)
            playingData = []
            // node
            const audioBufferSourceNode = context.createBufferSource();
            audioBufferSourceNode.buffer = audioBuffer
            audioBufferSourceNode.loopEnd = audioBuffer.duration
            audioBufferSourceNode.loop = false
            audioBufferSourceNode.loopStart = 0
            audioBufferSourceNode.playbackRate.value = 1.0
            // node
            const playingProcessorNode = context.createScriptProcessor(1024, 1, 1)
            playingProcessorNode.onaudioprocess = () => {
            }
            // connect
            playingProcessorNode.connect(context.destination)
            audioBufferSourceNode.connect(playingProcessorNode)
            audioBufferSourceNode.connect(context.destination);
            audioBufferSourceNode.connect(analyserNode)
            // start
            audioBufferSourceNode.start(0);
            audioBufferSourceNode.onended = play
            const endTime = performance.now();
            console.log(`play: ${endTime - startTime}`);
        }

        // effect
        const effect = () => {
            const request = recordingData
            if (request.length < 3000) {
                setTimeout(effect, 10)
                return
            }
            recordingData = []
            const startTime = performance.now();
            this.callapi(request).then(response => {
                playingData = playingData.concat(response)
                const endTime = performance.now();
                console.log(`effect: ${endTime - startTime} ${request.length}`);
                effect()
            })
        }

        effect()
        play()
    }

    async callapi(sound = []) {
        try {
            const high = +$("#highpass").val()
            const low = +$("#lowpass").val()
            const shift = +$("#shift").val()
            // console.log(sound.length)
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
            return json.result
        } catch (e) {
            console.error(e)
            return ""
        }
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
            if (this.data) this.waveform.update(this.data)
        }, 10);
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
            context.strokeStyle = 'rgba(255, 0, 0, 0.8)';
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
            context.strokeStyle = 'rgba(0, 255, 0, 0.8)';
            if (i === 0) context.moveTo(x, y); else context.lineTo(x, y)
        }
        context.stroke()
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

        const len = autoEffect.recordingTime - (1024 * 4)
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

const autoEffect = new AutoEffect()

function startRec() {
    $("#recBtn").prop("disabled", true)
    autoEffect.start()
}

$("#recBtn").prop("disabled", false);