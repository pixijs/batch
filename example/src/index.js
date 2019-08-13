import * as PIXI_CORE from 'pixi.js';
import * as PIXI_BREND from '../../lib/index.js';
import vertexShaderSrc from './vertexShader.glsl';
import fragmentShaderSrc from './fragmentShader.glsl';

const PIXI = {
    ...PIXI_CORE,
    brend:
    {
        ...PIXI_BREND,
    },
};

class BatchableSprite extends PIXI.Sprite
{
    constructor(texture)
    {
        super(texture);
        this.pluginName = 'overrideRender';
    }
}

const redirects = [
    new PIXI.brend.AttributeRedirect(
        'vertexData',
        'aVertexPosition',
        'float32',
        2,
        PIXI.TYPES.FLOAT,
        2,),
    new PIXI.brend.AttributeRedirect(
        'uvs',
        'aTextureCoord',
        'float32',
        2,
        PIXI.TYPES.FLOAT,
        2,),
    new PIXI.brend.AttributeRedirect(
        (targetObject) =>
        {
            const alpha = Math.min(targetObject.worldAlpha, 1.0);

            return (alpha < 1.0
                && targetObject._texture.baseTexture.premultiplyAlpha)
                ? PIXI.utils.premultiplyTint(targetObject._tintRGB, alpha)
                : targetObject._tintRGB + (alpha * 255 << 24);
        },
        'aColor',
        'uint32',
        '%notarray%', // we don't return it wrapped in an array
        PIXI.TYPES.UNSIGNED_BYTE,
        4,
        true
    ),
];

const stateFunction = () =>
    PIXI.State.for2d();

const OverrideSpriteRenderer = new PIXI.brend.BatchRendererPluginFactory.from(
    redirects,
    'indices',
    undefined, // since PIXI.Graphics#vertexData will be defining attribute
    '_texture',
    1,
    'aTextureId',
    stateFunction,
    (new PIXI.brend.ShaderGenerator(
        vertexShaderSrc, fragmentShaderSrc,
        {
            tint: new Float32Array([1, 1, 1, 1]),
            translationMatrix: PIXI.Matrix.IDENTITY,
        }
    )).generateFunction(),
);

PIXI.Renderer.registerPlugin('overrideRender', OverrideSpriteRenderer);

window.onload = () =>
{
    const app = new PIXI.Application({ width: 20 + (1000 * 0.9), height: 20 + 1000 });
    const root = document.getElementById('root-app');

    root.appendChild(app.view);
    const texture = PIXI.Texture.from(document.getElementById('bunny-gif'));

    const sprites = [];

    for (let i = 0; i < 10; i++)
    {
        for (let j = 0; j < 10; j++)
        {
            const sprite = new BatchableSprite(texture);

            sprite.width = 80 * 0.9;
            sprite.height = 80;

            sprite.anchor.set(0.5, 0.5);
            sprite.x = 20 + ((sprite.width + 18) * i) + 80*0.45;// eslint-disable-line
            sprite.y = 20 + ((sprite.height + 20) * j) + 80/2;// eslint-disable-line

            sprites.push(sprite);
            app.stage.addChild(sprite);
        }
    }

    app.ticker.add((delta) =>
    {
        sprites.forEach((sprite) =>
        {
            sprite.angle += 180 * delta / 50;
        });
    });
};
