package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/TakenokoTech/go-voice/utils"
	"github.com/mjibson/go-dsp/fft"
)

// Request :
type Request struct {
	Sound []float32 `json:"sound"`
}

// Responce :
type Responce struct {
	Status string    `json:"status"`
	Result []float32 `json:"result"`
}

// SoundHandler :
func SoundHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("sound. %v\n", r.Header.Get("Origin"))

	// Request
	request := Request{}
	if err := utils.JSONParse(w, r, &request); err != nil {
		log.Printf("%v\n", err)
	}

	// Convert
	chunk := 1024
	size := len(request.Sound)
	buffer := make([]float32, 0, size)
	if size < chunk {
		chunk = size
	}
	for i := 0; i < size; i += chunk {
		f32 := request.Sound[i : i+chunk]
		f64 := utils.Float32To64(f32)
		c128 := utils.Float64ToComplex128(f64)
		// フーリエ
		ff := fft.FFT(c128)
		// アナライズ
		anlytics(ff)
		for index, frame := range ff {
			ff[index] = effect(index, frame)
		}
		anlytics(ff)
		// 逆フーリエ
		iff := fft.IFFT(ff)
		buffer = append(buffer, utils.Complex128ToFloat32(iff)...)
	}
	request.Sound = buffer

	// Response
	res, _ := json.Marshal(Responce{"ok", request.Sound})
	utils.ResponseSuccess(w, res)
}

func effect(f int, frame complex128) complex128 {
	if f < 16 || f > 1024-16 {
		return complex128(0)
	}
	return frame
}

func anlytics(sound []complex128) {
	maxReI, minReI := 0, 0
	maxImI, minImI := 0, 0
	maxRe, minRe := float64(-100000), float64(100000)
	maxIm, minIm := float64(-100000), float64(100000)
	for i, frame := range sound {
		re := real(sound[i])
		im := imag(sound[i])
		if maxRe < re {
			maxRe = re
			maxReI = i
		}
		if minRe > re {
			minRe = re
			minReI = i
		}
		if maxIm < im {
			maxIm = im
			maxImI = i
		}
		if minIm > im {
			minIm = im
			minImI = i
		}

		if real(frame) > 10 {
			log.Printf("[Frame] [%4d]%3f", i, frame)
		}
	}

	if maxRe > 5 {
		log.Printf("[Real] max: [%4d]%3f, min: [%4d]%3f", maxReI, maxRe, minReI, minRe)
		log.Printf("[Imag] max: [%4d]%3f, min: [%4d]%3f", maxImI, maxIm, minImI, minIm)
		log.Printf("====================================")
	}
}
