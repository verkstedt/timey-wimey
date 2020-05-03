const TAG_NAME = 'tw-duration';

const DEFAULT_PRECISION = 'm';

const UNITS = new Map(Object.entries({
    d: { title: 'days', seconds: 60 * 60 * 24 },
    h: { title: 'hours', seconds: 60 * 60 },
    m: { title: 'minutes', seconds: 60 },
    s: { title: 'seconds', seconds: 1 },
}));

function secondsToParts (sec)
{
    const parts = new Map();
    let secondsLeft = sec;
    Array.from(UNITS).forEach(([unit, { seconds }]) => {
        const value = Math.floor(secondsLeft / seconds);
        parts.set(unit, value);
        secondsLeft -= value * seconds;
    });
    return parts;
}

function partsToDateTime (parts)
{
    return [
        'PT',
        ...Array.from(UNITS.keys()).map(
            (unit) => `${parts.get(unit) || 0}${unit}`,
        ),
    ].join('').toUpperCase();
}

class TwDuration extends HTMLTimeElement
{
    updateId;

    precision;

    runningSince;

    constructor ()
    {
        super();

        const precisionAttr = this.getAttribute('precision');
        this.precision =
            precisionAttr
                ? precisionAttr.toLowerCase()
                : DEFAULT_PRECISION;

        const runningSinceAttr = this.getAttribute('running-since');
        this.runningSince =
            runningSinceAttr
                ? new Date(runningSinceAttr)
                : null;
    }

    connectedCallback ()
    {
        if (!this.isConnected)
        {
            return;
        }

        const content = this.buildContent();

        if (this.runningSince)
        {
            this.updateFromSince(this.runningSince, content);
            const updateTick = () => {
                this.updateFromSince(this.runningSince);
                this.updateId = setTimeout(
                    () => {
                        this.updateId =
                            requestAnimationFrame(updateTick);
                    },
                    500,
                );
            };
            this.updateId = requestAnimationFrame(updateTick);
        }
        else if (this.dateTime)
        {
            this.updateFromDateTime(this.dateTime, content);
        }

        this.textContent = '';
        this.appendChild(content);
    }

    disconnectedCallback ()
    {
        cancelIdleCallback(this.updateId);
        cancelAnimationFrame(this.updateId);
    }

    buildContent ()
    {
        const document = this.ownerDocument;
        const content = document.createDocumentFragment();

        let first = true;
        Array.from(UNITS).forEach(([unit, { title }]) => {
            const valueElement = document.createElement('span');
            valueElement.hidden = true;
            valueElement.dataset.unit = unit;
            valueElement.classList.add(
                'a-duration__value',
                `a-duration__value--${unit}`,
            );

            const unitElement = document.createElement('abbr');
            unitElement.hidden = true;
            unitElement.dataset.unit = unit;
            unitElement.classList.add(
                'a-duration__unit',
                `a-duration__unit--${unit}`,
            );
            unitElement.textContent = `\xa0${unit}`;
            unitElement.title = title;

            if (!first)
            {
                content.appendChild(document.createTextNode(' '));
            }
            content.appendChild(valueElement);
            content.appendChild(unitElement);

            first = false;
        });

        return content;
    }

    update (parts, context = this)
    {
        let first = true;
        let ignored = false;

        const setHidden = (element) => {
            // eslint-disable-next-line no-param-reassign
            element.hidden = first || ignored;
        };

        for (const [unit] of UNITS.keys())
        {
            const value = ignored ? 0 : parts.get(unit) || 0;

            const paddedValue = first ? value : String(value).padStart(2, '0');
            // eslint-disable-next-line no-param-reassign
            context.querySelector(`span[data-unit=${unit}]`).textContent = paddedValue;

            first = first && value === 0;
            context.querySelectorAll(`[data-unit=${unit}]`).forEach(setHidden);

            if (unit === this.precision)
            {
                ignored = true;
            }
        }
    }

    updateFromSince (sinceDate, context = this)
    {
        const secondsDiff = Math.floor((Date.now() - sinceDate) / 1000);
        const parts = secondsToParts(secondsDiff);
        this.dateTime = partsToDateTime(parts);
        this.update(parts, context);
    }

    updateFromDateTime (dateTime, context = this)
    {
        // FIXME Better dateTime attr parsing
        const dateTimeMatch = dateTime.match(/[0-9]+|[a-z]+/ig);
        dateTimeMatch.shift(); // PT
        const parts = new Map();
        while (dateTimeMatch.length)
        {
            const value = Number(dateTimeMatch.shift());
            const unit = dateTimeMatch.shift().toLowerCase();
            parts.set(unit, value);
        }

        this.update(parts, context);
    }
}

export { TAG_NAME };
export default TwDuration;
