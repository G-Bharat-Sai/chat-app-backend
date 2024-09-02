const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config(); // Ensure environment variables are loaded

// Configure AWS
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

const uploadFile = async (file, folder = '') => {
    if (!process.env.AWS_S3_BUCKET_NAME) {
        throw new Error('AWS_S3_BUCKET_NAME is not set in environment variables');
    }

    // Generate a unique file name and path
    const fileName = `${folder}/${uuidv4()}`;

    // Prepare the upload parameters
    const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: fileName,
        Body: file.buffer, // Ensure the Body is set to the file's buffer
        ContentType: file.mimetype, // Ensure ContentType is set correctly based on the file's MIME type
    };

    console.log('S3 upload params:', params);

    try {
        // Upload the file to S3 and return the data
        const data = await s3.upload(params).promise();
        return data;
    } catch (err) {
        console.error('Error uploading file:', err);
        throw err;
    }
};

module.exports = { uploadFile };
