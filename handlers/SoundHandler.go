package handlers

import (
	"encoding/json"
	"log"
	"math"
	"math/cmplx"
	"net/http"

	"github.com/TakenokoTech/go-voice/effect"
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
	FF     []float32 `json:"ff"`
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
	buffer, bufferOut := make([]float32, 0, size), make([]float32, 0, size)
	if size < chunk {
		chunk = size
	}
	for i := 0; i < size; i += chunk {
		f32 := request.Sound[i : i+chunk]
		f64 := utils.Float32To64(f32)
		c128 := utils.Float64ToComplex128(f64)
		// フーリエ
		ff := fft.FFT(c128)
		// エフェクト
		ef := effect.NewEffect(ff)
		ef.ChangeDb()
		// ef.Highpass(44100, 100, 1/math.Sqrt(2))
		// ef.Lowpass(44100, 100, 1/math.Sqrt(2))
		bufferOut = append(bufferOut, utils.Complex128ToFloat32(ef.Result())...)
		ef.ChangeHz()
		// 逆フーリエ
		iff := fft.IFFT(ef.Result())
		buffer = append(buffer, utils.Complex128ToFloat32(iff)...)
	}

	// Response
	res, err := json.Marshal(Responce{"ok", buffer, bufferOut})
	if err != nil {
		log.Printf("Response Error: %v", err)
	}
	utils.ResponseSuccess(w, res)
}

func soundlog(request Request, chunk int) {
	size := len(request.Sound)
	for i := 0; i < size; i += chunk {
		f32 := request.Sound[i : i+chunk]
		f64 := utils.Float32To64(f32)
		c128 := utils.Float64ToComplex128(f64)
		newIff := fft.FFT(c128)
		if i == 1024*30 {
			for index := range f32 {
				if index < 200 {
					// db := float64(10) * math.Log10(real(newIff[index])*real(newIff[index]))
					// log.Printf("[%4d]%f", index, f32)
					r := math.Abs(real(c128[index]))
					log10 := 20 * cmplx.Log10(newIff[index])
					log.Printf("[%4d]%f, %v", index, r, log10)
					// log.Printf("[%4d] %f, %f", index, newIff[index]/1024*2, 0 )
				}
			}
		}
	}
}
