package handlers

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/TakenokoTech/go-voice/utils"
	"github.com/mjibson/go-dsp/fft"
	"gotest.tools/assert"
)

var sound = []float32{0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7}

func JSONRequest(reqestJSON interface{}) io.Reader {
	reqestBody, _ := json.Marshal(reqestJSON)
	return bytes.NewReader(reqestBody)
}

func TestESoundHandler(t *testing.T) {
	body := Request{Sound: sound}
	req := httptest.NewRequest("POST", "/link", JSONRequest(body))
	rec := httptest.NewRecorder()
	SoundHandler(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	log.Printf("body: %v\n", rec.Body.String())
}

func TestExampleSuccess(t *testing.T) {
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

// func TestInversePhase(t *testing.T) {
// 	a0 := inversePhase(0)
// 	a511 := inversePhase(511)
// 	a512 := inversePhase(512)
// 	a1023 := inversePhase(1023)
// 	assert.Equal(t, a0, 1)
// 	assert.Equal(t, a511, 512)
// 	assert.Equal(t, a512, 512)
// 	assert.Equal(t, a1023, 1)
// }
