# Change Log - pixi-batch-renderer

This log was last generated on Tue, 06 Apr 2021 13:59:04 GMT and should not be manually modified.

## 2.5.3
Tue, 06 Apr 2021 13:59:04 GMT

### Patches

- Fix texture-lookup attribute not being filled correctly for multi-texture geometres (i.e. texturesPerObject > 1)

## 2.5.1
Sun, 28 Mar 2021 19:51:30 GMT

### Patches

- Fix vertexSizeFor crashing pixi-batch-renderer due to dangling reference to PIXI.

## 2.5.0
Sun, 28 Mar 2021 19:20:49 GMT

### Minor changes

- Upgrade to PixiJS 6

## 2.4.2
Mon, 19 Oct 2020 00:38:23 GMT

### Patches

- Fixes the incorrect resolution of vertex count in geometry merging

## 2.4.1
Mon, 19 Oct 2020 00:28:47 GMT

### Patches

- Fixes the resolution of the vertex count if vertexCountProperty was not passed.

## 2.4.0
Mon, 19 Oct 2020 00:17:18 GMT

### Minor changes

- Support manual resolution of the number of indices to be batched.

## 2.3.7
Sun, 18 Oct 2020 23:46:38 GMT

### Patches

- Support passing vertexCountProperty as a functor.

## 2.3.6
Sun, 30 Aug 2020 15:11:17 GMT

### Patches

- Added unit-test for BufferPool, fixed crash when the an unallocated buffer was released.

## 2.3.5
Sat, 29 Aug 2020 19:06:52 GMT

### Patches

- Don't upload docs, compile to npm

## 2.3.4
Sat, 29 Aug 2020 19:02:11 GMT

### Patches

- .cjs -> .js, .mjs -> .es.js for bundles
- BufferPool API!

