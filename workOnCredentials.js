const fs = require('fs');
const path = require('path');
const readline = require('readline');
const CryptoJS = require('crypto-js');
const { encrypt, decrypt } = require('./public/scripts/dataProcessor');

// File paths for AWS credentials and Maps API key
const credentialsPath = path.join(__dirname, 'config', 's3Credentials.json');
const encryptedCredentialsPath = path.join(__dirname, 'config', 'encryptedCredentials.txt');
const mapsKeyPath = path.join(__dirname, 'config', 'mapsKey.txt');
const encryptedMapsKeyPath = path.join(__dirname, 'config', 'encryptedMapsKey.txt');

// Function to prompt for password
const promptPassword = () => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('Enter password: ', (password) => {
      rl.close();
      resolve(password);
    });
  });
};

// Function to handle encryption of credentials and maps key
const encryptData = async () => {
  try {
    // Load the JSON credentials and Maps key
    const credentialsData = fs.readFileSync(credentialsPath, 'utf-8');
    const mapsKeyData = fs.readFileSync(mapsKeyPath, 'utf-8');
    
    // Ask for password
    const password = await promptPassword();
    
    // Encrypt the credentials and Maps key
    const encryptedCredentials = encrypt(credentialsData, password);
    const encryptedMapsKey = encrypt(mapsKeyData, password);
    
    // Save encrypted data to files
    fs.writeFileSync(encryptedCredentialsPath, encryptedCredentials);
    fs.writeFileSync(encryptedMapsKeyPath, encryptedMapsKey);

    console.log(`Encrypted data saved to ${encryptedCredentialsPath} and ${encryptedMapsKeyPath}`);
  } catch (error) {
    console.error('Error encrypting data:', error.message);
  }
};

// Function to handle decryption of credentials and maps key
const decryptData = async () => {
  try {
    // Check if the encrypted files exist
    if (!fs.existsSync(encryptedCredentialsPath) || !fs.existsSync(encryptedMapsKeyPath)) {
      console.error('Encrypted credentials or Maps key file does not exist.');
      return;
    }

    // Load the encrypted strings
    const encryptedCredentials = fs.readFileSync(encryptedCredentialsPath, 'utf-8');
    const encryptedMapsKey = fs.readFileSync(encryptedMapsKeyPath, 'utf-8');
    
    // Ask for password
    const password = await promptPassword();
    
    // Decrypt the credentials and Maps key
    const decryptedCredentials = decrypt(encryptedCredentials, password, true);
    const decryptedMapsKey = decrypt(encryptedMapsKey, password, true);
    
    // Save the decrypted data back to the JSON and Maps key file
    fs.writeFileSync(credentialsPath, decryptedCredentials);
    fs.writeFileSync(mapsKeyPath, decryptedMapsKey);

    console.log(`Decrypted data saved back to ${credentialsPath} and ${mapsKeyPath}`);
  } catch (error) {
    console.error('Error decrypting data:', error.message);
  }
};

// Main function to determine whether to encrypt or decrypt
const main = async () => {
  const command = process.argv[2];

  if (command === 'encrypt') {
    await encryptData();
  } else if (command === 'decrypt') {
    await decryptData();
  } else {
    console.error('Unknown command. Use "encrypt" or "decrypt".');
  }
};

// Run the main function
main();
// e.g. node workOnCredentials.js encrypt
// e.g. node workOnCredentials.js decrypt
