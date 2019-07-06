package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/TakenokoTech/go-voice/utils"
)

type Request struct {
	Sound string `json:"sound"`
}

type Responce struct {
	Status string `json:"status"`
	Result string `json:"result"`
}

func handler(w http.ResponseWriter, r *http.Request) {
	println(r.Body, r.Header.Get("Origin"))
	// Request
	request := Request{""}
	err := utils.JSONParse(w, r, &request)
	fmt.Printf("%v\n", err)
	fmt.Printf("%v\n", request)

	// Response
	res, _ := json.Marshal(Responce{"ok", ""})
	w.Header().Set("Content-Type", "application/json")
	w.Write(res)
	w.WriteHeader(http.StatusOK)
}

func main() {
	println("main")
	http.HandleFunc("/link", handler)
	http.Handle("/", http.FileServer(http.Dir("static")))
	http.ListenAndServe(":8080", nil)
}
