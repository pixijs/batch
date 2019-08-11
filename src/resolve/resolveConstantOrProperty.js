export function resolveConstantOrProperty(targetObject, property)
{
    return (typeof property === 'string')
        ? targetObject[property]
        : property;
}

export default resolveConstantOrProperty;
