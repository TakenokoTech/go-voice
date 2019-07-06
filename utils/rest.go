package utils

import (
	"encoding/json"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"strconv"
)

// ResponseSuccess :
func ResponseSuccess(w http.ResponseWriter, res []byte) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(res)
}

// ResponseFailed :
func ResponseFailed(w http.ResponseWriter, res []byte) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusInternalServerError)
	w.Write(res)
}

// JSONParse :
func JSONParse(w http.ResponseWriter, r *http.Request, o interface{}) error {
	r.Body = http.MaxBytesReader(w, r.Body, 100000000000)

	//To allocate slice for request body
	length, err := strconv.Atoi(r.Header.Get("Content-Length"))
	if err != nil {
		return err
	}

	//Read body data to parse json
	body, err := ioutil.ReadAll(r.Body)
	if err != nil && err != io.EOF {
		log.Printf(err.Error())
		return err
	}

	if err != nil && err != io.EOF {
		log.Printf(err.Error())
		return err
	}

	//parse json
	if err := json.Unmarshal(body[:length], &o); err != nil {
		log.Printf(err.Error())
		return err
	}

	return nil
}
