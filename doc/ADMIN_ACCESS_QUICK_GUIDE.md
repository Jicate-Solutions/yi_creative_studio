# Yi CreativeStudio - Admin Access Quick Reference

**For:** Client Team (JKKN)
**Date:** January 21, 2026

---

## 🎯 Two Types of Admin Access

### 1️⃣ Organization Admin
- **What:** Manages your specific organization (Yi chapter/team)
- **Access:** `/settings/admin`
- **Can do:** Manage team members, credits, organization settings
- **Who needs it:** Chapter presidents, team leaders, marketing heads

### 2️⃣ Super Admin
- **What:** Platform-level access to ALL organizations
- **Access:** `/super-admin`
- **Can do:** Everything across entire platform
- **Who needs it:** Platform administrators, senior management

---

## 🔐 Current Super Admin Accounts

| Email | Status |
|-------|--------|
| `sroja@jkkn.ac.in` | ✅ Active |
| `director@jkkn.ac.in` | ✅ **NEWLY ADDED** |
| `ranjith@jkkn.ac.in` | ✅ **NEWLY ADDED** |

---

## 🚀 First-Time Access (director & ranjith)

### Step-by-Step:

1. **Logout** from current session (if logged in)
   - Click profile → Logout

2. **Login again** with your credentials
   - `director@jkkn.ac.in` or `ranjith@jkkn.ac.in`
   - This refreshes your session with Super Admin permissions

3. **Access Super Admin panel**
   - Navigate to: `/super-admin`
   - Or type the full URL: `https://[your-domain]/super-admin`

4. **Verify access works**
   - You should see the Super Admin dashboard
   - If "Access Denied" → Repeat steps 1 & 2

⚠️ **Important:** Must logout and login again for permissions to activate!

---

## 📊 What Can Super Admins Do?

### User Management (`/super-admin/users`)
- View all users across platform
- Suspend/unsuspend accounts
- Assign users to organizations
- Impersonate users for support

### Organization Management (`/super-admin/organizations`)
- View/create/edit all organizations
- Manage organization subscriptions
- View organization usage and members

### Credit Management (`/super-admin/credits`)
- Allocate credits to any organization
- View all transactions
- Monitor credit usage analytics

### Platform Analytics (`/super-admin/analytics`)
- Usage trends and statistics
- Format popularity
- User engagement metrics

### Billing & Revenue (`/super-admin/billing`)
- Platform revenue overview
- Top paying organizations
- Subscription analytics

### Brand Assets (`/super-admin/brand-assets`)
- Manage platform logo library
- Upload/organize brand assets
- Manage creative templates

### Audit Logs (`/super-admin/audit`)
- Track all admin actions
- See who changed what and when
- Export logs for compliance

---

## ❓ Troubleshooting

### "Access Denied" Error
**Fix:** Logout and login again (99% of the time this fixes it)

### Don't See Super Admin Link?
**Normal!** Just type `/super-admin` in URL bar directly

### Still Not Working?
1. Clear browser cache
2. Try incognito/private mode
3. Contact: `sroja@jkkn.ac.in`

---

## 🔒 Security Reminders

✅ **DO:**
- Protect your credentials
- Be aware all actions are logged
- Use impersonation only for support
- Review audit logs regularly

❌ **DON'T:**
- Share your Super Admin account
- Grant Super Admin access unnecessarily
- Leave impersonation sessions open

---

## 📞 Support Contacts

**Technical Issues:**
- `sroja@jkkn.ac.in` - Platform Administrator
- `ranjith@jkkn.ac.in` - Technical Lead

**Super Admin Access Requests:**
- `director@jkkn.ac.in` - Director

---

## ✅ Setup Checklist

- [x] Super Admin database flags set for director & ranjith
- [x] Migration created: `20260121142029_grant_super_admin_director_ranjith.sql`
- [x] Setup scripts created
- [x] Documentation prepared
- [ ] **TODO:** director & ranjith to logout/login and verify access
- [ ] **TODO:** Test Super Admin features (user management, credits, etc.)

---

**Need the detailed version?** See: `doc/CLIENT_ADMIN_ACCESS_GUIDE.md`

**Ready to go!** 🎉
