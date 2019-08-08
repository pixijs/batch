/**
 * A redirect is used to transfer data from the display
 * object to the shader program.
 */
export class Redirect
{
    constructor(source, glslIdentifier)
    {
        /**
         * Source property on the `BatchableObject` that
         * holds the data being transferred. This can also
         * be a callback that returns the data.
         *
         * @member {string | Function}
         */
        this.source = source;

        /**
         * GLSL variable that will hold the data.
         *
         * @member {string}
         */
        this.glslIdentifier = glslIdentifier;
    }
}

export default Redirect;
