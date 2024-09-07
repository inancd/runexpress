const fs = require('fs');
const path = require('path');
const S3Manager = require('./S3Manager'); // Assuming your S3Manager is in the same directory
const { decompressToArray } = require('./dataProcessor');
const DEBUG_CONSOLE_OUT = false;

async function download_from_s3(s3FolderPath, s3FileName_begin, s3FileName_end, enforceUpdate=false) {
    const s3Manager = new S3Manager();
    // const s3FolderPath = `@${username}/run2track/`;
    const s3FileName = `${s3FileName_begin}${s3FileName_end}`
    const rootFold = path.dirname(path.dirname(__dirname));
    const localFilePath = path.join(rootFold, 'data', `${s3FileName}`);
    const fileMissing = (!fs.existsSync(localFilePath) || fs.statSync(localFilePath).size === 0);

    if (DEBUG_CONSOLE_OUT) { console.log(`download_from_s3--> from path=<${s3FolderPath}> the file <${s3FileName}> into local <${localFilePath}>`); }
    if (enforceUpdate || fileMissing) {
        if (DEBUG_CONSOLE_OUT) {
            if (enforceUpdate)
                console.log('Downloading from S3 even if file exists and is not empty. Downloading from S3...');
            else if (fileMissing)
                console.log('Downloading from S3... File does not exist or is empty.');
        }
        await s3Manager.download(localFilePath, s3FolderPath, s3FileName);
    }
    const rawData = fs.readFileSync(localFilePath, 'utf-8');
    const data = JSON.parse(rawData);
    if (DEBUG_CONSOLE_OUT) {
        // console log the keys and length of values if it is string else write the type 
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'string') {
                console.log(`str item <${key}>: len<${value.length}>`);
            } else if (Array.isArray(value)) {
                console.log(`array item <${key}>: length<${value.length}>`);
            } else if (typeof value === 'object') {
                console.log(`object item <${key}>: keys<${Object.keys(value).length}>`);
            } else {
                console.log(`other item type <${key}>: type<${typeof value}>`);
            }
        }
    }

    return data;
}

async function handleUserData(username, enforceUpdate=false) {
    const s3FolderPath = `@${username}/run2track/`;
    const s3FileName_begin = `track_${username}_`
    const detailed_downloaded = await download_from_s3(s3FolderPath, s3FileName_begin, 'details.json', enforceUpdate);
    const basic_downloaded = await download_from_s3(s3FolderPath, s3FileName_begin, 'basics.json', enforceUpdate);

    // Construct new data with decompressed values
    const new_generated_data = { ...basic_downloaded }; // Start with basic data

    // Path to save the JSON file
    const rootFold = path.dirname(path.dirname(__dirname));
    const localFilePath = path.join(rootFold, 'data', `${username}.json`);
    console.log(`handleUserData--> from path=<${username}> into local <${localFilePath}>`);
    if (!fs.existsSync(localFilePath) || enforceUpdate) {
        console.log('handleUserData-->File does not exist or enforceUpdate is true. Generating new JSON file.');

        // Decompress gpsArr, stepsArr, runParams_base64, and runVisuals_base64
        new_generated_data.gpsArr = decompressToArray(detailed_downloaded?.gpsArr, username, 'coords');
        new_generated_data.stepsArr = decompressToArray(detailed_downloaded?.stepsArr, username, 'distance');
        new_generated_data.runParams = decompressToArray(detailed_downloaded?.runParams_base64, username, 'distance');
        new_generated_data.runVisuals = decompressToArray(detailed_downloaded?.runVisuals_base64, username, 'distance');

        // Add the deviceInfo as it is
        new_generated_data.deviceInfo = detailed_downloaded?.deviceInfo;

        // Save the new JSON to the file
        fs.writeFileSync(localFilePath, JSON.stringify(new_generated_data, null, 2));
        console.log(`handleUserData-->Data successfully saved to ${localFilePath}`);
        return new_generated_data;

    }
    // if I am here it means the loalfile exists and I can load that json
    console.log('handleUserData-->File exists and enforceUpdate is false. No need to regenerate JSON.');   
    const rawData = fs.readFileSync(localFilePath, 'utf-8');
    const data = JSON.parse(rawData);
    return data;    
}

module.exports = { handleUserData };