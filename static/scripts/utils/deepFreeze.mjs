import isPlainObject from './isPlainObject.mjs';

function deepFreeze (obj)
{
    if (!isPlainObject(obj))
    {
        return obj;
    }

    return Object.freeze(Object.fromEntries(
        Object.entries(obj)
            .map(([key, value]) => [key, deepFreeze(value)]),
    ));
}

export default deepFreeze;
