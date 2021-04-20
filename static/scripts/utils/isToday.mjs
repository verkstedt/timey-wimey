function isToday (date)
{
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

export default isToday;
