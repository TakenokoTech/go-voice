package effect

import (
	"math"
	"math/cmplx"
	"testing"

	"gotest.tools/assert"
)

func TestESoundHandler(t *testing.T) {

	arr := []complex128{-0.4, -0.3, -0.2, -0.1, cmplx.NaN(), 0.0, 0.1, 0.2, 0.3, 0.4}
	a0 := NewEffect(arr).Result()
	a1 := NewEffect(arr).ChangeDb().Result()
	a2 := NewEffect(arr).ChangeDb().ChangeHz().Result()

	t.Logf("a0 = %v", a0)
	t.Logf("a1 = %v", a1)
	t.Logf("a2 = %v", a2)
	assert.Equal(t, math.Floor(real(a0[6])*10), math.Floor(real(a2[6])*10))
}
