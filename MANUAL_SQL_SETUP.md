# Manual SQL Setup Required

## Database Functions to Execute

Execute the following SQL functions in Supabase SQL Editor to enable full functionality:

### 1. User Statistics Function
**File**: `database/functions/get_user_stats.sql`
**Purpose**: Securely retrieves user statistics for admin dashboard
**Execute in**: Supabase SQL Editor

### 2. Admin Users List Function
**File**: `database/functions/get_admin_users_list.sql`
**Purpose**: Paginated user list with subscription counts for admin panel
**Execute in**: Supabase SQL Editor

### 3. Institution Users with Details Function
**File**: `database/functions/get_institution_users_with_details.sql`
**Purpose**: Real email and name data for ABPSI institution users
**Execute in**: Supabase SQL Editor

## How to Apply

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of each `.sql` file
3. Execute each function separately
4. Verify functions are created successfully

## After SQL Functions are Applied

### For Institution Users (ABPSI)
Uncomment lines 148-152 in `api/admin-institution-users.js`:
```javascript
// const { data: usersData, error: rpcError } = await supabase
//   .rpc('get_institution_users_with_details', {
//     institution_id_param: institutionId
//   });
```

This will enable real email and name display for ABPSI users instead of temporary data.

## Current Status
- ✅ System functional with temporary data
- 📋 Real user data available after SQL execution
- 🔄 RPC code ready but commented out