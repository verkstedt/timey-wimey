function createOptionsDocumentFragment (document, values)
{
    const options = document.createDocumentFragment();
    options.appendChild(document.createElement('option'));
    const valuesArray =
        Array.isArray(values)
            ? values
            : Array.from(Object.entries(values));
    valuesArray.forEach(
        (row) => {
            const [value, label] = Array.isArray(row) ? row : [row];
            const option = document.createElement('option');
            option.value = value;
            if (label !== null && label !== '')
            {
                option.textContent = label;
            }
            options.appendChild(option);
        },
    );
    return options;
}

function setSelectValues (values, selectElement)
{
    const document = selectElement.ownerDocument;

    const options = createOptionsDocumentFragment(document, values);
    // eslint-disable-next-line no-param-reassign
    selectElement.innerHTML = '';
    selectElement.appendChild(options);
}

export default setSelectValues;
