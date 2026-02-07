# S3 Bucket CORS Configuration

Your S3 bucket needs CORS enabled to allow uploads from the browser.

## Steps to Configure:

1. **Go to AWS S3 Console**: https://s3.console.aws.amazon.com/s3/
2. **Select your bucket**: `sixsevendigits`
3. **Go to Permissions tab**
4. **Scroll down to "Cross-origin resource sharing (CORS)"**
5. **Click Edit**
6. **Paste this JSON configuration**:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE",
            "HEAD"
        ],
        "AllowedOrigins": [
            "http://localhost:3000",
            "http://localhost:3001",
            "https://yourdomain.com"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

7. **Click Save changes**

## Make Bucket Public (if you want images publicly accessible):

1. **Go to Permissions tab**
2. **Block public access** - Click Edit
3. **Uncheck "Block all public access"** (if you want public images)
4. **Confirm the change**

5. **Bucket Policy** - Add this policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::sixsevendigits/*"
        }
    ]
}
```

## IAM User Permissions:

Make sure your IAM user (AKIAWQUOZVMG37V5RJZU) has these permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::sixsevendigits",
                "arn:aws:s3:::sixsevendigits/*"
            ]
        }
    ]
}
```

After configuring these, try uploading again!
