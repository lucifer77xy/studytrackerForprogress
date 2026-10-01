# Security Specification: StudyTracker ABAC & Zero-Trust Rules

## 1. Data Invariants
- Users can only read public profile information of themselves or friends; user private write access is strictly limited to `request.auth.uid == userId`.
- Study sessions can only be authored and logged by the authenticated student (`request.auth.uid == session.userId`).
- Study rooms can be read by authenticated users to allow joining via code; edits to room timers and settings can be performed by the room host or active members for collaborative notes and active member presence.
- Study room messages can only be posted by the authenticated user with their own UID (`request.auth.uid == incoming().userId`).
- Collaborative docs can be read and edited by the creator or anyone present in the `collaborators` list or if public within the group.
- All writes require Google-authenticated user (`request.auth != null`).
- String fields enforce mandatory `.size()` limits to prevent Denial of Wallet and payload injection.

## 2. The "Dirty Dozen" Threat Payloads
1. **Ghost Field User Update**: Attempting to inject `{ isAdmin: true, bypass: true }` into `/users/{userId}`.
2. **User Impersonation Write**: User A attempts to write or overwrite `/users/{userB}` with their own stats.
3. **Session Falsification**: User A attempts to record a session under User B's `userId`.
4. **Denial of Wallet Huge Payload**: Sending a 500KB string in `collaborativeNotes` exceeding maximum boundary.
5. **Unauthorized Message Spoofing**: Sending a room chat message with `userId: "admin_spoof"`.
6. **Room Deletion by Non-Host**: Participant User B attempts to delete a room created by User A.
7. **Negative XP Injection**: Writing negative or non-numeric XP in `StudySession`.
8. **Goal Tampering**: User B modifying User A's goals or marking them complete.
9. **Doc Hijack**: Non-collaborator attempting to edit or delete a private study doc.
10. **Unauthenticated Read/Write**: Unauthenticated visitor attempting to query `/users` or `/sessions`.
11. **ID Traversal Poisoning**: Passing invalid path IDs with semicolons or path traversal characters.
12. **Array Overfill Attack**: Injecting 50,000 friend IDs to exhaust document size limits.
