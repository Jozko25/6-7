# Fix CloudFront Access - Complete Guide

## Current Situation
✅ S3 bucket policy is configured correctly
✅ Images upload to S3 successfully
✅ Temporary fix: Direct S3 URLs are working (bucket is public)
❌ CloudFront access gives "Access Denied" error

## The Problem
CloudFront distribution is missing **Origin Access Control (OAC)** configuration. Without OAC, CloudFront can't authenticate with S3 to retrieve files.

---

## Step-by-Step Fix

### Step 1: Open CloudFront Distribution
1. Go to CloudFront Console: https://console.aws.amazon.com/cloudfront/v4/home
2. Click on your distribution: **E1IWHV3QXER75I**
3. Wait for status to show **"Enabled"** (not "Deploying")

### Step 2: Configure Origin Access Control (OAC)

#### 2.1: Click the "Origins" Tab
In your distribution page, click the **Origins** tab at the top.

#### 2.2: Edit the Origin
1. You should see one origin: `sixsevendigits.s3.eu-central-1.amazonaws.com`
2. Select it (checkbox)
3. Click **Edit** button

#### 2.3: Set Origin Access Control
In the Edit Origin page:

**Origin access** section:
- Change from "Public" to **"Origin access control settings (recommended)"**

**Origin access control** dropdown:
- If you already have an OAC, select it
- If not, click **"Create new OAC"**

#### 2.4: Create OAC (if needed)
If creating new OAC:
1. Click **"Create control setting"**
2. **Name**: `sixsevendigits-oac`
3. **Signing behavior**: Sign requests (recommended)
4. **Origin type**: S3
5. Click **"Create"**

#### 2.5: Save Changes
1. Click **"Save changes"** at the bottom
2. You'll see a **blue banner** saying "S3 bucket policy needs to be updated"
3. Click **"Copy policy"** button in that banner

### Step 3: Update S3 Bucket Policy (Again)

1. Go to S3 bucket: https://s3.console.aws.amazon.com/s3/buckets/sixsevendigits?tab=permissions
2. **Permissions** tab → **Bucket Policy** → **Edit**
3. **Replace** the entire policy with the one you just copied
4. It should look like this (but with YOUR exact ARN):

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
        }
    ]
}
```

5. Click **"Save changes"**

### Step 4: Wait for Propagation
- CloudFront changes take **5-15 minutes** to deploy globally
- Check the distribution status - wait until it shows "Enabled" again

### Step 5: Test CloudFront Access

Try accessing this URL in your browser:
```
https://d3poz0b5r7i6cm.cloudfront.net/vehicles/1770290254077-IMG_5824.jpeg
```

**Expected result**: Image loads successfully!

---

## Step 6: Switch App Back to CloudFront

Once CloudFront is working, update your `.env` file:

```bash
# Uncomment CloudFront URLs
CLOUDFRONT_DOMAIN="d3poz0b5r7i6cm.cloudfront.net"
CLOUDFRONT_URL="https://d3poz0b5r7i6cm.cloudfront.net"
```

### Step 7: Make S3 Bucket Private Again (Recommended)

Now that CloudFront is working, remove public access from S3:

1. Go to S3 bucket permissions
2. Edit **Bucket Policy**
3. **Remove** the second statement that starts with `"Sid": "PublicReadGetObject"`
4. Keep ONLY the CloudFront statement:

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
        }
    ]
}
```

5. Save changes

### Step 8: Verify Everything Works

1. Restart your dev server: `npm run dev`
2. Upload a new vehicle with images
3. Images should load from CloudFront URL
4. Direct S3 URLs should give "Access Denied" (this is correct!)

---

## Troubleshooting

### Issue: "Access Denied" on CloudFront after configuring OAC

**Solution**: Clear CloudFront cache
1. Go to CloudFront distribution
2. **Invalidations** tab
3. Click **"Create invalidation"**
4. Enter path: `/*` (invalidate everything)
5. Click **"Create invalidation"**
6. Wait 1-2 minutes

### Issue: Distribution stuck in "Deploying" state

**Solution**: Just wait - deployments can take up to 15 minutes

### Issue: OAC option not available

**Solution**: Make sure:
- You're in the **Origins** tab (not Behaviors)
- You clicked **"Edit"** on the origin (not the distribution)
- Your origin type is S3 (not custom)

---

## Why OAC is Better Than Public Bucket

| Aspect | Public S3 Bucket | CloudFront with OAC |
|--------|------------------|---------------------|
| Security | ❌ Anyone can access | ✅ Only CloudFront can access |
| Speed | ❌ Slow (single region) | ✅ Fast (global CDN) |
| Cost | ❌ Higher bandwidth costs | ✅ Lower (CloudFront cheaper) |
| DDoS Protection | ❌ No protection | ✅ AWS Shield included |
| Logs/Analytics | ❌ Basic | ✅ Detailed CloudFront logs |

---

## Summary Checklist

- [ ] CloudFront distribution status is "Enabled"
- [ ] Origin Access Control (OAC) is created
- [ ] Origin is configured to use OAC
- [ ] S3 bucket policy updated with CloudFront ARN
- [ ] Test URL works: https://d3poz0b5r7i6cm.cloudfront.net/vehicles/...
- [ ] `.env` has `CLOUDFRONT_URL` uncommented
- [ ] S3 bucket is private again (public statement removed)
- [ ] App successfully uploads and displays images via CloudFront

---

## Quick Reference

**Distribution ID**: E1IWHV3QXER75I
**Distribution Domain**: d3poz0b5r7i6cm.cloudfront.net
**S3 Bucket**: sixsevendigits
**Region**: eu-central-1

**CloudFront Console**: https://console.aws.amazon.com/cloudfront/v4/home#/distributions/E1IWHV3QXER75I
**S3 Console**: https://s3.console.aws.amazon.com/s3/buckets/sixsevendigits
