const fs = require('fs');
const path = require('path');
const { uploadFile } = require('./s3Upload'); // Adjust the path as needed

const testFileUpload = async () => {
    try {
        // Path to the test file
        const filePath = 'C:\\Users\\gowth\\OneDrive\\Pictures\\Saved Pictures\\1215681.jpg';
        const file = {
            data: fs.readFileSync(filePath),
            name: path.basename(filePath),
            mimetype: 'image/jpeg', // Set the correct MIME type for the file
        };
        const folder = 'testUploads'; // S3 folder for testing

        const uploadResult = await uploadFile(file, folder);
        console.log('Upload result:', uploadResult);
    } catch (error) {
        console.error('Test upload failed:', error);
    }
};

testFileUpload();
