package utils

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
