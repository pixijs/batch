import * as PIXI_CORE from 'pixi.js';
import * as PIXI_BREND from '../../lib/index.js';

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
        'aTexturePosition',
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
        PIXI.TYPES.BYTE,
        4
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
);

PIXI.Renderer.registerPlugin('overrideRender', OverrideSpriteRenderer);

window.onload = () =>
{
    const app = new PIXI.Application({ width: 400 * 0.9, height: 400 });
    const root = document.getElementById('root-app');

    root.appendChild(app.view);

    const packer = app.renderer.plugins.overrideRender._packer.packerFunction;

    console.log(packer);

    if (true) return;// eslint-disable-line

    const texture = PIXI.Texture.from('assets/bunny.jp2');

    for (let i = 0; i < 5; i++)
    {
        for (let j = 0; j < 5; j++)
        {
            const sprite = new BatchableSprite(texture);

            sprite.width = 75 * 0.9;
            sprite.height = 75;

            sprite.x = (sprite.width + 4.5) * i;
            sprite.y = (sprite.height + 5) * j;

            app.stage.addChild(sprite);
        }
    }
};
