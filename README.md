# Reflection Journal — Private AI Companion with Gemini & Firestore

A secure, user-authenticated reflection and journaling web application powered by **Gemini 3.6 Flash** and **Google Cloud Firestore**, protected by **Firebase Authentication** and owner-bound database security rules.

---

## Architecture & Security Highlights

1. **User Identity & Federated Authentication**: Sign-in is handled exclusively through Firebase Authentication (Google Sign-In). No passwords or credentials are stored or processed in application code.
2. **Path-Isolated Cloud Firestore**: All user interactions (journal prompts, reflections, and Gemini responses) reside under `/users/{userId}/interactions/{interactionId}`.
3. **Zero Insecure Defaults in Security Rules**: Strict Firestore rules ensure that each user can only read and write documents matching their own authenticated `request.auth.uid`.
4. **Server-Side Gemini API Proxy & Fallback Ladder**: The Gemini API key is isolated server-side. Requests are routed through an automated resilience ladder (`gemini-3.6-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest` → `gemini-3.7-flash`) with error status recovery (`503`, `429`, `404`, `500`).
5. **Zero-Crash Payload Hygiene**: Objects undergo recursive undefined-stripping prior to persistence to ensure crash-free Firestore transactions.
6. **Input-to-Save Completeness**: The user prompt and Gemini reply are atomically verified and persisted before the user's input buffer is cleared.

---

## 1. Prerequisites & Environment Setup

### 1.1 Enable Google Cloud APIs
Ensure the following APIs are activated in your Google Cloud Project:
```bash
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  identitytoolkit.googleapis.com
```

