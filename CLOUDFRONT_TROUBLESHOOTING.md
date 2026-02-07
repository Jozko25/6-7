# CloudFront Image Access Troubleshooting

## Current Status
- ✅ S3 Bucket Policy: Correctly configured
- ✅ File uploaded to S3: vehicles/1770290254077-IMG_5824.jpeg
- ❌ CloudFront Access: Getting "Access Denied"

## Quick Checks

### 1. CloudFront Distribution Status
Go to: https://console.aws.amazon.com/cloudfront/v4/home#/distributions/E1IWHV3QXER75I

**Check the Status:**
- If it says **"Deploying"** → Wait until it shows **"Enabled"** (5-15 minutes)
- If it says **"Enabled"** → Proceed to check Origin settings

### 2. Verify Origin Access Control (OAC)

In the CloudFront distribution page:
1. Click the **Origins** tab
2. Click on your S3 origin (sixsevendigits.s3.eu-central-1.amazonaws.com)
3. Click **Edit**

**Verify these settings:**
- **Origin access**: Must be set to **"Origin access control settings (recommended)"**
- **Origin access control**: Should show a name like `sixsevendigits-oac` or similar
- If OAC is NOT configured, you need to create one:
  1. Click "Create new OAC"
  2. Name: `sixsevendigits-oac`
  3. Click "Create"
  4. Click "Save changes"

### 3. Alternative: Test Direct S3 Access

Try accessing the file directly via S3 (not CloudFront):
```
https://sixsevendigits.s3.eu-central-1.amazonaws.com/vehicles/1770290254077-IMG_5824.jpeg
```

**Expected Result:**
- ❌ Should show "Access Denied" (correct - bucket is private)
- This confirms the file exists in S3

### 4. Temporary Solution: Make Bucket Public (NOT RECOMMENDED for production)

If you need images working immediately while troubleshooting CloudFront:

**Option A: Add public read policy (temporary)**

Add this statement to your bucket policy:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipalReadOnly",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::sixsevendigits/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudfront::448049818381:distribution/E1IWHV3QXER75I"
                }
            }
        },
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

Then update `.env` to use direct S3 URLs temporarily:
```bash
# Comment out CloudFront
# CLOUDFRONT_URL="https://d3poz0b5r7i6cm.cloudfront.net"

# Use direct S3 (temporary)
# Images will be served directly from S3
```

And update `server/services/s3.service.ts` line 66 to always use S3:
```typescript
const region = process.env.AWS_REGION || "us-east-1";
fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
```

## Most Likely Issues

### Issue 1: CloudFront Still Deploying
**Solution:** Wait for deployment to complete (check status in CloudFront console)

### Issue 2: Origin Access Control Not Configured
**Solution:**
1. Go to CloudFront distribution → Origins tab
2. Edit origin → Set to "Origin access control settings"
3. Create OAC if needed
4. Save changes
5. Wait 5-10 minutes for propagation

### Issue 3: Cache Issue
**Solution:** Create invalidation in CloudFront
1. Go to CloudFront distribution
2. Click **Invalidations** tab
3. Click **Create invalidation**
4. Enter path: `/vehicles/*`
5. Click **Create invalidation**
6. Wait 1-2 minutes

## Next Steps

1. Check CloudFront distribution status (Deploying vs Enabled)
2. Verify OAC is configured in Origin settings
3. If still not working, try the temporary public bucket solution
4. Once working, we can switch back to CloudFront properly

## Contact Info
- Distribution ID: E1IWHV3QXER75I
- Distribution Domain: d3poz0b5r7i6cm.cloudfront.net
- Bucket: sixsevendigits
- Region: eu-central-1
