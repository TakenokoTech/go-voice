class Sound {
    constructor() {
        this.didmount = this.didmount.bind(this)
        this.initialize = this.initialize.bind(this)
		this.callapi = this.callapi.bind(this)
        this.analyser = this.analyser.bind(this)
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
        this.e = null
    }

    didmount() {
        this.video = document.getElementById("myVideo")
        this.debugText = document.getElementById("debugText")
        this.recTime = document.getElementById("recTime")
        this.analyser()
    }
	
	async callapi(sound = "---") {
		const res = await fetch("http://127.0.0.1:8080/link", {
			method: 'POST',
			body: JSON.stringify({"sound": sound})
		})
		const json = await res.json()
		console.log(json)
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
                // this.data[i] = utils.pitchShift(this.data[i])
                const data = this.data[i]
                const chunk = 1024
                let buffer = []
                for (let i = 0, len = data.length; i < len; i += chunk) {
                    const startTime = performance.now();
                    const arr = data.slice(i, i + chunk)
                    const dft = utils.dft(arr)
                    const idft = utils.idft(dft.Re, dft.Im).Re
                    for (const n of idft) buffer.push(n)
                    const endTime = performance.now();
                    console.log(`${i} / ${len} dft: ${endTime - startTime}`);
                }
                audioBuffer.getChannelData(i).set(buffer)
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

    analyser() {
        const id = setInterval(() => {
            if (!this.e) return
            const frequencyData = new Uint8Array(this.analyserNode.frequencyBinCount);
            this.analyserNode.getByteFrequencyData(frequencyData);
            const timeDomainData = new Uint8Array(this.analyserNode.frequencyBinCount);
            this.analyserNode.getByteTimeDomainData(timeDomainData)
            this.graph.update(this.e.inputBuffer.getChannelData(0), frequencyData, timeDomainData)
        }, 30);
    }

    onAudioProcess(e) {
        console.log("onaudioprocess", this.sampleRate, this.duration, this.length)
		this.callapi(e.inputBuffer.getChannelData(0))
        // debugText.innerHTML = "<div>" + e.inputBuffer.getChannelData(0).map(v => v * 10).join("</div><div>") + "</div>"
        this.sampleRate = e.inputBuffer.sampleRate
        this.duration += e.inputBuffer.duration
        this.length += e.inputBuffer.length
        this.data = !this.data ? new Array(e.inputBuffer.numberOfChannels).fill([]) : this.data
        for (const i of Array(this.data.length).keys()) {
            Array.prototype.push.apply(this.data[i], e.inputBuffer.getChannelData(i))
        }
        recTime.innerHTML = this.duration.toFixed(2)
        this.e = e
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
    }

    update(data, frequencyData, timeDomainData) {
        const context = this.canvasContext
        const width = this.canvas.width
        const height = this.canvas.height
        context.clearRect(0, 0, width, height)

        context.beginPath()
        context.moveTo(0, height / 2)
        context.lineTo(width, height / 2)
        context.strokeStyle = 'rgba(128, 128, 128, 0.3)';
        context.stroke()

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

        let dft = utils.dft(data)
        context.beginPath()
        for (const x in dft.Re) {
            var y = (1 - dft.Re[+x]) * height
            context.strokeStyle = 'rgba(0, 255, 255, 0.5)';
            if (x === 0) context.moveTo(x, y); else context.lineTo(x, y)
        }
        context.stroke()
        context.beginPath()
        for (const x in dft.Re) {
            var y = (1 - dft.Im[+x]) * height
            context.strokeStyle = 'rgba(255, 0, 255, 0.5)';
            if (x === 0) context.moveTo(x, y); else context.lineTo(x, y)
        }
        context.stroke()
        context.beginPath()
        for (const x in dft.Re) {
            const d = Math.sqrt(Math.pow(dft.Re[+x], 2) - Math.pow(dft.Im[+x], 2)) || 0
            var y = (1 - d) * height
            context.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            if (x === 0) context.moveTo(x, y); else context.lineTo(x, y)
        }
        context.stroke()

        dft = utils.idft(dft.Re, dft.Im)
        context.beginPath()
        for (const x in dft.Re) {
            var y = height * dft.Re[+x] + (height / 2)
            context.strokeStyle = 'rgba(0, 255, 255, 0.5)';
            if (x === 0) context.moveTo(x, y); else context.lineTo(x, y)
        }
        context.stroke()
        context.beginPath()
        for (const x in dft.Re) {
            var y = height * dft.Im[+x] + (height / 2)
            context.strokeStyle = 'rgba(255, 0, 255, 0.5)';
            if (x === 0) context.moveTo(x, y); else context.lineTo(x, y)
        }
        context.stroke()
        context.beginPath()
        for (const x in dft.Re) {
            const d = Math.sqrt(Math.pow(dft.Re[+x], 2) - Math.pow(dft.Im[+x], 2)) || 0
            var y = d * height + (height / 2)
            context.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            if (x === 0) context.moveTo(x, y); else context.lineTo(x, y)
        }
        context.stroke()
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

    dft(data) {
        // const startTime = performance.now();
        const Re = new Float32Array(data.length)
        const Im = new Float32Array(data.length)
        for (let j = 0, N = data.length; j < N; ++j) {
            for (let i = 0; i < N; ++i) {
                const tht = 2.0 * Math.PI * i * j / N;
                Re[j] += Math.cos(tht) * data[i]
                Im[j] += Math.sin(tht) * data[i]
            }
        }
        // const endTime = performance.now();
        // console.log(`dft: ${endTime - startTime} ${data.length}`);
        return { Re: Re, Im: Im };
    }

    idft(re, im) {
        // const startTime = performance.now();
        const Re = new Float32Array(re.length)
        const Im = new Float32Array(re.length)
        for (let j = 0, N = re.length; j < N; ++j) {
            let Re_sum = 0.0, Im_sum = 0.0;
            for (let i = 0; i < N; ++i) {
                const tht = 2.0 * Math.PI * i * j / N
                Re_sum += re[i] * Math.cos(tht) - im[i] * Math.sin(tht)
                Im_sum += re[i] * Math.sin(tht) + im[i] * Math.cos(tht)
            }
            Re[j] = Re_sum / N;
            Im[j] = Im_sum / N;
        }
        // const endTime = performance.now();
        // console.log(`idft: ${endTime - startTime}`);
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