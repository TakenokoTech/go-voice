package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/TakenokoTech/go-voice/utils"
	"github.com/mjibson/go-dsp/fft"
)

const chunk = 1024

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
	size := len(request.Sound)
	buffer := make([]float32, 0, size)
	for i := 0; i < size; i += chunk {
		arr := request.Sound[i : i+chunk]
		ff := fft.FFTReal(utils.Float32To64(arr))
		iff := fft.IFFT(ff)
		buffer = append(buffer, utils.Complex128ToFloat32(iff)...)
	}
	request.Sound = buffer

	// Response
	res, _ := json.Marshal(Responce{"ok", request.Sound})
	utils.ResponseSuccess(w, res)
}
