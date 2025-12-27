# Supabase Disk Full - Diagnosis & Cleanup Guide

## 🔴 **Problem Summary**

Your Supabase database is experiencing disk space issues. This is caused by:

1. **Base64 images stored in database** (should be in Storage)
2. **Large prompt strings** (thousands of characters per creative)
3. **Growing API usage logs** (never cleaned up)
4. **No data retention policy** (old data accumulates indefinitely)

---

## 📊 **Step 1: Diagnose the Issue**

Run the diagnostic endpoint to see exactly what's consuming disk space:

```bash
POST /api/admin/cleanup-database?action=diagnose
```

**Example using curl:**
```bash
curl -X POST "https://your-domain.com/api/admin/cleanup-database?action=diagnose" \
  -H "Cookie: your-session-cookie"
```

**Expected output:**
```json
{
  "action": "diagnose",
  "diagnosis": {
    "creatives": {
      "total": 150,
      "base64Images": 45,
      "base64ImagesPercent": "30%",
      "estimatedBase64DiskUsageMB": "22.50"
    },
    "prompts": {
      "sampled": 100,
      "over5KB": 23,
      "over10KB": 8,
      "over50KB": 2,
      "totalSizeKB": "456.78"
    },
    "apiUsage": {
      "total": 5420,
      "olderThan90Days": 3200,
      "olderThan90DaysPercent": "59%",
      "estimatedDiskUsageMB": "5.42"
    },
    "recommendations": [
      {
        "priority": "HIGH",
        "action": "migrate-images",
        "reason": "45 creatives have base64 images (est. 22MB)"
      },
      {
        "priority": "MEDIUM",
        "action": "cleanup-api-logs",
        "reason": "3200 API usage records older than 90 days"
      }
    ],
    "estimatedTotalSavingsMB": "25.62"
  }
}
```

---

## 🛠️ **Step 2: Fix Base64 Images (HIGHEST PRIORITY)**

### **Problem:**
Before November 2024, images were stored as base64 strings in the `image_url` column. A single image can be **500KB-1MB of base64 text**, causing massive database bloat.

### **Solution:**
Migrate base64 images to Supabase Storage:

```bash
# Dry run (see what would be migrated)
GET /api/admin/migrate-images

# Migrate (10 images at a time)
POST /api/admin/migrate-images?limit=10

# Migrate more (up to 50 at a time)
POST /api/admin/migrate-images?limit=50
```

### **How it works:**
1. Finds creatives with `image_url` starting with `data:image`
2. Converts base64 to binary buffer
3. Uploads to Supabase Storage (`creatives` bucket)
4. Updates `image_url` to Storage public URL
5. Original base64 is removed from database

### **Safety:**
- Atomic transactions (if upload fails, database isn't updated)
- Limit to 50 records per run (prevents timeouts)
- Can re-run safely (skips already migrated images)

### **Expected savings:**
- **22MB** from 45 base64 images (based on diagnosis example)

---

## 📝 **Step 3: Clean Up Old API Usage Logs**

### **Problem:**
The `api_usage` table logs every AI API call (prompts, tokens, costs). This table **grows indefinitely** with no cleanup, accumulating thousands of records.

### **Solution:**
Delete logs older than 90 days (configurable):

```bash
# Dry run (see what would be deleted)
POST /api/admin/cleanup-database?action=cleanup-api-logs&dryRun=true&retentionDays=90

# Actually delete
POST /api/admin/cleanup-database?action=cleanup-api-logs&retentionDays=90
```

### **Recommended retention:**
- **90 days** - For general monitoring and debugging
- **30 days** - If disk space is critical
- **180 days** - If you need longer-term analytics

### **Expected savings:**
- **3-5MB** from 3000-5000 old logs (based on diagnosis example)

---

## ✂️ **Step 4: Trim Large Prompts (OPTIONAL)**

### **Problem:**
The `prompt_used` column stores the full Gemini prompt (can be 5KB-50KB+ per creative). These are useful for debugging but consume disk space.

### **Solution:**
Trim prompts to first 5KB:

```bash
# Dry run
POST /api/admin/cleanup-database?action=trim-prompts&dryRun=true

# Actually trim
POST /api/admin/cleanup-database?action=trim-prompts
```

### **Trade-off:**
- ✅ Saves disk space
- ❌ Loses full prompt history (only keeps first 5KB)

### **Recommendation:**
Only do this if disk space is **critically low**. Consider increasing Supabase plan instead.

---

## 🔄 **Step 5: Set Up Automatic Cleanup (IMPORTANT)**

To prevent this issue from recurring, set up automatic cleanup:

### **Option A: Supabase Cron Job (Recommended)**

Create a Supabase Edge Function with a cron trigger:

1. Create Edge Function:
```bash
supabase functions new cleanup-old-data
```

2. Add cron trigger in `supabase/functions/cleanup-old-data/index.ts`:
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Delete API usage logs older than 90 days
  const retentionDate = new Date()
  retentionDate.setDate(retentionDate.getDate() - 90)

  const { count, error } = await supabase
    .from('api_usage')
    .delete({ count: 'exact' })
    .lt('created_at', retentionDate.toISOString())

  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500 })
  }

  return new Response(
    JSON.stringify({ deleted: count, message: 'Cleanup complete' }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

3. Deploy with cron schedule:
```bash
supabase functions deploy cleanup-old-data --cron '0 2 * * 0'  # Every Sunday at 2 AM
```

### **Option B: Next.js API Cron (Vercel/Railway)**

If using Vercel, add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/admin/cleanup-database?action=cleanup-api-logs",
      "schedule": "0 2 * * 0"
    }
  ]
}
```

---

## 📈 **Step 6: Monitor Disk Usage**

### **Check Current Status:**
```bash
GET /api/admin/cleanup-database
```

**Response:**
```json
{
  "creatives": {
    "total": 150,
    "base64Images": 0,
    "needsMigration": false
  },
  "apiUsage": {
    "total": 1200
  },
  "healthStatus": "HEALTHY"
}
```

### **Supabase Dashboard:**
1. Go to **Settings** → **Database**
2. Check **Database Size** metric
3. Set up alerts for 70% and 90% usage

---

## 🚨 **Emergency Cleanup (Disk >95% Full)**

If your disk is critically full, run all cleanup actions:

```bash
# 1. Migrate images (highest priority)
POST /api/admin/migrate-images?limit=50

