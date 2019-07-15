package effects

/**
 * http://vstcpp.wpblog.jp/?page_id=523
 */

import (
	"log"
	"math"
	"math/cmplx"

	"github.com/mjibson/go-dsp/fft"
)

var (
	d = math.Pow(2.0, 1.0/12.0)
)

// Effect :
type Effect struct {
	music      []complex128
	sampleRate int
	buffersize int
}

// NewEffect :
func NewEffect(music []complex128, sampleRate, buffersize int) *Effect {
	return &Effect{music, sampleRate, buffersize}
}

// FFT : フーリエ変換
func (ef *Effect) FFT() {
	ef.music = fft.FFT(ef.music)
}

// IFFT : 逆フーリエ変換
func (ef *Effect) IFFT() {
	ef.music = fft.IFFT(ef.music)
}

// Lowpass :
func (ef *Effect) Lowpass(samplerate, frequency, q float64) *Effect {
	omega := 2.0 * math.Pi * frequency / samplerate
	alpha := math.Sin(omega) / (2.0 * q)
	cos := math.Cos(omega)

	a0 := +(1.0 + alpha)
	a1 := -(2.0 * cos)
	a2 := +(1.0 - alpha)
	b0 := +(1.0 - cos) / 2.0
	b1 := +(1.0 - cos)
	b2 := +(1.0 - cos) / 2.0
	// log.Printf("Lowpass: %v %v %v %v %v %v\n", a0, a1, a2, b0, b1, b2)
	return ef.biQuad(complex(a0, 0), complex(a1, 0), complex(a2, 0), complex(b0, 0), complex(b1, 0), complex(b2, 0))
}

// Highpass :
func (ef *Effect) Highpass(samplerate, frequency, q float64) *Effect {
	omega := 2.0 * math.Pi * frequency / samplerate
	alpha := math.Sin(omega) / (2.0 * q)
	cos := math.Cos(omega)

	a0 := +(1.0 + alpha)
	a1 := -(2.0 * cos)
	a2 := +(1.0 - alpha)
	b0 := +(1.0 + cos) / 2.0
	b1 := -(1.0 + cos)
	b2 := +(1.0 + cos) / 2.0
	// log.Printf("Highpass: %v %v %v %v %v %v\n", a0, a1, a2, b0, b1, b2)
	return ef.biQuad(complex(a0, 0), complex(a1, 0), complex(a2, 0), complex(b0, 0), complex(b1, 0), complex(b2, 0))
}

// biQuad :
func (ef *Effect) biQuad(a0, a1, a2, b0, b1, b2 complex128) *Effect {
	input := ef.music
	output := make([]complex128, len(ef.music), len(ef.music))
	var in1, in2, out1, out2 complex128
	for i := range ef.music {
		output[i] = b0/a0*input[i] + b1/a0*in1 + b2/a0*in2 - a1/a0*out1 - a2/a0*out2
		in2 = in1
		in1 = input[i]
		out2 = out1
		out1 = output[i]
	}
	ef.music = output
	return ef
}

// Result :
func (ef *Effect) Result() []complex128 {
	for index := range ef.music {
		if cmplx.IsNaN(ef.music[index]) {
			ef.music[index] = 0
		}
	}
	return ef.music
}

// HighpassDb :
func (ef *Effect) HighpassDb(limit int) *Effect {
	temp := make([]complex128, cap(ef.music))
	copy(temp, ef.music)
	for index := range ef.music {
		switch {
		case limit <= index && index < limit+128:
			retio := float64(index-limit) / float64(128)
			ef.music[index] = (temp[index-1]+temp[index]+temp[index+1])/3 - complex(128*retio, 0)
		case limit+128 <= index:
			ef.music[index] = ef.music[index-1]
		}
	}
	return ef
}

// LowpassDb :
func (ef *Effect) LowpassDb(limit int) *Effect {
	temp := make([]complex128, cap(ef.music))
	copy(temp, ef.music)
	for index := range ef.music {
		switch {
		case index <= limit:
			ef.music[index] = complex(-300, 0)
		}
	}
	return ef
}

// Shiftpitch :
func (ef *Effect) Shiftpitch(limit int) *Effect {
	temp := make([]complex128, cap(ef.music))
	copy(temp, ef.music)
	for index := range ef.music {
		target := int(float64(index) / math.Pow(d, float64(limit)))
		if target < len(ef.music) {
			ef.music[index] = temp[target]
		}
	}
	return ef
}

// ChangeDb : DB値に変換
func (ef *Effect) ChangeDb() *Effect {
	c128 := make([]complex128, len(ef.music), len(ef.music))
	for index := range ef.music {
		c128[index] = cmplx.Log10(ef.music[index]) * 20
		c128[index] = c128[index] - complex(70.0, 0)
	}
	ef.music = c128
	return ef
}

// ChangeHz : Hz値に変換
func (ef *Effect) ChangeHz() *Effect {
	c128 := make([]complex128, len(ef.music), len(ef.music))
	for index := range ef.music {
		c128[index] = ef.music[index] + 70
		c128[index] = cmplx.Pow(10.0, c128[index]/20)
	}
	ef.music = c128
	return ef
}

// Cepstrum :
func (ef *Effect) Cepstrum() []complex128 {
	temp := make([]complex128, len(ef.music), len(ef.music))
	copy(temp, ef.music)
	for index := range temp {
		temp[index] = temp[index] + 70
	}
	temp = fft.FFT(temp)
	return temp
}

// MaxDb :
func (ef *Effect) MaxDb() *Effect {
	max := 0
	for index := range ef.music {
		if real(ef.music[max]) < real(ef.music[index]) {
			max = index
		}
	}
	if max > 1 {
		log2 := math.Log2(440.0/float64(max*ef.sampleRate/ef.buffersize)+0.001)*12 + 60
		log.Printf("max: %v, %v", max*ef.sampleRate/ef.buffersize, int(math.Mod(log2, 12)))
	}
	return ef
}

func inversePhase(index int) int {
	if index < 512 {
		return index + 1
	}
	return 1024 - index
}
