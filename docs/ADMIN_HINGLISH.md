<!-- consistency-review-2026-11-13 -->
> Current status, 13 November 2026 — See [current implementation and limits](CURRENT_STATE.md). The active design has Auto/Light/Dark themes and a separate community resource Library. Institution-scoped curriculum and publication review remain planned. Older counts, release IDs and provider checks below are dated evidence, not current certification.

# Website accounts and role management

## Current admin entry points — 13 November 2026

Desktop aur phone dono par avatar/account menu se Moderation kholo. Users, reports, teacher requests, overview aur audit ka access role ke hisaab se milta hai. Teacher approval student request ko Teacher status deta hai; moderator ko user roles, teacher approval ya platform settings ka access nahi milta. Announcement admin control hai. Har action se pehle intended account/content verify karo.

Teacher status, forum moderator aur institution-library manager alag concepts hain. Institution-scoped Library manager assignments abhi implement nahi hue hain. Current Library public community resource sharing hai. Current permissions aur limitations ke liye [CURRENT_STATE](CURRENT_STATE.md) padho. Purane header/theme steps neeche historical hain.

Updated 11 November 2026.

## Grant or revoke a role from the website

1. Apne existing Admin account se sign in karo.
2. Header ya phone Menu se Moderation kholo, phir Users tab select karo.
3. Intended registered user ka exact email verify karo. Zarurat ho toh Next/Previous se users list browse karo.
4. Role dropdown mein Student, Teacher, Moderator ya Admin select karo.
5. Save role dabao aur named account aur role ko confirmation mein check karo.
6. User apna page refresh kare. Current database role har authenticated API request par enforce hota hai.

| Role | Permissions |
| --- | --- |
| Student | Questions, answers, comments, votes and own account. |
| Teacher | Student actions and a Teacher badge. |
| Moderator | Student actions, report queue, dismiss reports and remove reported questions or answers. |
| Admin | Moderator actions, registered-user list, role assignments, suspend/restore and catalogue management. |

Only an Admin can assign roles. A Moderator has no user list, role controls,
suspension controls, catalogue changes or Study Library publication access.

## Protected primary administrator

At rollout the existing first active administrator is pinned in
admin_settings under primary-admin. The protected primary role survives later
promotions, so other admins can manage access without removing every admin.
The existing owner account is rajus.work1@gmail.com.

Admins cannot change their own role. Another admin can change a secondary
admin's role. Restore suspended accounts before granting Admin or Moderator.
Deleted accounts cannot be promoted. Invalid or conflicting changes are rejected.

## Team QA

Use the owner-approved QA account as the target. Record its original role,
grant Moderator, refresh its session, inspect Reports and the forbidden user
and catalogue routes, then restore its role. Repeat with Admin and restore
it from the primary owner's session. Keep student A/B in Student for normal
permission tests. Follow [the shared tester playbook](TESTER_PLAYBOOK.md).

Atlas database access and forum roles are managed separately. The temporary
cleanup database user does not sign in to the website. A fresh installation
with no administrator still needs a controlled first-admin bootstrap using
server/src/make-admin.js against its intended private database.
