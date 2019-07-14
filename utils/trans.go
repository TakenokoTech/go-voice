package utils

import "log"

// Float32To64 :
func Float32To64(f32 []float32) []float64 {
	f64 := make([]float64, 0, len(f32))
	for index := range f32 {
		f64 = append(f64, float64(f32[index]))
	}
	return f64
}

// Float64To32 :
func Float64To32(f64 []float64) []float32 {
	f32 := make([]float32, 0, len(f64))
	for index := range f64 {
		f32 = append(f32, float32(f64[index]))
	}
	return f32
}

// Float64ToComplex128 :
func Float64ToComplex128(x []float64) []complex128 {
	c128 := make([]complex128, 0, len(x))
	for index := range x {
		c128 = append(c128, complex(x[index], 0))
	}
	return c128
}

// Complex128ToFloat32 :
func Complex128ToFloat32(x []complex128) []float32 {
	f32 := make([]float32, 0, len(x))
	for index := range x {
		re := real(x[index])
		f32 = append(f32, float32(re))
	}
	return f32
}

// Multiple :
func Multiple(m float64, x []complex128) []complex128 {
	c128 := make([]complex128, 0, len(x))
	for index := range x {
		c128 = append(c128, x[index]*complex(m, 0))
	}
	return c128
}

// Anlytics :
func Anlytics(sound []complex128) {
	maxReI, minReI := 0, 0
	maxImI, minImI := 0, 0
	maxRe, minRe := float64(-100000), float64(100000)
	maxIm, minIm := float64(-100000), float64(100000)
	for i, frame := range sound {
		re := real(sound[i])
		im := imag(sound[i])
		if maxRe < re {
			maxRe = re
			maxReI = i
		}
		if minRe > re {
			minRe = re
			minReI = i
		}
		if maxIm < im {
			maxIm = im
			maxImI = i
		}
		if minIm > im {
			minIm = im
			minImI = i
		}

		if real(frame) > 10 {
			log.Printf("[Frame] [%4d]%3f", i, frame)
		}
	}

	if maxRe > 5 {
		log.Printf("[Real] max: [%4d]%3f, min: [%4d]%3f", maxReI, maxRe, minReI, minRe)
		log.Printf("[Imag] max: [%4d]%3f, min: [%4d]%3f", maxImI, maxIm, minImI, minIm)
		log.Printf("====================================")
	}
}
