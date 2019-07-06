package main

import (
	"log"
	"net/http"

	"github.com/TakenokoTech/go-voice/handlers"
)

func main() {
	log.SetFlags(log.Lshortfile)
	log.Printf("main")

	http.Handle("/", http.FileServer(http.Dir("static")))
	http.HandleFunc("/link", handlers.SoundHandler)

	http.ListenAndServe(":8080", nil)
}
