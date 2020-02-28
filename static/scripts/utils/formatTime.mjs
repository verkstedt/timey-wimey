const formatter = new Intl.DateTimeFormat(
    document.documentElement.lang,
    {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false,
    },
);

function formatTime (date)
{
    return formatter.format(date);
}

export default formatTime;
