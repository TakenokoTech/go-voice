package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/TakenokoTech/go-voice/handlers"
)

func main() {
	log.SetFlags(log.Lshortfile)
	log.Printf("main")

	defer func() {
		if err := recover(); err != nil {
			fmt.Println("recover:", err)
		}
	}()

	http.Handle("/", http.FileServer(http.Dir("static")))
	http.HandleFunc("/link", handlers.SoundHandler)
	http.HandleFunc("/learn", handlers.LearnHandler)

	http.ListenAndServe(":8080", nil)
}
