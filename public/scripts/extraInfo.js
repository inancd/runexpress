document.addEventListener("DOMContentLoaded", function () {
    // Wait for the DOM to be fully loaded before running the script

    // Get the extraInfo div
    const extraInfo = document.getElementById("extraInfo");

    // Extract the full path and query parameters from the URL
    const fullPath = window.location.pathname.split('/');
    const queryParams = window.location.search.slice(1).split('?');

    // Log the full path and query parameters (for debugging)
    console.log(`Full path: ${fullPath}`);
    console.log(`Query parameters: ${queryParams}`);

    // Clear any previous content in the extraInfo div
    extraInfo.innerHTML = '';
    let paragraph = document.createElement('p');
    paragraph.textContent = `You are viewing ${fullPath[1]}`;
    extraInfo.appendChild(paragraph);
    // Check if queryParams are empty or if there are no proper query parameters
    if (!queryParams || queryParams.length === 0 || queryParams[0] === '') {
        let paragraph = document.createElement('p');
        paragraph.textContent = 'No query parameters found';
        extraInfo.appendChild(paragraph);
        return;
    }
    // Loop through the response object and append information to extraInfo div
    for (const [index, value] of Object.entries(queryParams)) {
        let output = '';
    
        // Split each query parameter into key and value
        const [key, val] = value.split(':'); 
    
        // Construct the output string with bold key and italic value
        output = `<b>${key}</b> = <i>${val}</i>`;
    
        // Create a new paragraph element for each entry and append it to the div
        const paragraph = document.createElement('p');
        paragraph.innerHTML = output;  // Use innerHTML to render HTML tags
        extraInfo.appendChild(paragraph);
    }
});
