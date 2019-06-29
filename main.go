package main

import (
	_ "fmt"
	"log"
	_ "math"
	"os"

	"github.com/TakenokoTech/go-voice/utils"
	"github.com/mjibson/go-dsp/wav"
)

func main() {
	// ファイルのオープン
	file, err := os.Open("./data/sample.wav")
	if err != nil {
		log.Fatal(err)
	}

	// Wavファイルの読み込み
	_, werr := wav.New(file)
	if werr != nil {
		log.Fatal(werr)
	}

	log.Printf("%v", utils.Sound())
}
