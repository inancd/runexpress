const pako = require('pako');
const { Buffer } = require('buffer');
const CryptoJS = require('crypto-js');

// Base64 decompression function
const base64Compress = (data, fun = 'compress', verbose = false) => {
    try {
        if (verbose) console.log("base64Compress-10:data", data.slice(0, 20));
        const decodedBase64Data = Buffer.from(data, 'base64').toString('utf-8');
        if (verbose) console.log("base64Compress-11-decodedBase64Data", decodedBase64Data.slice(0, 20));
        return { decodedBase64Data, decodedBase64DataLength: decodedBase64Data.length, success: true };
    } catch (error) {
        if (verbose) console.log(`base64Compress<${fun}> - error: ${error.message}`);
        return fun === 'compress' ? 
               { base64Data: null, base64Length: data.length, success: false } : 
               { decodedBase64Data: null, decodedBase64DataLength: data.length, success: false };
    }
};

const chunkedInflate = (data) => {
    const chunks = [];
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      chunks.push(pako.inflate(chunk, { to: 'string' }));
    }
    return chunks.join('');
  };

// String GZIP decompression function with verbose
const strGzip = (data, verbose = false) => {
    const CHUNK_SIZE = 65536; // Define a reasonable chunk size (64KB)
    try {
        const decompressedUint8 = Uint8Array.from(Buffer.from(data, 'base64').toString().split('').map((c) => c.charCodeAt(0)));
        if (verbose) { console.log("strGzip-21 ", decompressedUint8.slice(0, 10)); }
        // Handle large data with chunking
        const decompressedData = decompressedUint8.length > CHUNK_SIZE
                                 ? chunkedInflate(decompressedUint8)
                                 : pako.inflate(decompressedUint8, { to: 'string' });
        if (verbose) { console.log("strGzip-22 ", decompressedData.slice(0, 10)); }
        const decompressedDataLength = decompressedData.length;
        if (verbose) { console.log("strGzip-23 ", decompressedDataLength); }        

        return { decompressedData, decompressedDataLength: decompressedData.length, success: true };
    } catch (error) {
        if (verbose) console.log(`strGzip(decompress) - error: ${error.message}`);
        return { decompressedData: '', decompressedDataLength: data.length, success: false };
    }
};

const encrypt = (text, pass) => {
    try {
      return CryptoJS.AES.encrypt(text, pass).toString(); // Encrypt text with the password
    } catch (error) {
      console.error(`Encryption error: ${error.message}`);
      return '';
    }
}

// Decryption using AES
const decrypt = (ciphertext, pass, verbose) => {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, pass, verbose);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return originalText;
    } catch (error) {
        if (verbose) { console.error(`Decryption error: ${error.message}`); }
        return '';
    }
};

// Main decompression function
const decompressToArray = (compressedString, passw, expectedString, verbose = false) => {
    if (verbose) console.log(`decompressToArray(expectedString:${expectedString})-compressedString:\n${compressedString.slice(0, 20)}`);

    if (compressedString.includes(expectedString)) {
        if (verbose) console.log(`decompressToArray - String is already uncompressed JSON`);
        return JSON.parse(compressedString);
    }

    if (compressedString.length === 0) {
        if (verbose) console.log(`decompressToArray - String is empty`);
        return [];
    }

    const decryptedString = decrypt(compressedString, passw, verbose);
    if (decryptedString && decryptedString.includes(expectedString)) {
        if (verbose) console.log(`decompressToArray - Successfully decrypted data`);
        return JSON.parse(decryptedString);
    }

    if (verbose) console.log('decompressToArray - Decryption failed. Proceeding to decompression');
    const unzippedString = strGzip(compressedString, verbose).decompressedData;

    if (unzippedString && unzippedString.includes(expectedString)) {
        if (verbose) console.log(`decompressToArray - Successfully unzipped data`);
        return JSON.parse(unzippedString);
    }

    const decodedData = base64Compress(compressedString, 'decompress', verbose).decodedBase64Data;

    if (decodedData && decodedData.includes(expectedString)) {
        if (verbose) console.log(`decompressToArray - Successfully decoded base64 data`);
        return JSON.parse(decodedData);
    }

    if (verbose) console.log(`decompressToArray - No method succeeded. Returning an empty array.`);
    return [];
};

module.exports = { decompressToArray, decrypt, encrypt, base64Compress, strGzip };
