# Browser emulator cores

These files are the pinned FCEUmm and Gambatte Libretro WebAssembly builds used by
the browser player. They were extracted without modification from the
`v1.22.2` release archives in
[`arianrhodsandlot/retroarch-emscripten-build`](https://github.com/arianrhodsandlot/retroarch-emscripten-build).

The app serves the extracted files from its own origin so game launches do not
depend on loading a ZIP extractor and unpacking a CDN archive at runtime.

SHA-256 checksums:

```text
2670e515566d0c95631e8882aba0914760411fc3b17ce50c65bf150353c34aed  fceumm_libretro.js
99c4da050e7f341f09e42edc86d15fdecc51cb043b3dcf609b82a92f37960e20  fceumm_libretro.wasm
57d26f3e54a06b059557d33c8ad701693566c3906716298be85d70a6dc308933  gambatte_libretro.js
607a5978d906f844f10654e50feb3a41ff2ce154f296ed0a98df3ce9d7710809  gambatte_libretro.wasm
```
