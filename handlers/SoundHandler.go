package handlers

import (
	"encoding/json"
	"log"
	"math"
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
		// for index, frame := range ff {
		// ff[index] = effect(index, frame)
		// }
		// 逆フーリエ
		iff := fft.IFFT(ff)
		buffer = append(buffer, utils.Complex128ToFloat32(iff)...)
	}
	request.Sound = buffer

	for i := 0; i < size; i += chunk {
		f32 := request.Sound[i : i+chunk]
		f64 := utils.Float32To64(f32)
		c128 := utils.Float64ToComplex128(f64)
		newIff := fft.FFT(c128)
		if i == 1024*10 {
			for index, _ := range f32 {
				db := float64(10) * math.Log10(real(newIff[index])*real(newIff[index]))
				log.Printf("[%4d]%f - %f", index, real(newIff[index]), db)
			}
		}
	}

	// Response
	res, _ := json.Marshal(Responce{"ok", request.Sound})
	utils.ResponseSuccess(w, res)
}

func effect(f int, frame complex128) complex128 {
	if f > 16 {
		return complex128(0)
	}
	return frame
}
