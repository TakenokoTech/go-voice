package utils

// #include <stdio.h>
// #include <stdlib.h>
//
// static void myprint(char* s) {
//   printf("%s\n", s);
// }

import "C"

// Sound :
func Sound() string {
	C.CString("Hello from stdio")
	//log.Printf("%v", C.myprint(cs))
	// f := C.sound()
	return "" //f
}
