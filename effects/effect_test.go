package effects

import (
	"math"
	"math/cmplx"
	"testing"

	"gotest.tools/assert"
)

func TestEffectTest(t *testing.T) {

	arr := []complex128{-0.4, -0.3, -0.2, -0.1, cmplx.NaN(), 0.0, 0.1, 0.2, 0.3, 0.4}
	a0 := NewEffect(arr, 44100, 1024).Result()
	a1 := NewEffect(arr, 44100, 1024).ChangeDb().Result()
	a2 := NewEffect(arr, 44100, 1024).ChangeDb().ChangeHz().Result()

	t.Logf("a0 = %v", a0)
	t.Logf("a1 = %v", a1)
	t.Logf("a2 = %v", a2)
	assert.Equal(t, math.Floor(real(a0[6])*10), math.Floor(real(a2[6])*10))
}

func TestCutoffEffectTest(t *testing.T) {

	arr := []complex128{-0.4, -0.3, -0.2, -0.1, cmplx.NaN(), 0.0, 0.1, 0.2, 0.3, 0.4}
	a0 := NewEffect(arr, 44100, 1024).Result()
	a1 := NewEffect(arr, 44100, 1024).ChangeDb().HighpassDb(1024).Result()
	a2 := NewEffect(arr, 44100, 1024).ChangeDb().HighpassDb(1024).ChangeHz().Result()

	t.Logf("a0 = %v", a0)
	t.Logf("a1 = %v", a1)
	t.Logf("a2 = %v", a2)
	assert.Equal(t, math.Floor(real(a0[6])*10), math.Floor(real(a2[6])*10))
}
