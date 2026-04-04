# Supabase Custom SMTP Runbook

This app uses Supabase magic-link email auth from [src/App.tsx](/Users/atushabe/NearlyFreeEnergy/NFE%20Web%20App/src/App.tsx). No application code changes are required to switch from Supabase's default email sender to custom SMTP.

The purpose of this runbook is to move auth email delivery to a self-hosted Docker mail server so portal sign-in is not blocked by Supabase's default hosted email rate limits.

## Target Setup

- Sender address: `no-reply@auth.nearlyfreeenergy.com`
- SMTP host: `smtp.auth.nearlyfreeenergy.com`
- Port: `587`
- TLS mode: `STARTTLS`
- Authentication: dedicated SMTP user for Supabase only

## Mail Server Preparation

Prepare the self-hosted mail stack first.

1. Create a dedicated SMTP mailbox or authenticated SMTP user for Supabase.
2. Assign the sender identity `no-reply@auth.nearlyfreeenergy.com` to that account.
3. Publish a public SMTP hostname such as `smtp.auth.nearlyfreeenergy.com`.
4. Ensure the SMTP host is reachable from the public internet on port `587`.
5. Ensure the SMTP host presents a valid public TLS certificate for `smtp.auth.nearlyfreeenergy.com`.
6. Confirm the SMTP service supports authenticated submission with `STARTTLS`.

## DNS Requirements

Configure the auth subdomain so the messages are deliverable and aligned.

1. Add the required `MX` record for the auth subdomain if your mail stack expects it.
2. Add an `SPF` record that authorizes the host that will send `auth.nearlyfreeenergy.com` mail.
3. Add `DKIM` records if your mail server signs outbound mail.
4. Add a `DMARC` record for `auth.nearlyfreeenergy.com`.
5. Use the exact values required by your mail stack instead of generic examples.

## Pre-Supabase Validation

Validate the mail server before editing Supabase.

1. Confirm `smtp.auth.nearlyfreeenergy.com` resolves publicly.
2. Confirm port `587` is reachable from outside your network.
3. Confirm `STARTTLS` negotiation succeeds and the certificate is valid.
4. Confirm the dedicated SMTP user can authenticate.
5. Send a test message from the mail server using the final sender identity.

## Supabase Dashboard Setup

Update Supabase only after the SMTP server passes the checks above.

1. Open the Supabase project dashboard.
2. Go to the Auth email/SMTP settings page.
3. Enable custom SMTP.
4. Set the SMTP host to `smtp.auth.nearlyfreeenergy.com`.
5. Set the SMTP port to `587`.
6. Set the SMTP username to the dedicated Supabase SMTP account.
7. Set the SMTP password to the dedicated Supabase SMTP password.
8. Set the connection mode to `STARTTLS` or the Supabase equivalent for secure submission on port `587`.
9. Set the sender email to `no-reply@auth.nearlyfreeenergy.com`.
10. Set the sender name to a branded value such as `Nearly Free Energy Portal`.
11. Save the SMTP configuration.

## Supabase Follow-Up Settings

After custom SMTP is enabled:

1. Review Supabase Auth rate-limit settings for email sends.
2. Increase the email send rate if the default custom-SMTP limit is still too low for testing or rollout.
3. Review the magic-link email template branding.
4. Keep the existing redirect URL configuration unchanged unless testing shows a redirect issue.

## App Validation

Use the current staged Vercel deployment for validation.

1. Open the latest staged `.vercel.app` deployment.
2. Request one magic-link email for a mapped customer account.
3. Confirm the message arrives from `no-reply@auth.nearlyfreeenergy.com`.
4. Confirm the message is not obviously failing SPF/DKIM/DMARC checks.
5. Click the magic link and verify you return to the staged deployment signed in.
6. Confirm the mapped customer dashboard loads.
7. If staged validation passes, promote the deployment to production.
8. Confirm production sign-in works with the new sender.

## Current App Assumptions

- Supabase project URL/key configuration remains unchanged.
- Vercel environment variables remain unchanged.
- Customer authorization now depends on the Supabase-backed customer/account/service records described in [README.md](/Users/atushabe/NearlyFreeEnergy/NFE%20Web%20App/README.md).
- SMTP setup is operational only; it does not require frontend or backend code changes in this repo.
