export function resolveFunctionOrProperty(targetObject, property)
{
    return (typeof property === 'string')
        ? targetObject[property]
        : property(targetObject);
}

export default resolveFunctionOrProperty;
