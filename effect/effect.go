package effect

/**
 * http://vstcpp.wpblog.jp/?page_id=523
 */

import (
	"math"
	"math/cmplx"
)

// Effect :
type Effect struct {
	music []complex128
}

// NewEffect :
func NewEffect(music []complex128) *Effect {
	return &Effect{music}
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
	/*
		result := make([]complex128, len(ef.music), len(ef.music))
		for index, frame := range ef.music {
			switch {
			case index > 511:
				result[index] = complex128(0)
			default:
				result[index] = frame
			}
		}
		return ef.music
		//*/
}

// ChangeDb :
func (ef *Effect) ChangeDb() *Effect {
	c128 := make([]complex128, len(ef.music), len(ef.music))
	for index := range ef.music {
		c128[index] = cmplx.Log10(ef.music[index])*20 - complex(70.0, 0)
	}
	ef.music = c128
	return ef
}

// ChangeHz :
func (ef *Effect) ChangeHz() *Effect {
	c128 := make([]complex128, len(ef.music), len(ef.music))
	for index := range ef.music {
		c128[index] = cmplx.Pow(10.0, (ef.music[index]+70)/20)
	}
	ef.music = c128
	return ef
}

func inversePhase(index int) int {
	if index < 512 {
		return index + 1
	}
	return 1024 - index
}
