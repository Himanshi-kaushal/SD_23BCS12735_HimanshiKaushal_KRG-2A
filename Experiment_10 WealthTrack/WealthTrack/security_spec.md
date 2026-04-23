# Security Specification: WealthTrack

## 1. Data Invariants
- A transaction must always belong to a legitimate user.
- The `userId` in a transaction document must exactly match the authenticated user's ID.
- Amounts must be positive numbers.
- Types must be either 'income' or 'expense'.
- Timestamps must be validated against `request.time`.

## 2. The "Dirty Dozen" Payloads (Denial Expected)
1. **Identity Theft**: Creating a transaction with `userId` of another user.
2. **Shadow Field injection**: Adding `isVerified: true` to a user profile.
3. **Ghost Transaction**: Creating a transaction without a `userId`.
4. **Negative Value**: Transaction with `amount: -100`.
5. **Type Spoofing**: Transaction with `type: 'rebate'`.
6. **Future Spoofing**: Setting `createdAt` to a future date manually.
7. **Cross-User Read**: Trying to list transactions belonging to another `userId`.
8. **Unauthorized Deletion**: Deleting a user profile that isn't yours.
9. **Role Escalation**: Attempting to update a user profile `role` field.
10. **ID Poisoning**: Using a 2KB string as a transaction ID.
11. **PII Leak**: Querying all user profiles to get email addresses.
12. **Blanket List**: Querying `/transactions` without a `userId` filter.

## 3. Test Runner (Conceptual)
All the above would return `PERMISSION_DENIED`.
