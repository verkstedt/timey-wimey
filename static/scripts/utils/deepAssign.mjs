function deepAssign (...args)
{
    const definedArgs = args.filter((a) => a !== undefined);

    const hasNonObjects = definedArgs.some(
        (a) => (
            a === null
            || Object.getPrototypeOf(a) !== Object.prototype
        ),
    );

    if (hasNonObjects)
    {
        return definedArgs[definedArgs.length - 1];
    }

    const keys = new Set(
        definedArgs
            .filter((a) => a !== null)
            .flatMap(Object.keys),
    );
    return Object.fromEntries(Array.from(keys).map(
        (key) => [
            key,
            deepAssign(
                ...definedArgs
                    .map((a) => a[key])
                    .filter((a) => a !== undefined),
            ),
        ],
    ));
}

export default deepAssign;
