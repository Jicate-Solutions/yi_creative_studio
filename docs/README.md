# Yi Creative Studio Documentation

## SSO Integration with Yi Connect

### 📚 Documentation Files

1. **[Yi Connect Implementation Summary](./yi-connect-implementation-summary.md)**
   - **For:** Yi Connect team (internal)
   - **Purpose:** What's been implemented, current status, next steps
   - **Audience:** Yi Connect developers

2. **[Yi Connect SSO Event Integration Guide](./yi-connect-sso-event-integration.md)**
   - **For:** Yi Creative team (partner)
   - **Purpose:** Complete implementation guide with code examples
   - **Audience:** Yi Creative developers

3. **[Integration Guide](./integration-guide.md)** *(if exists)*
   - General integration documentation

---

## 🚀 Quick Start

### For Yi Connect Team

**Your SSO integration is complete!** ✅

Next steps:
1. Read the [Implementation Summary](./yi-connect-implementation-summary.md)
2. Share the [Integration Guide](./yi-connect-sso-event-integration.md) with Yi Creative
3. Test the flow end-to-end

---

### For Yi Creative Team

**Action Required:** Update your `/create` page to read event data from SSO token.

See: [Yi Connect SSO Event Integration Guide](./yi-connect-sso-event-integration.md)

**Quick Fix (3 lines of code):**
```typescript
const ssoData = session?.user?.user_metadata?.sso_data
if (ssoData?.event_data) {
  const event = ssoData.event_data  // ✅ Instant!
}
```

---

## 📊 Architecture Overview

```
Yi Connect                    Yi Creative
(Identity Provider)          (Service Provider)
     │                             │
     │  1. User clicks             │
     │     "Create Poster"         │
     │                             │
     ├─────────JWT Token──────────>│
     │  (includes event_data)      │
     │                             │
     │                             │ 2. Verify token
     │                             │ 3. Provision user
     │                             │ 4. Provision org
     │                             │ 5. Provision event ✨
     │                             │ 6. Create session
     │                             │
     │<────Redirect: /create───────┤
     │                             │
     │                             │ 7. Pre-populate form
     │                             │    (from token data)
```

---

## 🔗 Related Files

### SSO Implementation
- `app/api/auth/sso/route.ts` - SSO callback endpoint
- `lib/auth/sso-types.ts` - TypeScript interfaces
- `lib/auth/sso-provisioning.ts` - User/org/event provisioning
- `lib/auth/sso-token.ts` - JWT verification
- `lib/auth/role-mapping.ts` - Role conversion logic

### Webhooks
- `app/api/webhooks/yi-connect/route.ts` - Webhook receiver
- `app/api/webhooks/events/route.ts` - Event webhook handler

### External Events
- `app/api/external-events/route.ts` - External events API
- `types/external-event.types.ts` - Event type definitions

---

## 📞 Support

For questions or issues:
- **Yi Connect Team:** Internal chat/issue tracker
- **Yi Creative Team:** Contact Yi Connect integration team

---

**Last Updated:** February 6, 2026
