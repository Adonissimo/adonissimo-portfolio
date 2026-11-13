# Photographed terrain materials

Source: Poly Haven. These material photographs are CC0, separate from the portfolio's unofficial Nintendo fan-art identity.

- Rock Face 03: https://polyhaven.com/a/rock_face_03
- Forest Ground 04: https://polyhaven.com/a/forest_ground_04
- License: https://polyhaven.com/license
- File metadata: https://api.polyhaven.com/files/rock_face_03 and https://api.polyhaven.com/files/forest_ground_04

The supplied 1K JPG diffuse, OpenGL normal and packed ARM maps were resized with Sharp to 1024 and 512 pixels, then encoded as optimized 256-color PNGs. Color textures use modest dithering; data maps use none. Compact devices request the 512-pixel set only. Desktop requests the 1024-pixel set. No runtime third-party requests are made.

`color` is sRGB albedo. `normal` is linear OpenGL tangent-space normal data. `arm` is linear packed ambient occlusion (red), roughness (green), and metalness (blue); stone/ground use its first two channels only. Procedural relief remains available if a photograph fails to load. These are material textures, not screenshots or project evidence.