# 2. Delete old API logs (aggressive 30-day retention)
POST /api/admin/cleanup-database?action=cleanup-api-logs&retentionDays=30

# 3. Trim prompts (if still needed)
POST /api/admin/cleanup-database?action=trim-prompts

# 4. Check savings
GET /api/admin/cleanup-database
```

---

## 💡 **Prevention Best Practices**

### ✅ **DO:**
1. **Always upload images to Storage** (current code does this since Nov 2024)
2. **Run cleanup monthly** (set up cron job)
3. **Monitor disk usage** (Supabase dashboard alerts)
4. **Set data retention policies** (90 days for logs)
5. **Use thumbnails** (app already does this - 20KB vs 1MB)

### ❌ **DON'T:**
1. **Never store base64 in database** (use Storage URLs)
2. **Don't keep prompts >5KB** (trim or reference by ID)
3. **Don't accumulate logs indefinitely** (implement retention)
4. **Don't skip migrations** (run monthly cleanup)

---

## 📞 **Need Help?**

### **Check Migration Status:**
```bash
GET /api/admin/migrate-images
```

### **Run Diagnostics:**
```bash
POST /api/admin/cleanup-database?action=diagnose
```

### **Contact Supabase Support:**
If cleanup doesn't resolve the issue, contact Supabase with:
- Database size before/after cleanup
- Number of records in `creatives` and `api_usage` tables
- Migration/cleanup logs

---

## 📋 **Cleanup Checklist**

- [ ] Run diagnostic: `POST /api/admin/cleanup-database?action=diagnose`
- [ ] Migrate base64 images: `POST /api/admin/migrate-images?limit=50`
- [ ] Verify migration: `GET /api/admin/migrate-images`
- [ ] Clean up old API logs: `POST /api/admin/cleanup-database?action=cleanup-api-logs&retentionDays=90`
- [ ] Check disk usage in Supabase Dashboard
- [ ] Set up cron job for automatic monthly cleanup
- [ ] Set up Supabase disk usage alerts (70%, 90%)
- [ ] Document cleanup schedule for team

---

## 📊 **Expected Results**

Based on typical usage:

| Action | Records Affected | Disk Space Saved |
|--------|------------------|------------------|
| Migrate base64 images | 45 creatives | **~22 MB** |
| Clean API logs (90 days) | 3200 logs | **~3 MB** |
| Trim prompts | 23 creatives | **~500 KB** |
| **TOTAL** | | **~25 MB** |

---

## 🎯 **Success Criteria**

After cleanup:
- ✅ `base64Images: 0` in diagnostic
- ✅ `healthStatus: "HEALTHY"` in status check
- ✅ Supabase disk usage < 70%
- ✅ Cron job set up for monthly cleanup
- ✅ No base64 images in new creatives (app already fixed)

---

**Last Updated:** December 27, 2025
**Version:** 1.0
