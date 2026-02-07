# CloudFront CDN Setup for S3 Images

CloudFront is AWS's Content Delivery Network (CDN) - it's faster, more secure, and cheaper than serving directly from S3.

## Benefits:
- ✅ **Faster**: Images cached globally at 450+ edge locations
- ✅ **Cheaper**: Reduces S3 bandwidth costs
- ✅ **Secure**: Keep S3 bucket private, serve via CloudFront
- ✅ **HTTPS**: Free SSL certificate included
- ✅ **Professional**: Custom domain support

---

## Quick Setup Steps:

### 1. Create CloudFront Distribution

1. **Go to CloudFront Console**: https://console.aws.amazon.com/cloudfront/
2. **Click "Create Distribution"**

### 2. Configure Origin (S3 Bucket)

**Origin Settings:**
- **Origin Domain**: Select your bucket `sixsevendigits.s3.eu-central-1.amazonaws.com`
- **Origin Access**: Choose **"Origin access control settings (recommended)"**
- **Create new OAC**:
  - Click "Create control setting"
  - Name: `sixsevendigits-oac`
  - Click "Create"
- **Enable Origin Shield**: No (not needed for small scale)

### 3. Default Cache Behavior Settings

- **Viewer Protocol Policy**: Redirect HTTP to HTTPS
- **Allowed HTTP Methods**: GET, HEAD, OPTIONS
- **Cache Policy**: CachingOptimized (recommended)
- **Origin Request Policy**: CORS-S3Origin (important for images!)

### 4. Settings

- **Price Class**: Use all edge locations (best performance)
- **Alternate Domain Names (CNAME)**: Leave blank for now (add custom domain later)
- **SSL Certificate**: Default CloudFront certificate

### 5. Click "Create Distribution"

**Wait 5-15 minutes** for deployment (Status: "Deploying" → "Enabled")

---

## Step 6: Update S3 Bucket Policy

After CloudFront is created, you'll see a **blue banner** at the top saying:
> "The S3 bucket policy needs to be updated"

**Click "Copy Policy"** and then:

1. Go to your S3 bucket `sixsevendigits`
2. **Permissions** tab → **Bucket Policy** → **Edit**
3. **Paste** the copied policy (should look like this):

```json
{
    "Version": "2012-10-17",
    "Statement": {
        "Sid": "AllowCloudFrontServicePrincipalReadOnly",
        "Effect": "Allow",
        "Principal": {
            "Service": "cloudfront.amazonaws.com"
        },
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::sixsevendigits/*",
        "Condition": {
            "StringEquals": {
                "AWS:SourceArn": "arn:aws:cloudfront::448049818381:distribution/YOUR-DISTRIBUTION-ID"
            }
        }
    }
}
```

4. **Save changes**

---

## Step 7: Get Your CloudFront URL

Once deployed, your CloudFront distribution will have a domain like:
```
https://d1234abcd5678.cloudfront.net
```

**Find it here:**
- CloudFront Console → Distributions → Your distribution → **Distribution domain name**

---

## Step 8: Update Your App Configuration

Add to your `.env` file:

```bash
# CloudFront CDN
CLOUDFRONT_DOMAIN="d1234abcd5678.cloudfront.net"
CLOUDFRONT_URL="https://d1234abcd5678.cloudfront.net"
```

Replace `d1234abcd5678.cloudfront.net` with your actual CloudFront domain.

---

## I'll Update the Code Automatically

I'll modify the S3 service to use CloudFront URLs instead of direct S3 URLs.

Just provide me with your CloudFront distribution domain once it's created!

---

## Optional: Custom Domain (Later)

Want to use `images.yourdomain.com` instead of the CloudFront URL?

1. **Add CNAME record** in your DNS:
   ```
   images.yourdomain.com → d1234abcd5678.cloudfront.net
   ```

2. **Request SSL Certificate** (free):
   - Go to AWS Certificate Manager (us-east-1 region)
   - Request certificate for `images.yourdomain.com`
   - Validate via DNS

3. **Update CloudFront**:
   - Edit distribution
   - Add alternate domain name: `images.yourdomain.com`
   - Select your SSL certificate
   - Save

---

## Cost Estimate

**CloudFront Pricing** (First 12 months):
- First 1 TB/month: **FREE** (AWS Free Tier)
- After free tier: ~$0.085/GB (much cheaper than S3 direct)

For 10K users with 100 images: ~$5-10/month (vs $50+ direct from S3)

---

## Quick Alternative: Keep S3 Simple

If you don't want CloudFront complexity right now:

**Option 1: Make S3 bucket public** (simple but not recommended)
- Turn OFF "Block all public access"
- Add public bucket policy

**Option 2: Use signed URLs** (current setup - works but slower)
- Keep bucket private
- Generate signed URLs for each image
- No CDN caching

**Option 3: CloudFront** (recommended - what we're doing)
- Best performance
- Best security
- Best cost at scale

---

Let me know once CloudFront is deployed and I'll update the code!
