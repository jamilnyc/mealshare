"""
Helper class for uploading files in the application.
"""

import json
import boto3
import base64
import io

class MealShareUploads:
    # S3 Bucket information
    BUCKET_NAME = 'dam-mealshare'
    PUBLIC_URL = 'http://s3-us-east-1.amazonaws.com/{}/{}/{}'
    DIRECTORY  = 'avatars'
    
    def __init__(self):
        # Create S3 Client
        self.s3_client = boto3.client('s3')

    def get_public_url(self, file_name):
        """
        Return the public URL for an uploaded file (assuming the us-east-1 region).
        """
        bucket_location = self.s3_client.get_bucket_location(Bucket=self.BUCKET_NAME)
        key_name = "{}/{}".format(self.DIRECTORY, file_name)
        object_url = "https://s3.amazonaws.com/{1}/{2}".format(
            bucket_location['LocationConstraint'],
            self.BUCKET_NAME,
            key_name)
        return object_url

    def upload_encoded(self, file_name, encoded_image):
        """
        Upload Base64 encoded image to S3.
        """
        
        # Decode from Base64 text to bytes
        decoded = base64.decodebytes(encoded_image)
        my_file = io.BytesIO(decoded)
        
        # Create a full file key on S3 with the given file name
        file_path = "{}/{}".format(self.DIRECTORY, file_name)
        
        # Upload the file, making it publicly readable
        self.s3_client.upload_fileobj(my_file, self.BUCKET_NAME, file_path, ExtraArgs={'ACL':'public-read'})
        url = self.get_public_url(file_name)
        
        # Return the URL where the file is located
        return(url)