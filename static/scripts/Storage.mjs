class Storage
{
    name = null;

    constructor (name)
    {
        this.name = name;
    }

    get ()
    {
        const json = localStorage.getItem(this.name);
        if (json != null)
        {
            return JSON.parse(json);
        }
        return null;
    }

    set (value)
    {
        return localStorage.setItem(this.name, JSON.stringify(value));
    }
}

export default Storage;
