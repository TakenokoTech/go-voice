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
        this.scriptProcessorNode = null
        this.audioBufferSourceNode = null
    }

    didmount() {
        this.video = document.getElementById("myVideo")
        this.debugText = document.getElementById("debugText")
        this.recTime = document.getElementById("recTime")
    }

    async start() {
        this.data = null
        this.context = new AudioContext()
        this.scriptProcessorNode = this.context.createScriptProcessor(1024, 1, 1)
        this.analyserNode = this.context.createAnalyser()

        return new Promise(async (resolve) => {
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
        const df = this.sampleRate / this.analyserNode.fftSize
        this.audioBufferSourceNode = this.context.createBufferSource();
        this.audioBufferSourceNode.loop = false
        this.audioBufferSourceNode.loopStart = 0
        this.audioBufferSourceNode.playbackRate.value = 1.0

        return new Promise(async (resolve) => {
            this.scriptProcessorNode.disconnect();
            const audioBuffer = this.context.createBuffer(this.data.length, this.length, this.sampleRate);
            for (const i of Array(this.data.length).keys()) {
                this.data[i] = utils.pitchShift(this.data[i])
                audioBuffer.getChannelData(i).set(this.data[i]);
            }
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
        // console.log("onaudioprocess", this.sampleRate, this.duration, this.length)
        // debugText.innerHTML = "<div>" + e.inputBuffer.getChannelData(0).map(v => v * 10).join("</div><div>") + "</div>"
        this.sampleRate = e.inputBuffer.sampleRate
        this.duration += e.inputBuffer.duration
        this.length += e.inputBuffer.length
        this.data = !this.data ? new Array(e.inputBuffer.numberOfChannels).fill([]) : this.data
        for (const i of Array(this.data.length).keys()) Array.prototype.push.apply(this.data[i], e.inputBuffer.getChannelData(i))
        recTime.innerHTML = this.duration.toFixed(2)
        // Analyser
        const frequencyData = new Uint8Array(this.analyserNode.frequencyBinCount);
        this.analyserNode.getByteFrequencyData(frequencyData);
        const timeDomainData = new Uint8Array(this.analyserNode.frequencyBinCount);
        this.analyserNode.getByteTimeDomainData(timeDomainData)
        this.graph.update(e.inputBuffer.getChannelData(0), frequencyData, timeDomainData)
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
        this.canvas.setAttribute("width", document.getElementById("leftBox").clientWidth - 32);
        this.canvas.setAttribute("height", document.getElementById("leftBox").clientHeight);
        this.canvasContext = this.canvas.getContext('2d');
    }

    update(data, frequencyData, timeDomainData) {
        const context = this.canvasContext
        const width = this.canvas.width
        const height = this.canvas.height
        context.clearRect(0, 0, width, height)
        context.beginPath()
        for (var i = 0, len = data.length; i < len; i++) {
            var x = (i / len) * width
            var y = height * data[i] + (height / 2)
            context.strokeStyle = 'rgba(255, 0, 0, 1)';
            if (i === 0) context.moveTo(x, y); else context.lineTo(x, y)
        }
        context.stroke()
        context.beginPath()
        for (var i = 0, len = frequencyData.length; i < len; i++) {
            var x = (i / len) * width
            var y = (1 - (frequencyData[i] / 255)) * height
            context.strokeStyle = 'rgba(0, 255, 0, 0.5)';
            if (i === 0) context.moveTo(x, y); else context.lineTo(x, y)
        }
        context.stroke()
        context.beginPath()
        for (var i = 0, len = timeDomainData.length; i < len; i++) {
            var x = (i / len) * width
            var y = (1 - (timeDomainData[i] / 255)) * height
            context.strokeStyle = 'rgba(0, 0, 255, 1)';
            if (i === 0) context.moveTo(x, y); else context.lineTo(x, y)
        }
        context.stroke()
        // context.beginPath()
        // const dft = utils.dft(data)
        // for (const i in dft.Re) {
        //     for (const j in dft.Re) {
        //         if (dft.Re[i] < dft.Re[j]) {
        //             const temp1 = dft.Re[i]; dft.Re[i] = dft.Re[j]; dft.Re[j] = temp1;
        //             const temp2 = dft.Im[i]; dft.Im[i] = dft.Im[j]; dft.Im[j] = temp2;
        //         }
        //     }
        // }
        // for (const i in dft.Re) {
        //     var x = dft.Re[+i] * width
        //     var y = (1 - dft.Im[+i]) * height
        //     context.strokeStyle = 'rgba(0, 255, 255, 0.5)';
        //     if (i === 0) context.moveTo(x, y); else context.lineTo(x, y)
        // }
        // context.stroke()
    }
}

class Utils {
    zero(number, n = 0) {
        return (number + Array(n).fill("0").join("")).slice(-n);
    }

    pitchShift(d, p = 5) {
        const semitone = Math.pow(2, (1 / 12))
        const pitch = Math.pow(semitone, p)
        const newData = new Array(d.length).fill(0)
        for (const i in d) {
            const frame = parseInt(i / 1024)
            const db = parseInt((i % 1024) / pitch)
            if (db < 1023) newData[frame * 1024 + db] = d[i]
        }
        console.log(`${p}, pitch = ${pitch}`)
        return newData
    }

    // フーリエ変換できてない
    dft(a) {
        const Re = [], Im = []
        for (let j = 0, N = a.length; j < N; ++j) {
            let Re_sum = 0.0, Im_sum = 0.0;
            for (let i = 0; i < N; ++i) {
                var tht = 2 * Math.PI / N * j * i;
                Re_sum += a[i] * Math.cos(tht);
                Im_sum += a[i] * Math.sin(tht);
            }
            Re.push(Re_sum);
            Im.push(Im_sum);
        }
        return { Re: Re, Im: Im };
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