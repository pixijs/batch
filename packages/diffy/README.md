# @pixi-pbr/diffy

This package can be used to minimize buffer upload overhead in vertex-bound applications. It exploits
`bufferSubData` to upload only modified parts of the batched geometry. This trades off graphics memory
for reducing data transfers.

## Installation :package:

```bash
npm install @pixi-pbr/diffy
```

## Notes

* **WebGL 1**: WebGL 1 does not the required overload of `gl.bufferSubData` to do partial uploads. This
    in turns only allows optimizations in the case where the geometry has not changed at all.
* **Projection Matrix**: If your application uses a viewport (like `pixi-viewport` by David Fignater), then
    you can optimize it use a projection-matrix so that your object's coordinate do not change when modifying
    the viewport itself. This has the effect of the geometry not changing at all when panning/zooming so buffer uploads can be fully optimized away!

## Usage

To enable this optimization, you can use the exported geometry-factory and drawer.

```js
import { BatchRendererPluginFactory } from 'pixi-batch-renderer';
import { DiffGeometryFactory, DiffDrawer } from '@pixi-pbr/diffy';

// YourRenderer will have the diffy optimization!
const YourRenderer = BatchRendererPluginFactory.from({
    ...yourOptions,
    BatchGeometryFactoryClass: DiffGeometryFactory,
    BatchDrawerClass: DiffDrawer
});
```

## Collaboration

I'd like to thank [Strytegy](https://www.strytegy.com) for funding the initial development of this package.

<a href="https://www.strytegy.com"><img src="https://i.imgur.com/3Ns1JJb.png" width="153.3px" /></a>
