import * as PIXI from 'pixi.js';

// JavaScript is stupid enough not to have a replaceAll
// in String. This is a temporary solution and we should
// depend on an actually polyfill.
function _replaceAll(target, search, replacement)
{
    return target.replace(new RegExp(search, 'g'), replacement);
}

function injectTexturesPerBatch(batchRenderer,)
{
    return `${batchRenderer.MAX_TEXTURES}`;
}

/**
 * Exposes an easy-to-use API for generating a shader function
 * for batch rendering.
 *
 * You are required to provide an injector map, which maps
 * macros to functions that return a string value for those
 * macros given a renderer.
 *
 * By default, only one injector is used - the textures per
 * batch `%texturesPerBatch%` macro. This is replaced by
 * the number of textures passed to the `uSamplers` textures
 * uniform.
 *
 * @memberof PIXI.brend
 */
class ShaderGenerator
{
    /**
     * WARNING: Do not pass `uSamplers` in your uniforms. They
     *  will be added to your shader instance directly.
     *
     * @param {string} vertexShaderTemplate
     * @param {string} fragmentShaderTemplate
     * @param {UniformGroup | Map<string, object>} uniforms
     * @param {Object.<String, InjectorFunction>} [templateInjectors={'%texturesPerBatch%': (bRenderer) => `${bRenderer.MAX_TEXTURES}`}]
     * @param {boolean} [disableVertexShaderTemplate=true] - turn off (true)
     *      if you aren't using macros in the vertex shader
     */
    constructor(
        vertexShaderTemplate,
        fragmentShaderTemplate,
        uniforms = {},
        templateInjectors = {
            '%texturesPerBatch%': injectTexturesPerBatch,
        },
        disableVertexShaderTemplate = true,
    )
    {
        if (!templateInjectors['%texturesPerBatch%'])
        {
            templateInjectors['%texturesPerBatch%'] = injectTexturesPerBatch;
        }

        /** @protected */
        this._vertexShaderTemplate = vertexShaderTemplate;
        /** @protected */
        this._fragmentShaderTemplate = fragmentShaderTemplate;
        /** @protected */
        this._uniforms = uniforms;
        /** @protected */
        this._templateInjectors = templateInjectors;

        /**
         * Disable vertex shader templates to speed up shader
         * generation.
         *
         * @member {Boolean}
         */
        this.disableVertexShaderTemplate = disableVertexShaderTemplate;

        /**
         * Maps the stringifed state of the batch renderer to the
         * generated shader.
         *
         * @private
         * @member {Object.<String, PIXI.Shader>}
         */
        this._cache = {};

        /**
         * Unstringifed current state of the batch renderer.
         *
         * @private
         * @member {Object.<String, String>}
         * @see {PIXI.brend.ShaderGenerator#_generateInjectorBasedState}
         */
        this._cState = null;
    }

    /**
     * @return shader function that can be given to the batch renderer
     */
    generateFunction()
    {
        return (batchRenderer) =>
        {
            const stringState = this._generateInjectorBasedState(batchRenderer);
            const cachedShader = this._cache[stringState];

            if (cachedShader)
            {
                return cachedShader;
            }

            return this._generateShader(stringState);
        };
    }

    /** @protected */
    _generateInjectorBasedState(batchRenderer)
    {
        let state = '';
        const cState = this._cState = {};

        for (const injectorMacro in this._templateInjectors)
        {
            const val = this._templateInjectors[injectorMacro](batchRenderer);

            state += val;
            cState[injectorMacro] = val;
        }

        return state;
    }

    /** @private */
    _generateShader(stringState)
    {
        let vertexShaderTemplate = this._vertexShaderTemplate.slice(0);

        let fragmentShaderTemplate = this._fragmentShaderTemplate.slice(0);

        for (const injectorTemplate in this._cState)
        {
            if (!this.disableVertexShaderTemplate)
            {
                vertexShaderTemplate = _replaceAll(vertexShaderTemplate,
                    injectorTemplate, this._cState[injectorTemplate]);
            }

            fragmentShaderTemplate = _replaceAll(fragmentShaderTemplate,
                injectorTemplate, this._cState[injectorTemplate]);
        }

        const shader = PIXI.Shader.from(vertexShaderTemplate,
            fragmentShaderTemplate, this._uniforms);

        this._cache[stringState] = shader;

        return shader;
    }
}

export { ShaderGenerator };
export default ShaderGenerator;

/**
 * @function
 * @name InjectorFunction
 * @memberof PIXI.brend
 *
 * @param {PIXI.brend.BatchRenderer} batchRenderer
 * @return {string} value of the macro for this renderer
 */
