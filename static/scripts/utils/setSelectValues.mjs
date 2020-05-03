function createOptionsDocumentFragment (document, values)
{
    const options = document.createDocumentFragment();
    options.appendChild(document.createElement('option'));
    Array.from(Object.entries(values)).forEach(
        ([value, label]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
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
