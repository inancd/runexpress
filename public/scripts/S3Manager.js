const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Buffer } = require('buffer');
const fs = require('fs');
const path = require('path');

class S3Manager {
    constructor() {
        // Read the JSON file from the config folder
        // console.log(`S3Manager constructor::__dirname = <${__dirname}> and its parent = <${path.dirname(__dirname)}>`);
        const rootFold = path.dirname(path.dirname(__dirname));
        const credentialsPath = path.join(rootFold, 'config/s3Credentials.json');
        console.log(`S3Manager constructor::credentialsPath = <${credentialsPath}>`);
        const rawData = fs.readFileSync(credentialsPath);
        const config = JSON.parse(rawData);
        this.s3Client = new S3Client({
            region: config.region,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            }
        });
        this.config = config;
    }
   
    async download(localFilePath, s3FolderPath, s3FileName) {
        const s3Key = `${s3FolderPath.endsWith('/') ? s3FolderPath : `${s3FolderPath}/`}${s3FileName}`;
        const params = {
            Bucket: this.config.bucketName,
            Key: s3Key,
        };
        console.log(`Downloading ${s3Key} to ${localFilePath}`);
        try {
            const command = new GetObjectCommand(params);
            const response = await this.s3Client.send(command);
            const stream = response.Body;
            const chunks = [];
    
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
    
            const buffer = Buffer.concat(chunks);
            fs.writeFileSync(localFilePath, buffer);
            console.log(`File downloaded to ${localFilePath}`);
        } catch (err) {
            console.error('Error downloading file:', err);
            throw err;
        }
    }
}

module.exports = S3Manager;
