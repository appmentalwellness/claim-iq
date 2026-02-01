This file contains real-world domain knowledge for ClaimIQ,
an AI-powered insurance denial recovery system for Indian hospitals.

This context represents operational ground truth and must be used
by all AI agents when making decisions, generating text, or designing workflows.

The system must behave like an experienced hospital billing manager.
1. Business Context
Indian hospitals lose a significant portion of revenue due to insurance claim denials.
This loss is mostly caused by manual processes, missing documents, coding mistakes,
and lack of timely follow-up.

Most hospitals:

Use Excel or simple billing software

Store claim documents as PDFs

Have 2–5 billing staff

Work with multiple insurers and TPAs

Do not have automated tracking for denied claims

Denied claims are often forgotten, delayed, or written off,
resulting in permanent revenue loss.

2. Key Terms (Operational)
Claim:
A request submitted by a hospital to an insurer or TPA for payment of patient services.

Denial:
Rejection (full or partial) of a claim by insurer or TPA.

Appeal:
A formal request by the hospital to reconsider a denied claim.

Pre-authorization (Pre-auth):
Approval taken from insurer before starting treatment.

TPA (Third Party Administrator):
Company managing insurance claims on behalf of insurers.

EOB (Explanation of Benefits):
Document explaining payment or denial.

3. Common Denial Reasons (India – Real World)
A. Missing or Invalid Documents (most common)
Discharge summary missing

Pre-auth form not attached

Doctor signature missing

Final bill not uploaded

Investigation reports missing

ID proof missing

B. Coding Errors
Wrong diagnosis code (ICD)

Wrong procedure code

Package selected incorrectly

Billing category mismatch

C. Policy / Coverage Issues
Room rent limit exceeded

Sub-limit breached

Procedure excluded from policy

Waiting period not completed

Non-medical items included

D. Timely Filing
Claim submitted after allowed time

Appeal submitted after deadline

E. Medical Necessity
Treatment not justified

Excess length of stay

Procedure considered avoidable

4. Typical Indian Insurers & TPAs
Insurers
Star Health

HDFC Ergo

ICICI Lombard

Bajaj Allianz

Niva Bupa (Max Bupa)

New India Assurance

United India Insurance

National Insurance

Oriental Insurance

TPAs
Medi Assist

MD India

Vidal Health

Paramount TPA

Raksha TPA

Health India TPA

Heritage TPA

5. Typical Claim Workflow
Patient admitted

Pre-auth requested

Treatment done

Discharge summary created

Final bill generated

Claim submitted to TPA

TPA reviews claim

Claim approved or denied

If denied → appeal submitted

Follow-ups done

Payment received or written off

6. Hospital Billing Team Reality
Billing teams typically:

Maintain Excel sheets

Upload documents manually

Log in to multiple TPA portals

Track follow-ups by phone/email

Prioritize new claims over old denials

They are:

Non-technical

Overworked

Measured on collections

Under pressure from management

They often forget low-value claims and
miss appeal deadlines.

7. Real Revenue Loss (Ground Truth)
Typical mid-size hospital:

Annual revenue: ₹30–100 Cr

Insurance portion: 30–50%

Denial rate: 8–15%

Only 40–50% denials appealed properly

Permanent revenue loss:
₹50L – ₹1Cr per year per hospital

This is called Revenue Leakage.

8. What ClaimIQ Must Do
ClaimIQ exists to:

Track every denied claim

Classify denial reason

Suggest corrective action

Generate appeal letters

Prioritize by ₹ amount

Remind humans before deadlines

Increase recovery rate

9. Appeal Letter Style (India)
Appeals should be:

Formal

Financial

Clear and concise

Polite but firm

Tone example:

"This is with reference to the above-mentioned claim which was denied due to missing discharge summary. The required document is now attached for your kind reconsideration. We request you to process the claim at the earliest."

10. Recovery Strategy Rules
AI Recovery Strategist should:

Prioritize high-value claims first

Check filing deadlines

Identify missing documents

Suggest document correction

Escalate after repeated denial

Recommend write-off if:

Policy explicitly excludes

Deadline expired

Medical necessity invalid

11. Human-in-the-loop Rules
No automatic submission without approval

All AI actions must be editable

All actions must be logged

Humans can override AI decisions

12. Product Language Rules
The product must use:

Claims

Denied amount

Money recovered

Follow-ups pending

Recovery rate

Pending amount

Avoid technical AI language.