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
		ff := fft.FFT(c128)
		ff = effect(ff)
		iff := fft.IFFT(ff)
		buffer = append(buffer, utils.Complex128ToFloat32(iff)...)
	}
	request.Sound = buffer

	// Response
	res, _ := json.Marshal(Responce{"ok", request.Sound})
	utils.ResponseSuccess(w, res)
}

func effect(sound []complex128) []complex128 {
	return sound
}
