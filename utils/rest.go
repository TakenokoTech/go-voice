package utils

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"
)

type Request struct {
	Sound string `json:"sound"`
}

// JSONParse :
func JSONParse(w http.ResponseWriter, r *http.Request, o interface{}) error {
	//To allocate slice for request body
	length, err := strconv.Atoi(r.Header.Get("Content-Length"))
	if err != nil {
		return err
	}

	//Read body data to parse json
	body := make([]byte, length)
	length, err = r.Body.Read(body)
	if err != nil && err != io.EOF {
		return err
	}

	//parse json
	if err := json.Unmarshal(body[:length], &o); err != nil {
		return err
	}

	return nil
}
