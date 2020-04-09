import * as PIXI from 'pixi.js';
import { Redirect } from './Redirect';

interface IAttributeRedirectOptions
{
    source: string | ((db: PIXI.DisplayObject) => any);
    attrib: string;
    type: string;
    size?: number | '%notarray%';
    glType: number;
    glSize: number;
    normalize?: boolean;
}

/**
 * This redirect defines an attribute of a display-object's geometry. The attribute
 * data is expected to be stored in a `PIXI.ViewableBuffer`, in an array, or (if
 * just one element) as the property itself.
 *
 * @memberof PIXI.brend
 * @class
 * @extends PIXI.brend.Redirect
 * @example
 * // This attribute redirect calculates the tint used on top of a texture. Since the
 * // tintMode can change anytime, it is better to use a derived source (function).
 * //
 * // Furthermore, the color is uploaded as four bytes (`attribute vec4 aTint`) while the
 * // source returns an integer. This is done by splitting the 32-bit integer into four
 * // 8-bit bytes.
 * new PIXI.brend.AttributeRedirect({
 *     source: (tgt: ExampleDisplay) => (tgt.alpha < 1.0 && tgt.tintMode === PREMULTIPLY)
 *          ? premultiplyTint(tgt.rgb, tgt.alpha)
 *          : tgt.rgb + (tgt.alpha << 24);
 *     attrib: 'aTint',
 *     type: 'int32',
 *     size: '%notarray%', // optional/default
 *     glType: PIXI.TYPES.UNSIGNED_BYTE,
 *     glSize: 4,
 *     normalize: true // We are using [0, 255] range for RGBA here. Must normalize to [0, 1].
 * });
 */
export class AttributeRedirect extends Redirect
{
    public type: string;
    public size: number | '%notarray%';
    public glType: PIXI.TYPES;
    public glSize: number;
    public normalize: boolean;

    public properSize: number;

    /**
     * @param {object} options
     * @param {string | Function} options.source - redirect source
     * @param {string} options.attrib - shader attribute variable
     * @param {string}[options.type='float32'] - the type of data stored in the source
     * @param {number | '%notarray%'}[options.size=0] - size of the source array ('%notarray' if not an array & just one element)
     * @param {PIXI.TYPES}[options.glType=PIXI.TYPES.FLOAT] - data format to be uploaded in
     * @param {number} options.glSize - number of elements to be uploaded as (size of source and upload must match)
     * @param {boolean}[options.normalize=false] - whether to normalize the data before uploading
     */
    constructor(options: IAttributeRedirectOptions)
    {
        super(options.source, options.attrib);

        /**
         * The type of data stored in the source buffer. This can be any of: `int8`, `uint8`,
         * `int16`, `uint16`, `int32`, `uint32`, or (by default) `float32`.
         *
         * @member {string}
         * @see [PIXI.ViewableBuffer#view]{@link https://pixijs.download/dev/docs/PIXI.ViewableBuffer.html}
         * @default 'float32'
         */
        this.type = options.type;

        /**
         * Number of elements to extract out of `source` with
         * the given view type, for one vertex.
         *
         * If source isn't an array (only one element), then
         * you can set this to `'%notarray%'`.
         *
         * @member {number | '%notarray%'}
         */
        this.size = options.size;

        /**
         * This is equal to `size` or 1 if size is `%notarray%`.
         *
         * @member {number}
         */
        this.properSize = (options.size === '%notarray%' || options.size === undefined) ? 1 : options.size;

        /**
         * Type of attribute, when uploading.
         *
         * Normally, you would use the corresponding type for
         * the view on source. However, to speed up uploads
         * you can aggregate attribute values in larger data
         * types. For example, an RGBA vec4 (byte-sized channels)
         * can be represented as one `Uint32`, while having
         * a `glType` of `UNSIGNED_BYTE`.
         *
         * @member {PIXI.TYPES}
         */
        this.glType = options.glType;

        /**
         * Size of attribute in terms of `glType`.
         *
         * Note that `glSize * glType <= size * type`
         *
         * @readonly
         */
        this.glSize = options.glSize;

        /**
         * Whether to normalize the attribute values.
         *
         * @member {boolean}
         * @readonly
         */
        this.normalize = !!options.normalize;
    }

    static vertexSizeFor(attributeRedirects: Array<AttributeRedirect>): number
    {
        return attributeRedirects.reduce(
            (acc, redirect) =>
                (PIXI.ViewableBuffer.sizeOf(redirect.type)
                    * redirect.properSize)
                + acc,
            0);
    }
}
