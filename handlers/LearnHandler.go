package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/TakenokoTech/go-voice/utils"
	"github.com/tensorflow/tensorflow/tensorflow/go/op"

	tf "github.com/tensorflow/tensorflow/tensorflow/go"
)

// LearnRequest :
type LearnRequest struct {
}

// LearnResponce :
type LearnResponce struct {
}

// LearnHandler :
func LearnHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("sound. %v\n", r.Header.Get("Origin"))
	start := time.Now()

	// ======== TENSOR ========
	s := op.NewScope()
	c := op.Const(s, "Hello from TensorFlow version "+tf.Version())
	graph, err := s.Finalize()
	if err != nil {
		panic(err)
	}
	// Execute the graph in a session.
	sess, err := tf.NewSession(graph, nil)
	if err != nil {
		panic(err)
	}
	output, err := sess.Run(nil, []tf.Output{c}, nil)
	if err != nil {
		panic(err)
	}
	fmt.Println(output[0].Value())

	// Response
	end := time.Now()
	fmt.Printf("%f秒\n", (end.Sub(start)).Seconds())
	res, err := json.Marshal(LearnResponce{})
	if err != nil {
		log.Printf("Response Error: %v", err)
	}
	utils.ResponseSuccess(w, res)
}
