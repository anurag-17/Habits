const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: process.env.awsAccessKey,
  secretAccessKey: process.env.awsSecretkey,
  region: process.env.awsRegion,
});

const s3 = new AWS.S3();

function uploadOnS3(file, filename) {
    
    var date = new Date();
    var parentFolder = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();

    const params = {
        Bucket: process.env.bucket,
        Key: parentFolder + '/' + filename,
        Body: file,
    };
    
    return new Promise(function (resolve, reject) {
        s3.upload(params, function (err, data) {
            if (err) {
                console.log('Error =>' + err);
                reject(null);
            }
            if (data != null) {
                console.log('Image', 'uploadOnS3' + data.Location);
                resolve(data.Location);
            }
        });
    });
}

module.exports = uploadOnS3;


