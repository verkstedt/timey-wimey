import toCamelCase from '../utils/toCamelCase.mjs';

const TAG_NAME = 'tw-duration';

const PRECISION = Symbol('precision');
const RUNNING_SINCE = Symbol('running-since');
const DATE_TIME = Symbol('date-time');

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

function isAttributeEmpty (value)
{
    return value == null || value === '';
}

class TwDuration extends HTMLTimeElement
{
    static observedAttributes = ['date-time', 'precision', 'running-since'];

    updateId;

    [PRECISION] = DEFAULT_PRECISION;

    [RUNNING_SINCE] = '';

    [DATE_TIME] = '';

    constructor ()
    {
        super();

        const dateTimeAttr = this.getAttribute('date-time');
        if (!isAttributeEmpty(dateTimeAttr))
        {
            this[DATE_TIME] = dateTimeAttr;
        }

        const precisionAttr = this.getAttribute('precision');
        if (!isAttributeEmpty(precisionAttr))
        {
            this[PRECISION] = precisionAttr;
        }

        const runningSinceAttr = this.getAttribute('running-since');
        if (!isAttributeEmpty(runningSinceAttr))
        {
            this[RUNNING_SINCE] = runningSinceAttr;
        }
    }

    connectedCallback ()
    {
        if (!this.isConnected)
        {
            return;
        }

        const content = this.buildContent();

        if (this[RUNNING_SINCE] !== '')
        {
            this.updateFromRunningSince(content);
            this.startUpdating();
        }
        else if (this[DATE_TIME] !== '')
        {
            this.updateFromDateTime(content);
        }

        this.textContent = '';
        this.appendChild(content);
    }

    disconnectedCallback ()
    {
        this.stopUpdating();
    }

    attributeChangedCallback (attrName, oldValue, newValue)
    {
        const propName = toCamelCase(attrName);
        this[propName] = newValue;
    }

    set dateTime (dateTime)
    {
        if (dateTime == null || dateTime === '')
        {
            this[DATE_TIME] = '';
        }
        else
        {
            this[DATE_TIME] = dateTime;
        }

        if (this.isConnected)
        {
            this.stopUpdating();
            this.updateFromDateTime();
        }
    }

    get dateTime ()
    {
        return this[DATE_TIME];
    }

    set precision (precision)
    {
        if (precision == null || precision === '')
        {
            this[PRECISION] = DEFAULT_PRECISION;
            return;
        }

        this[PRECISION] = precision;
    }

    get precision ()
    {
        return this[PRECISION];
    }

    set runningSince (date)
    {
        if (date == null || date === '')
        {
            this[RUNNING_SINCE] = '';

            this.stopUpdating();
        }
        else
        {
            this[RUNNING_SINCE] = new Date(date);
            this.startUpdating();
        }

        if (this.isConnected)
        {
            this.updateFromRunningSince();
        }
    }

    get runningSince ()
    {
        return this[RUNNING_SINCE];
    }

    get runningSinceAsDate ()
    {
        const value = this[RUNNING_SINCE];

        if (value === '')
        {
            return null;
        }

        return new Date(value);
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

    clear (context = this)
    {
        const setHidden = (element) => {
            // eslint-disable-next-line no-param-reassign
            element.hidden = true;
        };

        for (const [unit] of UNITS.keys())
        {
            // eslint-disable-next-line no-param-reassign
            context.querySelector(`span[data-unit=${unit}]`).textContent = 0;
            context.querySelectorAll(`[data-unit=${unit}]`).forEach(setHidden);
        }
    }

    update (parts, context = this)
    {
        const precision = this[PRECISION];

        let ignoredFromStart = true;
        let ignoredFromEnd = false;

        const setHidden = (element) => {
            // eslint-disable-next-line no-param-reassign
            element.hidden = ignoredFromStart || ignoredFromEnd;
        };

        for (const [unit] of UNITS.keys())
        {
            const value = ignoredFromEnd ? 0 : parts.get(unit) || 0;

            const paddedValue =
                ignoredFromStart
                    ? value
                    : String(value).padStart(2, '0');
            // eslint-disable-next-line no-param-reassign
            context.querySelector(`span[data-unit=${unit}]`)
                .textContent = paddedValue;

            ignoredFromStart =
                (unit === precision)
                    ? false
                    : (ignoredFromStart && value === 0);
            context.querySelectorAll(`[data-unit=${unit}]`)
                .forEach(setHidden);

            if (unit === precision)
            {
                ignoredFromEnd = true;
            }
        }
    }

    updateFromRunningSince (context = this)
    {
        const sinceDate = this[RUNNING_SINCE];
        if (sinceDate === '')
        {
            this.clear(context);
            return;
        }

        const secondsDiff = Math.floor((Date.now() - sinceDate) / 1000);
        const parts = secondsToParts(secondsDiff);
        this[DATE_TIME] = partsToDateTime(parts);
        this.update(parts, context);
    }

    updateFromDateTime (context = this)
    {
        const dateTime = this[DATE_TIME];
        if (dateTime === '')
        {
            this.clear(context);
            return;
        }

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

    startUpdating ()
    {
        if (!this.isConnected)
        {
            return;
        }

        const updateTick = () => {
            this.updateFromRunningSince();
            // FIXME-prio-2 Memory leak here?
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

    stopUpdating ()
    {
        clearTimeout(this.updateId);
        cancelAnimationFrame(this.updateId);
    }
}

export { TAG_NAME };
export default TwDuration;
