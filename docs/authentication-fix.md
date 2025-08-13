# Authentication Fix: ObjectId Validation

## Problem

Users were experiencing an error when creating links:

```
Error creating link: Error: Link validation failed: userId: Cast to ObjectId failed for value "186413780" (type string) at path "userId" because of "BSONError"
```

## Root Cause

The issue was in the authentication flow where the JWT token was storing the OAuth provider's user ID (e.g., GitHub user ID "186413780") instead of our MongoDB ObjectId.

### What was happening:

1. User signs in with OAuth provider (GitHub, Google, Discord)
2. NextAuth creates a JWT token with `user.id` from the OAuth provider
3. Our database has a separate User document with its own MongoDB ObjectId
4. When creating links, we were using the OAuth provider ID instead of our MongoDB ObjectId
5. Mongoose validation failed because "186413780" is not a valid 24-character hex ObjectId

## Solution

### 1. Fixed JWT Callback

Updated the JWT callback in `src/lib/auth-simple.ts` to:
- Look up our User document in the database
- Use the MongoDB ObjectId (`_id`) instead of the OAuth provider ID
- Store the correct ObjectId in the JWT token

```typescript
async jwt({ token, user, account }) {
    if (user && account) {
        try {
            await connectDB();
            
            // Find our user in the database to get the MongoDB ObjectId
            const dbUser = await User.findOne({
                $or: [
                    { email: user.email },
                    { provider: account.provider, providerId: account.providerAccountId }
                ]
            });

            if (dbUser) {
                token.id = dbUser._id.toString(); // Use our MongoDB ObjectId
                // ... other fields
            }
        } catch (error) {
            // Fallback handling
        }
    }
    return token;
}
```

### 2. Added User Validation Utilities

Created `src/lib/user-utils.ts` with:
- `validateAndConvertUserId()` - Validates and converts string to ObjectId
- `validateUserSession()` - Validates entire user session
- `isValidObjectId()` - Checks if string is valid ObjectId format

### 3. Updated API Endpoints

Modified `src/app/api/links/route.ts` to:
- Validate user session before processing
- Ensure userId is a valid MongoDB ObjectId
- Provide clear error messages for invalid sessions

### 4. Added Debug Endpoint

Created `src/app/api/debug/session/route.ts` (development only) to help troubleshoot authentication issues.

## Testing

Added comprehensive tests in `src/lib/__tests__/user-utils.test.ts` covering:
- Valid and invalid ObjectId validation
- User session validation scenarios
- Error handling cases

## Usage

### For Users Experiencing the Error:

1. **Sign out** of the application
2. **Sign back in** with your OAuth provider
3. The new authentication flow will create a proper session with MongoDB ObjectId

### For Developers:

Use the debug endpoint in development to check session state:
```
GET /api/debug/session
```

## Prevention

The fix ensures that:
- All new sessions use proper MongoDB ObjectIds
- API endpoints validate user sessions before processing
- Clear error messages guide users to re-authenticate if needed
- Comprehensive tests prevent regression

## Files Modified

- `src/lib/auth-simple.ts` - Fixed JWT callback
- `src/app/api/links/route.ts` - Added user validation
- `src/lib/user-utils.ts` - New utility functions
- `src/app/api/debug/session/route.ts` - Debug endpoint
- `src/lib/__tests__/user-utils.test.ts` - Tests

## Error Codes

- `INVALID_USER_ID` - User session contains invalid ObjectId
- `UNAUTHORIZED` - No authentication session found

Users seeing these errors should sign out and sign back in.