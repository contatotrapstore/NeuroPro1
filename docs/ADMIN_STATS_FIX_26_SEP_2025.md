# ABPSI Admin Statistics Fix - September 26, 2025

## 🎯 Problem Solved

**Issue**: Admin master panel and subadmin dashboard showing incorrect statistics for ABPSI:
- Admin Master Modal: 0 users, 0 conversations, 1 assistant
- Reality: 7 users, 4 conversations, 1 assistant

## 🔧 Root Cause Analysis

1. **Conversations always 0**: `admin-institutions-simple.js` line 387 had hardcoded comment `// Conversas deixaremos como 0 por enquanto para simplificar`
2. **Users count may be 0**: Query was filtering by `is_active = true` but admin panel shows "Total Users" not just active ones
3. **Silent failures**: Missing error logging made diagnosis difficult
4. **RPC fallback**: `admin-institution-users.js` may fallback to placeholder data unnecessarily

## ✅ Fixes Implemented

### 1. Fixed Conversations Calculation (`admin-institutions-simple.js` lines 401-432)

**BEFORE**:
```javascript
// Conversas deixaremos como 0 por enquanto para simplificar
let conversationsCount = { count: 0 };
```

**AFTER**:
```javascript
try {
  // Contagem de conversas - buscar usuários da instituição e suas conversas
  const { data: institutionUserIds, error: userIdsError } = await supabase
    .from('institution_users')
    .select('user_id')
    .eq('institution_id', institution.id);

  if (!userIdsError && institutionUserIds && institutionUserIds.length > 0) {
    const userIds = institutionUserIds.map(u => u.user_id);

    const conversationResult = await supabase
      .from('conversations')
      .select('id', { count: 'exact' })
      .in('user_id', userIds);

    console.log(`📊 ${institution.name} - Conversations query result:`, {
      userIds: userIds.length,
      count: conversationResult.count,
      error: conversationResult.error?.message
    });

    if (!conversationResult.error) {
      conversationsCount = conversationResult;
    }
  }
} catch (error) {
  console.error(`❌ ${institution.name} - conversations calculation error:`, error.message);
}
```

### 2. Fixed Users Count Filter (`admin-institutions-simple.js` lines 357-377)

**BEFORE**:
```javascript
const userResult = await supabase
  .from('institution_users')
  .select('id', { count: 'exact' })
  .eq('institution_id', institution.id)
  .eq('is_active', true); // ❌ Only counted active users
```

**AFTER**:
```javascript
const userResult = await supabase
  .from('institution_users')
  .select('id', { count: 'exact' })
  .eq('institution_id', institution.id);
  // ✅ Counts ALL users (admin panel shows "Total Users")
```

### 3. Added Comprehensive Debug Logging

**Enhanced logging for all queries**:
```javascript
console.log(`📊 ${institution.name} - Users query result:`, {
  count: userResult.count,
  error: userResult.error?.message
});

console.log(`📊 ${institution.name} - Assistants query result:`, {
  count: assistantResult.count,
  error: assistantResult.error?.message
});

console.log(`📊 ${institution.name} - Conversations query result:`, {
  userIds: userIds.length,
  count: conversationResult.count,
  error: conversationResult.error?.message
});
```

### 4. Enhanced RPC Diagnostics (`admin-institution-users.js` lines 149-199)

**Added detailed RPC error logging**:
```javascript
console.log('🔧 RPC call completed:', {
  hasData: !!usersData,
  dataLength: usersData ? usersData.length : 0,
  hasError: !!rpcError,
  errorMessage: rpcError?.message,
  errorCode: rpcError?.code,
  errorDetails: rpcError?.details
});
```

## 📊 Expected Results

### ABPSI Statistics (After Fix)

**Database Reality** (confirmed via MCP queries):
- Total Users: 7
- Active Users: 5
- Total Conversations: 4
- Total Assistants: 1
- Enabled Assistants: 1

**Admin Master Modal Should Now Show**:
- ✅ 7 Usuários
- ✅ 4 Conversas
- ✅ 1 Assistente
- ✅ Licença: Ilimitada

**Subadmin Dashboard Should Show**:
- ✅ Real user list with actual emails (gouveiarx@gmail.com, etc.)
- ✅ Proper user roles (subadmin, student)
- ✅ No more placeholder @abpsi.org.br emails

## 🧪 Testing Plan

### 1. Admin Master Panel Test
1. Login as admin (gouveiarx@gmail.com)
2. Go to Admin > Instituições
3. Click on "ABPSI" institution
4. Verify "Visão Geral" tab shows: 7 usuários, 4 conversas, 1 assistente

### 2. Subadmin Dashboard Test
1. Login as ABPSI subadmin (academiabrasileirapsicanalise@gmail.com)
2. Go to institution dashboard `/i/abpsi`
3. If admin features: verify user list shows real emails and names
4. Check that statistics are consistent with master admin

### 3. API Debug Test
1. Check Vercel function logs for institutions API
2. Should see detailed logging: `📊 Academia Brasileira de Psicanálise - Users query result: { count: 7 }`
3. Should see conversations calculation logs

## 🔄 API Endpoints Updated

1. **`/api/admin-institutions-simple`** - Fixed statistics calculation
2. **`/api/admin-institution-users`** - Enhanced RPC diagnostics
3. **`/api/admin-institution-reports`** - Already working correctly

## 📝 Related Files Modified

- `api/admin-institutions-simple.js` (lines 347-432)
- `api/admin-institution-users.js` (lines 149-199)
- `docs/ADMIN_STATS_FIX_26_SEP_2025.md` (this file)

## 🏷️ Deployment Notes

- Changes are in Vercel serverless functions
- No database schema changes required
- Should work immediately after deployment
- Monitor Vercel function logs for new debug output

---

**Status**: ✅ Fixes implemented and ready for testing
**Priority**: High (affects admin visibility into ABPSI usage)
**Impact**: Admin master panel and subadmin dashboard for ABPSI institution