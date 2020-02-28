function formatTime (date)
{
    if (date.toISOString().split('T')[0] === (new Date()).toISOString().split('T')[0])
    {
        return date.toLocaleTimeString();
    }
    return date.toLocaleString();
}

export default formatTime;
