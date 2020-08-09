import * as PIXI from 'pixi.js';

export function resolveFunctionOrProperty(targetObject: PIXI.DisplayObject, property: Function | string): any
{
    return (typeof property === 'string')
    // @ts-ignore
        ? targetObject[property]
        : property(targetObject);
}

export default resolveFunctionOrProperty;