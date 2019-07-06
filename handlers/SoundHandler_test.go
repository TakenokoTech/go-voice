package handlers

import (
	"log"
	"testing"

	"github.com/TakenokoTech/go-voice/utils"
	"github.com/mjibson/go-dsp/fft"
)

func TestExampleSuccess(t *testing.T) {

	sound := []float32{0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7}

	ff := fft.FFTReal(utils.Float32To64(sound))
	for i, v := range ff {
		log.Printf("[%v] %f\n", i, v)
	}

	iff := fft.IFFT(ff)
	for i, v := range iff {
		log.Printf("[%v] %f\n", i, v)
	}

	result := utils.Complex128ToFloat32(iff)
	for i, v := range result {
		log.Printf("[%v] %f\n", i, v)
	}
}
