# pixi-batch-renderer

![Node.js CI](https://github.com/pixijs/pixi-batch-renderer/workflows/Node.js%20CI/badge.svg)
[![install size](https://packagephobia.now.sh/badge?p=pixi-batch-renderer)](https://packagephobia.now.sh/result?p=pixi-batch-renderer)
![](https://img.shields.io/bundlephobia/min/pixi-batch-renderer)
![](https://img.shields.io/npm/v/pixi-batch-renderer/latest)
[![](https://data.jsdelivr.com/v1/package/npm/pixi-batch-renderer-alpha/badge)](https://www.jsdelivr.com/package/npm/pixi-batch-renderer-alpha)
![dependencies](https://david-dm.org/sukantpal/pixi-batch-renderer.svg)

`pixi-batch-renderer` is a PixiJS plugin that allows you to add batch rendering to your custom display objects. I have documented each class in the `PIXI.brend` namespace.

## Usage

In browser:
```js
PIXI.brend.BatchRenderer
```

Using ES:
```js
import { BatchRenderer } from 'pixi-batch-renderer';
```

## Concepts

[Batch rendering](https://medium.com/swlh/inside-pixijs-batch-rendering-system-fad1b466c420) objects involves aggregating them into groups/batches and rendering them together with one WebGL draw call. PixiJS supports batch rendering its internal display objects - `PIXI.Sprite`, `PIXI.Graphics`, and `PIXI.Mesh`. However, it is difficult to extend that to custom-built display objects; it wasn't designed as an exposable API.

This library builds upon the same concept and is designed for maximum flexibility. It still uses PixiJS's batch system - a stub that enables objects to be rendered asynchronously, without loosing the order of rendering. To understand how it works, understanding these things are helpful:

* **Attribute Redirects**: An attribute redirect is a data-object that tells `pixi-batch-renderer` how it will transform your object into a set of shader attributes.

* **Index Property**: If you use indices, this will be property on your display object that holds those indices. It could also be a constant array, rather than a property on each object.

* **State Function**: This function/property tells the batch renderer what WebGL state is required to render a display-object. It is optional if you're display objects use the default state (`PIXI.State.for2d()`).

* **Shader Function**: This function generates the shader to render whole batches. It takes one argument - the batch renderer
that will use the shader. You can use the `BatchShaderFactory#derive()` API for create one.

### New features

* **Shader Templates**: The `BatchShaderFactory` allows you to write shader "templates" containing `%macros%`. At runtime, you
can replace these macros based with another expression. For example, the (built-in) `%texturesPerBatch%` macro is set to the
no. of textures units in the GPU.

* **Custom uniforms**: [Experimental] You can also use uniforms in the batch shader; however, this might reduce the batching
efficiency if most batchable display-objects have different values for uniforms (because then they can't be batched together).

* **Modular architecture**: With the modular architecture of this library, you change the behaviour of any component. The
geometry composition, batch generation, and drawing stages are componentized and can be modified by providing a custom
implementation to `BatchRendererPluginFactory.from`.

### Caveat with filtered/masked objects

Before rendering itself, a `PIXI.Container` with filters or a mask will flush the batch renderer and will not batch itself. This
is because the PixiJS batch renderer cannot batch filtered and masked objects. Although this does not break pixi-batch-renderer,
it does reduce batching-efficiency. If you want to create a batch renderer that will batch filtered and masked objects too, your display-object must override `render` (**however, you will have to derive your own batch renderer class for that**):

```
render(renderer: PIXI.Renderer): void
{
  // If you registered the batch renderer as a plugin "pluginName", then replace <BatchRenderer> with
  // renderer.plugins.pluginName
  renderer.setObjectRenderer(<BatchRenderer>);
  <BatchRenderer>.render(this);

  for (let i = 0, j = this.children.length; i < j; i++)
  {
      this._children.render(renderer);
  }
}
```

# Usage

### Standard Pipeline

For most use cases, `PIXI.brend.BatchRendererPluginFactory` is all you'll need from this library. You need to do these three things:

1. **Generate the plugin class using `PIXI.brend.BatchRendererPluginFactory.from`**

2. **Register the plugin with PixiJS's WebGL renderer**

3. **Make your custom display object defer its rendering to your plugin**

An example implementation would look like:

```js
import * as PIXI from 'pixi.js';
import { AttributeRedirect, BatchRendererPluginFactory, BatchShaderFactory } from 'pixi-batch-renderer';

// ExampleFigure has two attributes: aVertex and aTextureCoord. They come from the
// vertices and uvs properties in this object. The indices are in the indices property.
class ExampleFigure extends PIXI.Container
{
  _render(renderer)
  {
    this.vertices = [x0,y0, x1,y1, x2,y2, ..., xn,yn];// variable number of vertices
    this.uvs = [u0,v0, u1,v1, u2, v2, ..., un,yn];// however, all other attributes must have equal length
    this.texture = PIXI.Texture.from("url:example");

    this.indices = [0, 1, 2, ..., n];// we could also tell our batch renderer to not use indices too :)

    renderer.setObjectRenderer(renderer.plugins["ExampleRenderer"]);
    renderer.plugins["ExampleRenderer"].render(this);
  }
}

// Define the geometry of ExampleFigure.
const attribSet = [
  new AttributeRedirect({
      source: "vertices", 
      attrib: "aVertex", 
      type: 'float32', 
      size: 2, 
      glType: PIXI.TYPES.FLOAT, 
      glSize: 2
  }),
  new AttributeRedirect({
      source: "uvs", 
      attrib: "aTextureCoord", 
      type: 'float32', 
      size: 2, 
      glType: PIXI.TYPES.FLOAT, 
      size: 2
  }),
];

// Create a shader function from a shader template!
const shaderFunction = new BatchShaderFactory(
// Vertex Shader
`
attribute vec2 aVertex;
attribute vec2 aTextureCoord;
attribute float aTextureId;

varying float vTextureId;
varying vec2 vTextureCoord;

uniform mat3 projectionMatrix;

void main()
{
    gl_Position = vec4((projectionMatrix * vec3(aVertex.xy, 1)), 0, 1);
    vTextureId = aTextureId;
    vTextureCoord = aTextureCoord;
}
`,

// Fragment Shader
`
uniform uSamplers[%texturesPerBatch%];/* %texturesPerBatch% is a macro and will become a number */\
varying float vTextureId;
varying vec2 vTextureCoord;

void main(void){
    vec4 color;

    /* get color, which is the pixel in texture uSamplers[vTextureId] @ vTextureCoord */
    for (int k = 0; k < %texturesPerBatch%; ++k)
    {
        if (int(vTextureId) == k)
            color = texture2D(uSamplers[k], vTextureCoord);

    }

    gl_FragColor = color;
}
`,
{}).derive();

// Create batch renderer class
const ExampleRenderer = BatchRendererPluginFactory.from({
    attribSet,
    indexProperty: "indices",
    textureProperty: "texture",
    texIDAttrib: "aTextureId", // this will be used to locate the texture in the fragment shader later
    shaderFunction
});

// Remember to do this before instantiating a PIXI.Application or PIXI.Renderer!
PIXI.Renderer.registerPlugin("ExampleRenderer", ExampleRenderer);
```

### Uniforms Pipeline [Experimental]

You can take advantage of shader uniforms in batching too! pixi-batch-renderer supports this out of the box
with the `AggregateUniformsBatchFactory`. There are two modes for uniforms:

* **Aggregation mode**: Uniforms of each display-object are aggregated into an array. Then an uniform-ID attribute
is uploaded (say `aUniformId`) that tells the shader which uniform to pick out of an array. The attribute is passed
to the plugin factory via the `uniformIDAttrib` option.

* **No-aggregation mode**: Uniforms are uploaded in one-element arrays. Display-objects with different uniform values
are not batched together. This is useful if your uniform values don't differ a lot and will avoid another attribute. To
use this mode, simply don't pass an `uniformIDAttrib`.

1. Aggregation Mode (Example)

```js
const { UniformRedirect, AggregateUniformsBatchFactory } = require('pixi-batch-renderer');

const shaderFunction = new BatchShaderFactory(
// Vertex Shader
`
attribute vec2 aVertex;
attribute vec2 aTextureCoord;
attribute float aTextureId;
attribute float aUniformId;

varying float vTextureId;
varying vec2 vTextureCoord;
varying float vUniformId;

uniform mat3 projectionMatrix;

void main()
{
    gl_Position = vec4((projectionMatrix * vec3(aVertex.xy, 1)), 0, 1);
    vTextureId = aTextureId;
    vTextureCoord = aTextureCoord;

    vUniformId = aUniformId;
}
`,

// Fragment Shader
`
// You can also use this in the vertex shader.
uniform shaderType[%uniformsPerBatch%];
varying float vUniformId;

uniform uSamplers[%texturesPerBatch%];/* %texturesPerBatch% is a macro and will become a number */\
varying float vTextureId;
varying vec2 vTextureCoord;

void main(void){
    vec4 color;
    float type;

    /* get color & shaderType */
    for (int k = 0; k < int(max(%texturesPerBatch%., %uniformsPerBatch%.)); ++k)
    {
        if (int(vTextureId) == k) {
            color = texture2D(uSamplers[k], vTextureCoord);
        }
        if (int(vUniformId) == k) {
            type = shaderType[vUniformId];
        }
    }


    if (type == 1)
    {
        gl_FragColor = color;
    }
    else
    {
        gl_FragColor = vec4(color.rgb * vTextureCoord.x, vTextureCoord.x);
    }
}
`,
{}).derive();

const uniformSet = [
  new UniformRedirect({ source: "type", uniform: "shadingType" });
];

const ExampleRenderer = BatchRendererPluginFactory.from({
  uniformSet,
  uniformIDAttrib: "aUniformId",

  // Previous example's stuff
  attribSet,
  indexProperty: "indices",
  textureProperty: "texture",
  texIDAttrib: "aTextureId",
  shaderFunction,

  BatchFactoryClass: AggregateUniformsBatchFactory
})
```

2. No Aggregation Mode (Example)


```js
const { UniformRedirect, AggregateUniformsBatchFactory } = require('pixi-batch-renderer');

const shaderFunction = new BatchShaderFactory(
// Vertex Shader (no changes to standard pipeline example!)
`
attribute vec2 aVertex;
attribute vec2 aTextureCoord;
attribute float aTextureId;
varying float vTextureId;
varying vec2 vTextureCoord;

uniform mat3 projectionMatrix;

void main()
{
    gl_Position = vec4((projectionMatrix * vec3(aVertex.xy, 1)), 0, 1);
    vTextureId = aTextureId;
    vTextureCoord = aTextureCoord;
}
`,

// Fragment Shader
`
// Look only one-element instead of %uniformsPerBatch%
uniform shaderType[1];
varying float vUniformId;

uniform uSamplers[%texturesPerBatch%];/* %texturesPerBatch% is a macro and will become a number */\
varying float vTextureId;
varying vec2 vTextureCoord;

void main(void){
    vec4 color;
    float type = shaderType;

    /* get color & shaderType */
    for (int k = 0; k < %texturesPerBatch%; ++k)
    {
        if (int(vTextureId) == k) {
            color = texture2D(uSamplers[k], vTextureCoord);
        }
    }

    if (type == 1)
    {
        gl_FragColor = color;
    }
    else
    {
        gl_FragColor = vec4(color.rgb * vTextureCoord.x, vTextureCoord.x);
    }
}
`,
{}).derive();

const uniformSet = [
  new UniformRedirect({ source: "type", uniform: "shaderType" });
];

const ExampleRenderer = BatchRendererPluginFactory.from({
  uniformSet,

  attribSet,
  indexProperty: "indices",
  textureProperty: "texture",
  texIDAttrib: "aTextureId",
  shaderFunction,

  BatchFactoryClass: AggregateUniformsBatchFactory
});

PIXI.Renderer.registerPlugin("erend", ExampleRenderer);

// Try using with a Sprite!
const sprite = PIXI.Sprite.from(<url>);

sprite.pluginName = "erend";
sprite.type = 0;// will fade out horizontally in shader
```

### Advanced/Customized Batch Generation

The `BatchRendererPluginFactory.from` method also accepts these (optional) options that can be used to extend the
behaviour of built-in components:

* `BatchFactoryClass`: Child class of [StdBatchFactory]{@link https://pixijs.io/pixi-batch-renderer/PIXI.brend.StdBatchFactory.html}

* `BatchGeometryClass`: Child class of [BatchGeometry]{@link https://pixijs.io/pixi-batch-renderer/PIXI.brend.BatchGeometryFactory.html}

* `BatchDrawerClass`: Child class of [BatchDrawer]{@link https://pixijs.io/pixi-batch-renderer/PIXI.brend.BatchDrawer.html}

* `BatchRendererClass`: If overriding a component does not meet your requirements, you can derive your own batch renderer by
providing a child class of [BatchRenderer]{@link https://pixijs.io/pixi-batch-renderer/PIXI.brend.BatchRenderer.html}
