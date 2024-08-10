(module
    
    (import "mem" "stack" (memory $stack 1))
    (import "mem" "enter" (func $enter))
    (import "mem" "leave" (func $leave))
    (import "mem" "allocate32" (func $allocate32 (param i32) (result i32)))
    (import "mem" "allocate64" (func $allocate64 (param i32) (result i32)))

    (import "space" "f64_vec4" (func $vec4 (param $x f64) (param $y f64) (param $z f64) (param $w f64) (result i32)))
    (import "space" "f64_vec4_r" (func $vec4_r (param $x f64) (param $y f64) (param $z f64) (param $w f64) (param $result i32) (result i32)))
    (import "space" "f64_vec4_add_r" (func $vec4_add_r (param $v1 i32) (param $v2 i32) (param $result i32) (result i32)))
    (import "space" "f64_vec4_scalar_mul_r" (func $vec4_scale_r (param $v i32) (param $factor f64) (param $result i32) (result i32)))
    
    (import "space" "f64_vec3_add" (func $vec3Add (param $v1 i32) (param $v2 i32) (result i32)))
    (import "space" "f64_vec3_scalar_mul" (func $vec3Scale (param $v i32) (param $factor f64) (result i32)))

    (import "sampler" "sampleAt" (func $sampleAt (param $x f64) (param $y f64) (param $z f64) (param $result i32)))

    (func $f64_vec3_demote_copy (param $src i32) (param $dst i32) (result i32)
        (f32.store offset=0 (local.get $dst) (f32.demote_f64 (f64.load offset=0 (local.get $src))))
        (f32.store offset=4 (local.get $dst) (f32.demote_f64 (f64.load offset=8 (local.get $src))))
        (f32.store offset=8 (local.get $dst) (f32.demote_f64 (f64.load offset=16 (local.get $src))))
        (local.get $dst)
    )

    (func $f32_vec3_clone (param $v i32) (result i32)
        (local $result i32)
        (local.set $result (call $allocate32 (i32.const 3)))
        (f32.store offset=0 (local.get $result) (f32.load offset=0 (local.get $v)))
        (f32.store offset=4 (local.get $result) (f32.load offset=4 (local.get $v)))
        (f32.store offset=8 (local.get $result) (f32.load offset=8 (local.get $v)))
        (local.get $result)
    )

    (func $f64_vec4_copy (param $src i32) (param $dst i32) (result i32)
        (f64.store offset=0 (local.get $dst) (f64.load offset=0 (local.get $src)))
        (f64.store offset=8 (local.get $dst) (f64.load offset=8 (local.get $src)))
        (f64.store offset=16 (local.get $dst) (f64.load offset=16 (local.get $src)))
        (f64.store offset=24 (local.get $dst) (f64.load offset=24 (local.get $src)))
        (local.get $dst)
    )

    (func $sampleScalarField (param $resolution i32) (result i32)
        (local $index i32)
        (local $max i32)
        (local $size i32)
        (local $xi i32)
        (local $yi i32)
        (local $zi i32)
        (local $xf f64)
        (local $yf f64)
        (local $zf f64)

        (local.set $size (local.tee $max (i32.add (local.get $resolution) (i32.const 1))))
        (local.set $size (i32.mul (local.get $size) (local.get $max)))
        (local.set $size (i32.mul (local.get $size) (local.get $max)))
        (local.set $size (i32.mul (local.get $size) (i32.const 8)))

        (local.tee $index (call $allocate64 (local.get $size)))

        (local.set $zi (i32.const 0))
        (loop $nextZ
            (local.set $zf (call $normalize (local.get $zi) (local.get $resolution)))

            (local.set $yi (i32.const 0))
            (loop $nextY
                (local.set $yf (call $normalize (local.get $yi) (local.get $resolution)))

                (local.set $xi (i32.const 0))
                (loop $nextX
                    (local.set $xf (call $normalize (local.get $xi) (local.get $resolution)))
                    
                    (drop (call $vec4_r
                        (local.get $xf)
                        (local.get $yf)
                        (local.get $zf)
                        (f64.const 1)
                        (local.get $index)
                    ))
                    (local.set $index (i32.add (local.get $index) (i32.const 32)))
                    
                    (call $sampleAt
                        (local.get $xf)
                        (local.get $yf)
                        (local.get $zf)
                        (local.get $index)
                    )
                    (local.set $index (i32.add (local.get $index) (i32.const 32)))

                    (local.set $xi (i32.add (local.get $xi) (i32.const 1)))
                    (br_if $nextX (i32.le_u (local.get $xi) (local.get $resolution)))
                )

                (local.set $yi (i32.add (local.get $yi) (i32.const 1)))
                (br_if $nextY (i32.le_u (local.get $yi) (local.get $resolution)))
            )

            (local.set $zi (i32.add (local.get $zi) (i32.const 1)))
            (br_if $nextZ (i32.le_u (local.get $zi) (local.get $resolution)))
        )
    )

    (func $resampleScalarField (param $fieldRef i32) (param $resolution i32)
        (local $index i32)
        (local $xi i32)
        (local $yi i32)
        (local $zi i32)
        (local $xf f64)
        (local $yf f64)
        (local $zf f64)

        (local.set $index (i32.add (local.get $fieldRef) (i32.const 32)))

        (local.set $zi (i32.const 0))
        (loop $nextZ
            (local.set $zf (call $normalize (local.get $zi) (local.get $resolution)))

            (local.set $yi (i32.const 0))
            (loop $nextY
                (local.set $yf (call $normalize (local.get $yi) (local.get $resolution)))

                (local.set $xi (i32.const 0))
                (loop $nextX
                    (local.set $xf (call $normalize (local.get $xi) (local.get $resolution)))
                    
                    (call $sampleAt
                        (local.get $xf)
                        (local.get $yf)
                        (local.get $zf)
                        (local.get $index)
                    )
                    (local.set $index (i32.add (local.get $index) (i32.const 64)))

                    (local.set $xi (i32.add (local.get $xi) (i32.const 1)))
                    (br_if $nextX (i32.le_u (local.get $xi) (local.get $resolution)))
                )

                (local.set $yi (i32.add (local.get $yi) (i32.const 1)))
                (br_if $nextY (i32.le_u (local.get $yi) (local.get $resolution)))
            )

            (local.set $zi (i32.add (local.get $zi) (i32.const 1)))
            (br_if $nextZ (i32.le_u (local.get $zi) (local.get $resolution)))
        )
    )

    (func $normalize (param $i i32) (param $resolution i32) (result f64)
        (f64.div 
            (f64.convert_i32_s (i32.sub 
                (i32.shl 
                    (local.get $i) 
                    (i32.const 1)
                )
                (local.get $resolution)
            ))
            (f64.convert_i32_u (local.get $resolution))
        )
    )

    (func $interpolatedSample (param $fieldRef i32) (param $resolution i32) (param $x f64) (param $y f64) (param $z f64) (result i32)
        ;; Denormalized coordinates
        (local $xx f64)
        (local $yy f64)
        (local $zz f64)

        ;; Floors of denormalized coordinates
        (local $xf f64)
        (local $yf f64)
        (local $zf f64)

        ;; Denormalized coordinates converted to integers
        (local $xi i32)
        (local $yi i32)
        (local $zi i32)

        ;; Deltas between denormalized coordinates and their floors/cielings
        (local $dxf f64)
        (local $dyf f64)
        (local $dzf f64)
        (local $dxc f64)
        (local $dyc f64)
        (local $dzc f64)

        ;; Weights for cube edges parallel to x axis
        (local $w00 f64) 
        (local $w01 f64) 
        (local $w10 f64) 
        (local $w11 f64) 

        ;; Weights for each corner of the cube
        (local $w000 f64) 
        (local $w001 f64) 
        (local $w010 f64) 
        (local $w011 f64) 
        (local $w100 f64) 
        (local $w101 f64) 
        (local $w110 f64) 
        (local $w111 f64)

        ;; Offsets for the addresses of each corner of the cube
        (local $delta001 i32) 
        (local $delta010 i32) 
        (local $delta011 i32) 
        (local $delta100 i32) 
        (local $delta101 i32) 
        (local $delta110 i32) 
        (local $delta111 i32)

        (local $point000 i32)
        (local $result i32)
        (local $op i32)

        (local.set $result (call $vec4 (f64.const 0.0) (f64.const 0.0) (f64.const 0.0) (f64.const 0.0)))
        (if (f64.lt (local.get $x) (f64.const -1))
            (then (return (local.get $result)))
        )
        (if (f64.gt (local.get $x) (f64.const 1))
            (then (return (local.get $result)))
        )
        (if (f64.lt (local.get $y) (f64.const -1))
            (then (return (local.get $result)))
        )
        (if (f64.gt (local.get $y) (f64.const 1))
            (then (return (local.get $result)))
        )
        (if (f64.lt (local.get $z) (f64.const -1))
            (then (return (local.get $result)))
        )
        (if (f64.gt (local.get $z) (f64.const 1))
            (then (return (local.get $result)))
        )

        (local.set $xi (i32.trunc_f64_s (local.tee $xf (f64.floor (local.tee $xx (call $denormalize (local.get $x) (local.get $resolution)))))))
        (local.set $yi (i32.trunc_f64_s (local.tee $yf (f64.floor (local.tee $yy (call $denormalize (local.get $y) (local.get $resolution)))))))
        (local.set $zi (i32.trunc_f64_s (local.tee $zf (f64.floor (local.tee $zz (call $denormalize (local.get $z) (local.get $resolution)))))))

        (local.set $dxc (f64.sub (f64.const 1.0) (local.tee $dxf (f64.sub (local.get $xx) (local.get $xf)))))
        (local.set $dyc (f64.sub (f64.const 1.0) (local.tee $dyf (f64.sub (local.get $yy) (local.get $yf)))))
        (local.set $dzc (f64.sub (f64.const 1.0) (local.tee $dzf (f64.sub (local.get $zz) (local.get $zf)))))

        (local.set $w00 (f64.mul (local.get $dyc) (local.get $dzc)))
        (local.set $w01 (f64.mul (local.get $dyc) (local.get $dzf)))
        (local.set $w10 (f64.mul (local.get $dyf) (local.get $dzc)))
        (local.set $w11 (f64.mul (local.get $dyf) (local.get $dzf)))

        (local.set $w000 (f64.mul (local.get $dxc) (local.get $w00))) 
        (local.set $w001 (f64.mul (local.get $dxc) (local.get $w01)))
        (local.set $w010 (f64.mul (local.get $dxc) (local.get $w10))) 
        (local.set $w011 (f64.mul (local.get $dxc) (local.get $w11))) 
        (local.set $w100 (f64.mul (local.get $dxf) (local.get $w00))) 
        (local.set $w101 (f64.mul (local.get $dxf) (local.get $w01))) 
        (local.set $w110 (f64.mul (local.get $dxf) (local.get $w10))) 
        (local.set $w111 (f64.mul (local.get $dxf) (local.get $w11))) 

        (local.set $delta100 (i32.const 64)) 
        (local.set $delta010 (i32.mul (local.get $delta100) (i32.add (local.get $resolution) (i32.const 1)))) 
        (local.set $delta001 (i32.mul (local.get $delta010) (i32.add (local.get $resolution) (i32.const 1))))
        (local.set $delta011 (i32.add (local.get $delta010) (local.get $delta001))) 
        (local.set $delta101 (i32.add (local.get $delta100) (local.get $delta001))) 
        (local.set $delta110 (i32.add (local.get $delta100) (local.get $delta010))) 
        (local.set $delta111 (i32.add (local.get $delta101) (local.get $delta010)))

        (local.get $fieldRef)
        (i32.const 32) ;; Skip over position vector to point to gradient vector
        (i32.mul (local.get $xi) (local.get $delta100))
        (i32.mul (local.get $yi) (local.get $delta010))
        (i32.mul (local.get $zi) (local.get $delta001))
        (i32.add)
        (i32.add)
        (i32.add)
        (i32.add)
        (local.set $point000)

        (call $enter)
        (local.set $op (call $allocate64 (i32.const 4)))

        (drop (call $vec4_scale_r (local.get $point000) (local.get $w000) (local.get $result)))
        
        (if (f64.gt (local.get $w001) (f64.const 0.0)) (then
            (drop (call $vec4_scale_r (i32.add (local.get $point000) (local.get $delta001)) (local.get $w001) (local.get $op)))
            (drop (call $vec4_add_r (local.get $result) (local.get $op) (local.get $result)))
        ))

        (if (f64.gt (local.get $w010) (f64.const 0.0)) (then
            (drop (call $vec4_scale_r (i32.add (local.get $point000) (local.get $delta010)) (local.get $w010) (local.get $op)))
            (drop (call $vec4_add_r (local.get $result) (local.get $op) (local.get $result)))
        ))

        (if (f64.gt (local.get $w011) (f64.const 0.0)) (then
            (drop (call $vec4_scale_r (i32.add (local.get $point000) (local.get $delta011)) (local.get $w011) (local.get $op)))
            (drop (call $vec4_add_r (local.get $result) (local.get $op) (local.get $result)))
        ))

        (if (f64.gt (local.get $w100) (f64.const 0.0)) (then
            (drop (call $vec4_scale_r (i32.add (local.get $point000) (local.get $delta100)) (local.get $w100) (local.get $op)))
            (drop (call $vec4_add_r (local.get $result) (local.get $op) (local.get $result)))
        ))

        (if (f64.gt (local.get $w101) (f64.const 0.0)) (then
            (drop (call $vec4_scale_r (i32.add (local.get $point000) (local.get $delta101)) (local.get $w101) (local.get $op)))
            (drop (call $vec4_add_r (local.get $result) (local.get $op) (local.get $result)))
        ))

        (if (f64.gt (local.get $w110) (f64.const 0.0)) (then
            (drop (call $vec4_scale_r (i32.add (local.get $point000) (local.get $delta110)) (local.get $w110) (local.get $op)))
            (drop (call $vec4_add_r (local.get $result) (local.get $op) (local.get $result)))
        ))

        (if (f64.gt (local.get $w111) (f64.const 0.0)) (then
            (drop (call $vec4_scale_r (i32.add (local.get $point000) (local.get $delta111)) (local.get $w111) (local.get $op)))
            (drop (call $vec4_add_r (local.get $result) (local.get $op) (local.get $result)))
        ))

        (call $leave)
         (local.get $result)
    )

    (func $nearestSample (param $fieldRef i32) (param $resolution i32) (param $x f64) (param $y f64) (param $z f64) (result i32)
        (local $xi i32)
        (local $yi i32)
        (local $zi i32)

        (local $point i32)
        (local $result i32)

        (local.set $xi (i32.trunc_f64_s (f64.nearest (call $denormalize (local.get $x) (local.get $resolution)))))
        (local.set $yi (i32.trunc_f64_s (f64.nearest (call $denormalize (local.get $y) (local.get $resolution)))))
        (local.set $zi (i32.trunc_f64_s (f64.nearest (call $denormalize (local.get $z) (local.get $resolution)))))

        (local.set $result (call $vec4 (f64.const 0.0) (f64.const 0.0) (f64.const 0.0) (f64.const 0.0)))
        (if (i32.lt_s (local.get $xi) (i32.const 0))
            (then (return (local.get $result)))
        )
        (if (i32.gt_s (local.get $xi) (local.get $resolution))
            (then (return (local.get $result)))
        )
        (if (i32.lt_s (local.get $yi) (i32.const 0))
            (then (return (local.get $result)))
        )
        (if (i32.gt_s (local.get $yi) (local.get $resolution))
            (then (return (local.get $result)))
        )
        (if (i32.lt_s (local.get $zi) (i32.const 0))
            (then (return (local.get $result)))
        )
        (if (i32.gt_s (local.get $zi) (local.get $resolution))
            (then (return (local.get $result)))
        )

        (local.get $zi)
        (i32.add (local.get $resolution) (i32.const 1))
        (i32.mul)
        (local.get $yi)
        (i32.add)
        (i32.add (local.get $resolution) (i32.const 1))
        (i32.mul)
        (local.get $xi)
        (i32.add)
        (i32.const 64)
        (i32.mul)
        (i32.add (local.get $fieldRef) (i32.const 32))
        (i32.add)
        (local.set $point)

        (call $f64_vec4_copy (local.get $point) (local.get $result))
    )

    (func $denormalize (param $s f64) (param $resolution i32) (result f64)
        (f64.mul
            (f64.mul
                (f64.add (local.get $s) (f64.const 1.0))
                (f64.const 0.5)
            )
            (f64.convert_i32_u (local.get $resolution))
        )
    )

    (func $tesselateScalarField (param $fieldRef i32) (param $resolution i32) (param $contourValue f64) (result i32)
        (local $point000 i32) 
        (local $delta001 i32) 
        (local $delta010 i32) 
        (local $delta011 i32) 
        (local $delta100 i32) 
        (local $delta101 i32) 
        (local $delta110 i32) 
        (local $delta111 i32)
        (local $x i32)
        (local $y i32)
        (local $z i32)

        (local.set $delta100 (i32.const 64)) 
        (local.set $delta010 (i32.mul (local.get $delta100) (i32.add (local.get $resolution) (i32.const 1)))) 
        (local.set $delta001 (i32.mul (local.get $delta010) (i32.add (local.get $resolution) (i32.const 1))))
        (local.set $delta011 (i32.add (local.get $delta010) (local.get $delta001))) 
        (local.set $delta101 (i32.add (local.get $delta100) (local.get $delta001))) 
        (local.set $delta110 (i32.add (local.get $delta100) (local.get $delta010))) 
        (local.set $delta111 (i32.add (local.get $delta101) (local.get $delta010)))

        (local.set $point000 (local.get $fieldRef)) 
        (call $noTriangles)

        (local.set $z (i32.const 0))
        (loop $nextZ

            (local.set $y (i32.const 0))
            (loop $nextY

                (local.set $x (i32.const 0))
                (loop $nextX
                    
                    (drop (call $tessellateCube
                        (local.get $contourValue)
                        (local.get $point000)
                        (i32.add (local.get $point000) (local.get $delta001))
                        (i32.add (local.get $point000) (local.get $delta010))
                        (i32.add (local.get $point000) (local.get $delta011))
                        (i32.add (local.get $point000) (local.get $delta100))
                        (i32.add (local.get $point000) (local.get $delta101))
                        (i32.add (local.get $point000) (local.get $delta110))
                        (i32.add (local.get $point000) (local.get $delta111))
                    ))

                    (local.set $point000 (i32.add (local.get $point000) (local.get $delta100)))
                    (local.set $x (i32.add (local.get $x) (i32.const 1)))
                    (br_if $nextX (i32.lt_u (local.get $x) (local.get $resolution)))
                )
                (local.set $point000 (i32.add (local.get $point000) (local.get $delta100)))

                (local.set $y (i32.add (local.get $y) (i32.const 1)))
                (br_if $nextY (i32.lt_u (local.get $y) (local.get $resolution)))
            )
            (local.set $point000 (i32.add (local.get $point000) (local.get $delta010)))

            (local.set $z (i32.add (local.get $z) (i32.const 1)))
            (br_if $nextZ (i32.lt_u (local.get $z) (local.get $resolution)))
        )
    )

    (func $tessellateCube 
        (param $contourValue f64) 
        (param $point000 i32) 
        (param $point001 i32) 
        (param $point010 i32) 
        (param $point011 i32) 
        (param $point100 i32) 
        (param $point101 i32) 
        (param $point110 i32) 
        (param $point111 i32) 
        (result i32)
        (call $tessellateTetrahedron (local.get $contourValue) (local.get $point111) (local.get $point000) (local.get $point100) (local.get $point110))
        (drop 
            (call $tessellateTetrahedron (local.get $contourValue) (local.get $point111) (local.get $point000) (local.get $point110) (local.get $point010))
        )
        (drop 
            (call $tessellateTetrahedron (local.get $contourValue) (local.get $point111) (local.get $point000) (local.get $point010) (local.get $point011))
        )
        (drop 
            (call $tessellateTetrahedron (local.get $contourValue) (local.get $point111) (local.get $point000) (local.get $point011) (local.get $point001))
        )
        (drop 
            (call $tessellateTetrahedron (local.get $contourValue) (local.get $point111) (local.get $point000) (local.get $point001) (local.get $point101))
        )
        (drop 
            (call $tessellateTetrahedron (local.get $contourValue) (local.get $point111) (local.get $point000) (local.get $point101) (local.get $point100))
        )
    )

    (func $tessellateTetrahedron 
        (param $contourValue f64) 
        (param $point0 i32) 
        (param $point1 i32) 
        (param $point2 i32) 
        (param $point3 i32) 
        (result i32)

        (local $pattern i32)
        (local $inverse i32)
        (local $first i32)

        (local.set $inverse (i32.const 0))
        (local.set $pattern (call $calculatePattern 
            (local.get $contourValue) 
            (local.get $point0) 
            (local.get $point1) 
            (local.get $point2) 
            (local.get $point3)
        ))

        (if (i32.gt_u (i32.popcnt (local.get $pattern)) (i32.const 2))
            (then
                (local.set $inverse (i32.const 1))
                (local.set $pattern (i32.xor (local.get $pattern) (i32.const 0xF)))
            )
        )

        (if (i32.and (local.get $pattern) (i32.const 1))
            (then (return (call $doTessellateTetrahedron 
                (local.get $contourValue) 
                (local.get $point0) 
                (local.get $point1) 
                (local.get $point2) 
                (local.get $point3)
                (local.get $pattern)
                (local.get $inverse)
            )))
        )
        (if (i32.and (local.get $pattern) (i32.const 2))
            (then (return (call $doTessellateTetrahedron 
                (local.get $contourValue) 
                (local.get $point1) 
                (local.get $point0) 
                (local.get $point3)
                (local.get $point2) 
                (call $bits (local.get $pattern) (i32.const 1) (i32.const 0) (i32.const 3) (i32.const 2))
                (local.get $inverse)
            )))
        )
        (if (i32.and (local.get $pattern) (i32.const 4))
            (then (return (call $doTessellateTetrahedron 
                (local.get $contourValue) 
                (local.get $point2) 
                (local.get $point3)
                (local.get $point0) 
                (local.get $point1) 
                (call $bits (local.get $pattern) (i32.const 2) (i32.const 3) (i32.const 0) (i32.const 1))
                (local.get $inverse)
            )))
        )
        (if (i32.and (local.get $pattern) (i32.const 8))
            (then (return (call $doTessellateTetrahedron 
                (local.get $contourValue) 
                (local.get $point3)
                (local.get $point2) 
                (local.get $point1) 
                (local.get $point0) 
                (call $bits (local.get $pattern) (i32.const 3) (i32.const 2) (i32.const 1) (i32.const 0))
                (local.get $inverse)
            )))
        )

        (return (call $noTriangles))
    )

    (func $doTessellateTetrahedron 
        (param $contourValue f64) 
        (param $point0 i32) 
        (param $point1 i32) 
        (param $point2 i32) 
        (param $point3 i32) 
        (param $pattern i32)
        (param $inverse i32)
        (result i32)

        (if (i32.eq (local.get $pattern) (i32.const 3))
            (then (return (call $twoTriangles 
                (local.get $contourValue) 
                (local.get $point0) 
                (local.get $point1) 
                (local.get $point2) 
                (local.get $point3) 
                (local.get $inverse)
            )))
        )
        (if (i32.eq (local.get $pattern) (i32.const 5))
            (then (return (call $twoTriangles 
                (local.get $contourValue) 
                (local.get $point0) 
                (local.get $point2) 
                (local.get $point3) 
                (local.get $point1) 
                (local.get $inverse)
            )))
        )
        (if (i32.eq (local.get $pattern) (i32.const 9))
            (then (return (call $twoTriangles 
                (local.get $contourValue) 
                (local.get $point0) 
                (local.get $point3) 
                (local.get $point1) 
                (local.get $point2) 
                (local.get $inverse)
            )))
        )
        (return (call $oneTriangle 
            (local.get $contourValue) 
            (local.get $point0) 
            (local.get $point1) 
            (local.get $point2) 
            (local.get $point3) 
            (local.get $inverse)
        ))
    )

    (func $noTriangles (result i32)
        (call $allocate32 (i32.const 0))
    )

    (func $oneTriangle 
        (param $contourValue f64) 
        (param $point0 i32) 
        (param $point1 i32) 
        (param $point2 i32) 
        (param $point3 i32) 
        (param $inverse i32)
        (result i32)
        (if (result i32) (local.get $inverse)
            (then
                (call $edge (local.get $contourValue) (local.get $point0) (local.get $point1)) 
                (drop (call $edge (local.get $contourValue) (local.get $point0) (local.get $point2)))
                (drop (call $edge (local.get $contourValue) (local.get $point0) (local.get $point3))) 
            )
            (else
                (call $edge (local.get $contourValue) (local.get $point0) (local.get $point3)) 
                (drop (call $edge (local.get $contourValue) (local.get $point0) (local.get $point2)))
                (drop (call $edge (local.get $contourValue) (local.get $point0) (local.get $point1))) 
            )
        )
    )

    (func $twoTriangles 
        (param $contourValue f64) 
        (param $point0 i32) 
        (param $point1 i32) 
        (param $point2 i32) 
        (param $point3 i32) 
        (param $inverse i32)
        (result i32)
        (if (result i32) (local.get $inverse)
            (then
                (call $edge (local.get $contourValue) (local.get $point0) (local.get $point2)) 
                (call $edge (local.get $contourValue) (local.get $point0) (local.get $point3))
                (call $edge (local.get $contourValue) (local.get $point1) (local.get $point2))
                (drop (call $edgeClone))
                (drop (call $edgeClone))
                (drop (call $edge (local.get $contourValue) (local.get $point1) (local.get $point3)))
            )
            (else
                (call $edge (local.get $contourValue) (local.get $point0) (local.get $point2)) 
                (call $edge (local.get $contourValue) (local.get $point1) (local.get $point2))
                (call $edge (local.get $contourValue) (local.get $point0) (local.get $point3))
                (drop (call $edgeClone))
                (drop (call $edgeClone))
                (drop (call $edge (local.get $contourValue) (local.get $point1) (local.get $point3)))
            )
        )
    )

    (func $edge (param $contourValue f64) (param $point1 i32) (param $point2 i32) (result i32)
        (local $point i32)
        (local $normal i32)
        (local $gradient1 i32)
        (local $gradient2 i32)
        (local $weight1 f64)
        (local $weight2 f64)
        (local $sum f64)
        
        (local.set $gradient1 (i32.add (local.get $point1) (i32.const 32)))
        (local.set $gradient2 (i32.add (local.get $point2) (i32.const 32)))
        (local.set $weight1 (f64.sub (local.get $contourValue) (call $pointValue (local.get $point2))))
        (local.set $weight2 (f64.sub (call $pointValue (local.get $point1)) (local.get $contourValue)))
        (local.set $sum (f64.add (local.get $weight1) (local.get $weight2)))
        (local.set $weight1 (f64.div (local.get $weight1) (local.get $sum)))
        (local.set $weight2 (f64.div (local.get $weight2) (local.get $sum)))

        (local.tee $point (call $allocate32 (i32.const 3)))
        (local.set $normal (call $allocate32 (i32.const 3)))
        (call $enter)
        (drop (call $f64_vec3_demote_copy 
            (call $vec3Add 
                (call $vec3Scale (local.get $point1) (local.get $weight1))
                (call $vec3Scale (local.get $point2) (local.get $weight2))
            ) 
            (local.get $point)
        ))
        (drop (call $f64_vec3_demote_copy 
            (call $vec3Scale (call $vec3Add 
                (call $vec3Scale (local.get $gradient1) (local.get $weight1))
                (call $vec3Scale (local.get $gradient2) (local.get $weight2))
            ) (f64.const -1))
            (local.get $normal)
        ))
        (call $leave)
    )

    (func $edgeClone (param $edge i32) (result i32)
        (call $f32_vec3_clone (local.get $edge))
        (drop (call $f32_vec3_clone (i32.add (local.get $edge) (i32.const 12))))
    )

    (func $calculatePattern 
        (param $contourValue f64) 
        (param $point0 i32) 
        (param $point1 i32) 
        (param $point2 i32) 
        (param $point3 i32) 
        (result i32)
        (i32.const 0)
        (i32.or (call $isHotPoint (local.get $point0) (local.get $contourValue) (i32.const 1)))
        (i32.or (call $isHotPoint (local.get $point1) (local.get $contourValue) (i32.const 2)))
        (i32.or (call $isHotPoint (local.get $point2) (local.get $contourValue) (i32.const 4)))
        (i32.or (call $isHotPoint (local.get $point3) (local.get $contourValue) (i32.const 8)))
    )
    
    (func $isHotPoint (param $point i32) (param $contourValue f64) (param $trueValue i32) (result i32)
        (if (result i32) (f64.ge (call $pointValue (local.get $point)) (local.get $contourValue))
            (then (local.get $trueValue))
            (else (i32.const 0))
        )
    )

    (func $pointValue (param $point i32) (result f64)
        (f64.load (i32.add (local.get $point) (i32.const 56)))
    )

    (func $bits (param $pattern i32) (param $bit0 i32) (param $bit1 i32) (param $bit2 i32) (param $bit3 i32) (result i32)
        (i32.and (i32.shr_u (local.get $pattern) (local.get $bit3))(i32.const 1))
        
        (i32.shl (i32.const 1))
        (i32.and (i32.shr_u (local.get $pattern) (local.get $bit2))(i32.const 1))
        (i32.or)
        
        (i32.shl (i32.const 1))
        (i32.and (i32.shr_u (local.get $pattern) (local.get $bit1))(i32.const 1))
        (i32.or)
        
        (i32.shl (i32.const 1))
        (i32.and (i32.shr_u (local.get $pattern) (local.get $bit0))(i32.const 1))
        (i32.or)
    )

    (export "sampleScalarField" (func $sampleScalarField))
    (export "resampleScalarField" (func $resampleScalarField))
    (export "interpolatedSample" (func $interpolatedSample))
    (export "nearestSample" (func $nearestSample))
    (export "tessellateTetrahedron" (func $tessellateTetrahedron))
    (export "tessellateCube" (func $tessellateCube))
    (export "tesselateScalarField" (func $tesselateScalarField))

)