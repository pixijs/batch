import { AggregateUniformsBatchFactory } from './AggregateUniformsBatchFactory';
import { Shader } from '@pixi/core';

import type { BatchRenderer } from './BatchRenderer';

// This file might need a cleanup :)

// JavaScript is stupid enough not to have a replaceAll in String. This is a temporary
// solution and we should depend on an actually polyfill.
function _replaceAll(target: string, search: string, replacement: string): string
{
    return target.replace(new RegExp(search, 'g'), replacement);
}

function injectTexturesPerBatch(batchRenderer: BatchRenderer): string
{
    return `${batchRenderer.MAX_TEXTURES}`;
}

const INJECTORS = {
    uniformsPerBatch(renderer: BatchRenderer): string
    {
        return `${(renderer._batchFactory as AggregateUniformsBatchFactory).MAX_UNIFORMS}`;
    },
};

/**
 * Exposes an easy-to-use API for generating shader-functions to use in
 * the batch renderer!
 *
 * You are required to provide an injector map, which maps macros to functions
 * that return a string value for those macros given a renderer. By default, only one
 * injector is used - the textures per batch `%texturesPerBatch%` macro. This is replaced by
 * the number of textures passed to the `uSamplers` textures uniform.
 *
 * **Built-in Injectors**:
 *
 * * `%texturesPerBatch%`: replaced by the max. textures allowed by WebGL context
 *
 * * `%uniformsPerBatch%`: replaced by the (aggregate-uniforms) batch factory's `MAX_UNIFORMS` property.
 */
export class BatchShaderFactory
{
    protected _vertexShaderTemplate: string;
    protected _fragmentShaderTemplate: string;
    protected _uniforms: any;
    protected _templateInjectors: any;

    protected disableVertexShaderTemplate: boolean;

    protected _cache: any;
    protected _cState: any;

    /**
     * WARNING: Do not pass `uSamplers` in your uniforms. They
     *  will be added to your shader instance directly.
     *
     * @param {string} vertexShaderTemplate
     * @param {string} fragmentShaderTemplate
     * @param {UniformGroup | Map<string, object>} uniforms
     * @param {Object.<String, InjectorFunction>} [templateInjectors]
     * @param {boolean} [disableVertexShaderTemplate=true] - turn off (true)
     *      if you aren't using macros in the vertex shader
     */
    constructor(
        vertexShaderTemplate: string,
        fragmentShaderTemplate: string,
        uniforms = {},
        templateInjectors: any = {},
        disableVertexShaderTemplate = true,
    )
    {
        if (!templateInjectors['%texturesPerBatch%'])
        {
            templateInjectors['%texturesPerBatch%'] = injectTexturesPerBatch;
        }
        if (!templateInjectors['%uniformsPerBatch%'])
        {
            templateInjectors['%uniformsPerBatch%'] = INJECTORS.uniformsPerBatch;
        }

        this._vertexShaderTemplate = vertexShaderTemplate;
        this._fragmentShaderTemplate = fragmentShaderTemplate;
        this._uniforms = uniforms;
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
         * @see {ShaderGenerator#_generateInjectorBasedState}
         */
        this._cState = null;
    }

    /**
     * This essentially returns a function for generating the shader for a batch
     * renderer.
     *
     * @return shader function that can be given to the batch renderer
     */
    derive(): (brend: BatchRenderer) => Shader
    {
        return (batchRenderer: BatchRenderer): Shader =>
        {
            const stringState = this._generateInjectorBasedState(batchRenderer);
            const cachedShader = this._cache[stringState];

            if (cachedShader)
            {
                return cachedShader;
            }

            return this._generateShader(stringState, batchRenderer);
        };
    }

    protected _generateInjectorBasedState(batchRenderer: BatchRenderer): string
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

    protected _generateShader(stringState: string, renderer: BatchRenderer): Shader
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

        const shader = Shader.from(vertexShaderTemplate,
            fragmentShaderTemplate, this._uniforms);

        const textures = new Array(renderer.MAX_TEXTURES);

        for (let i = 0; i < textures.length; i++)
        {
            textures[i] = i;
        }
        shader.uniforms.uSamplers = textures;

        this._cache[stringState] = shader;

        return shader;
    }
}

export default BatchShaderFactory;