### 1.2 Install Required Tooling
- [Google Cloud CLI (`gcloud`)](https://cloud.google.com/sdk/docs/install)
- [Firebase CLI (`firebase`)](https://firebase.google.com/docs/cli)
- [Node.js (v20+)](https://nodejs.org/)

---

## 2. Secret Management Setup (Google Cloud Secret Manager)

To eliminate hardcoded credentials and prevent token leakage, create and bind the `GEMINI_API_KEY` secret:

```bash
# Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant the default Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 3. Database Security Configuration (Cloud Firestore)

Deploy the owner-bound security rules to ensure user data isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Deploy the rules via the Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 4. Google Cloud Run Deployment

Build and deploy the container service to Google Cloud Run:

```bash
gcloud run deploy reflection-journal \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest
```

### Mandatory Verification Binding
Apply the challenge verification label:
```bash
gcloud run services update reflection-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 5. Functional Stability & Walkthrough Test Suite

This section outlines end-to-end walkthrough test cases covering every user interaction and system process. These can be executed manually or transcribed directly into automated test scripts (e.g., Cypress, Playwright).

### Test Case 1: Unauthenticated Landing Page & UI Elements
- **Objective**: Verify that unauthenticated visitors are presented with the secure landing page and cannot view private journal entries.
- **Steps**:
  1. Navigate to the application root URL (`/`).
  2. Verify the presence of `#auth-landing-page`.
  3. Verify that the title "A tranquil space for thoughtful reflections and dialogue" and features list are rendered.
  4. Verify that the button `#google-signin-btn` is visible and enabled.
  5. Confirm that no private journal entries or user history are visible in the DOM.

### Test Case 2: Federated Google Sign-In Flow
- **Objective**: Verify that clicking Sign In initiates Google authentication and transitions to the authenticated dashboard.
- **Steps**:
  1. Click `#google-signin-btn`.
  2. Observe the loading state ("Authenticating with Google...").
  3. Complete the Google authentication popup.
  4. Verify that `#auth-landing-page` unmounts and `#reflection-app` mounts.
  5. Verify that `#app-navbar` displays the user's avatar, name, and email.
  6. Verify the "Isolated Firestore" security badge is visible.

### Test Case 3: Create a First Reflection Session (Cold Start)
- **Objective**: Verify that submitting a first entry generates a new interaction, invokes Gemini, and persists both user input and AI output in Firestore.
- **Steps**:
  1. On a fresh session, verify `#interaction-title-heading` displays "New Reflection Session".
  2. Click a quick starter button (e.g., `#quick-starter-0`) or type into `#reflection-input-textarea`: `"Today I made important progress on my work and felt energized."`
  3. Select mode `#mode-tab-reflection`.
  4. Click `#send-reflection-btn` (or press `Cmd+Enter` / `Ctrl+Enter`).
  5. Verify the loading indicator appears: "Gemini is synthesizing your reflection...".
  6. Verify the user bubble displays the exact prompt text.
  7. Verify Gemini's response bubble renders formatted markdown with the model badge ("Gemini 3.6 Flash").
  8. Verify the interaction appears in `#history-sidebar` under the history list with an auto-generated title and category badge.
  9. Verify the input textarea is cleared only after successful save.

### Test Case 4: Multi-Turn Conversation within the Same Reflection
- **Objective**: Verify multi-turn conversational context is maintained and appended to the existing Firestore document.
- **Steps**:
  1. In the active reflection session, enter a follow-up prompt: `"How can I sustain this positive momentum tomorrow?"`
  2. Click `#send-reflection-btn`.
  3. Verify that the conversation stream now contains 4 messages (2 user, 2 assistant).
  4. Verify the session document in Firestore under `/users/{userId}/interactions/{interactionId}` has `messages` array length equal to 4.
  5. Verify `#history-sidebar` updates the message count badge to `4`.

### Test Case 5: Mode Switching (Summarize and Brainstorm)
- **Objective**: Verify that switching reflection modes dynamically alters Gemini's instructions and system response style.
- **Steps**:
  1. Click `#mode-tab-summary`.
  2. Enter raw bullet points into `#reflection-input-textarea` and submit.
  3. Verify Gemini delivers a structured summary with bullet points and themes.
  4. Click `#mode-tab-brainstorm`.
  5. Enter a problem statement and submit.
  6. Verify Gemini returns creative ideation and alternative perspectives.

### Test Case 6: Copy to Clipboard Interaction
- **Objective**: Verify that assistant responses can be copied to clipboard.
- **Steps**:
  1. Hover over any Gemini message bubble.
  2. Click `#copy-msg-{id}`.
  3. Verify the icon briefly changes to a checkmark (`CheckCheck`) confirming clipboard write.

### Test Case 7: Inline Title Renaming
- **Objective**: Verify that users can edit and persist a custom title for any session.
- **Steps**:
  1. Click `#start-edit-title-btn` next to the session title.
  2. Change the text in `#edit-title-input` to `"Weekly Strategic Planning"`.
  3. Click `#save-title-btn` (or press `Enter`).
  4. Verify `#interaction-title-heading` displays the updated title.
  5. Verify the title immediately updates in `#history-sidebar`.

### Test Case 8: History Search & Filtering
- **Objective**: Verify that past entries can be searched by keyword and filtered by mode.
- **Steps**:
  1. Type a unique keyword into `#sidebar-search-input`.
  2. Verify only matching sessions remain visible in the history list.
  3. Clear the search input.
  4. Click `#sidebar-filter-summary`.
  5. Verify only interactions categorized as `summary` are displayed.
  6. Click `#sidebar-filter-all` to restore all entries.

### Test Case 9: Starting a New Reflection from Sidebar
- **Objective**: Verify starting a new thread resets the workspace while preserving previous entries in history.
- **Steps**:
  1. Click `#sidebar-new-entry-btn`.
  2. Verify the workspace resets to the clean scratchpad with prompt starters.
  3. Verify all previous entries remain in `#history-sidebar`.

### Test Case 10: Delete Reflection Session
- **Objective**: Verify that deleting an interaction removes the document from Firestore and updates the sidebar.
- **Steps**:
  1. Hover over an interaction item in the sidebar.
  2. Click `#delete-history-{id}`.
  3. Confirm the browser dialog prompt.
  4. Verify the item is removed from the sidebar and Firestore.

### Test Case 11: Transaction Integrity & Error Escalation
- **Objective**: Verify that if network or API errors occur, the user's input buffer is preserved, and a retry option is presented.
- **Steps**:
  1. If backend API is unavailable or returns an error, verify `#error-banner` is displayed.
  2. Verify `#reflection-input-textarea` retains the typed text without loss.
  3. Click `#error-banner-retry-btn` to re-execute the transaction.

### Test Case 12: Secure Sign Out
- **Objective**: Verify sign-out clears user credentials and redirects to the landing page.
- **Steps**:
  1. Click `#navbar-signout-btn`.
  2. Verify the user is signed out via Firebase Auth.
  3. Verify the UI transitions back to `#auth-landing-page`.
  4. Verify memory states (interactions, active session) are purged.
