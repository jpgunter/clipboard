# **Sports Team App \- System Architecture & Design Specification**

# **1\. System Architecture Overview**

The system is designed as a serverless static web application leveraging AWS cloud-native services for identity, API routing, compute, and data persistence.

* **Frontend:** React Single-Page Application (SPA) built with Vite and TypeScript. Hosted statically on GitHub Pages via automated GitHub Actions pipelines. Authenticates directly with Amazon Cognito and issues signed requests to the backend via Amazon API Gateway.  
* **Infrastructure as Code (IaC):** AWS CDK utilizing TypeScript (`aws-cdk-lib`) to define, synthesize, and provision cloud resources idempotently across environments.  
* **Backend:** Serverless REST API utilizing Amazon API Gateway and AWS Lambda runtimes implemented in Java 21 (Amazon Corretto).  
* **Persistence:** Amazon DynamoDB utilizing a Single-Table Design schema to optimize throughput, ensure single-digit millisecond latency, and eliminate cross-table join overhead.

# **2\. Data Persistence Design (DynamoDB Single-Table)**

**Table Name:** `SportsAppTable`

**Key Schema:**

* Partition Key (`PK`): String  
* Sort Key (`SK`): String  
* Global Secondary Index 1 (`GSI1`): `GSI1PK` (String), `GSI1SK` (String)

## **Sort Key Timestamp Ordering Strategy**

DynamoDB sort keys maintain lexicographical ordering. Standardizing timestamps into ISO-8601 strings (`YYYY-MM-DDTHH:mm:ss.sssZ`) ensures alphabetical sequence aligns precisely with chronological ordering. Setting `ScanIndexForward = false` retrieves the most recent events or messages first without requiring in-memory client-side sorting.

## **Entity & Access Patterns Mapping**

| Entity Type | PK | SK | GSI1PK | GSI1SK | Attributes / Projections |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **User Profile** | `USER#<userId>` | `PROFILE` | \- | \- | `email`, `name`, `role`, `createdAt` |
| **Team Metadata** | `TEAM#<teamId>` | `METADATA` | \- | \- | `teamName`, `sport`, `season`, `createdBy` |
| **Team Membership** | `TEAM#<teamId>` | `USER#<userId>` | \- | \- | `joinedAt`, `jerseyNumber`, `teamRole`, `parentEmail` |
| **User's Teams Lookup** | `TEAM#<teamId>` | `USER#<userId>` | `USER#<userId>` | `TEAM#<teamId>` | `teamName`, `role` |
| **Team Message** | `TEAM#<teamId>` | `MSG#<isoTimestamp>#<msgId>` | \- | \- | `senderId`, `content`, `gifUrl`, `imageUrl`, `createdAt` |
| **Direct Message (DM)** | `DM#<dmChannelId>` | `MSG#<isoTimestamp>#<msgId>` | \- | \- | `senderId`, `recipientId`, `content`, `gifUrl`, `imageUrl`, `createdAt` |
| **User DM Lookup (Inbox)** | `DM#<dmChannelId>` | `USER#<userId>` | `USER#<userId>` | `DM#<isoTimestamp>#<dmChannelId>` | `otherUserId`, `lastMessage` |
| **Guardian Link** | `USER#<playerId>` | `GUARDIAN#<guardianUserId>` | \- | \- | `relation`, `email` |
| **Team Event** | `TEAM#<teamId>` | `EVENT#<startDateISO>#<eventId>` | \- | \- | `title`, `location`, `eventType`, `startTime`, `endTime` |
| **RSVP** | `EVENT#<eventId>` | `RSVP#<userId>` | \- | \- | `status` (YES, NO, MAYBE), `updatedAt` |

# **3\. Direct Messaging (DM) Strategy**

## **Deterministic Conversation Channels**

To enforce a unique 1-to-1 conversation record between two parties regardless of who triggers the message, the channel identifier is derived deterministically by sorting participant user identifiers lexicographically:

`dmChannelId = min(userA, userB) + "_" + max(userA, userB)`

## **Query Patterns & Atomic Mutations**

* **Fetch DM Message History:** Query `PK = DM#<dmChannelId>` AND `SK begins_with "MSG#"`, configuring `ScanIndexForward = false` and setting a fixed `Limit = N` for pagination.  
* **Fetch User DM Inbox:** Query index `GSI1` using `GSI1PK = USER#<userId>` AND `GSI1SK begins_with "DM#"`, sorted descending to surface the most recent conversations.  
* **Send Message Transaction:** Execute a `TransactWriteItems` call containing the new message entry (`DM#<dmChannelId>`, `MSG#...`) alongside dual updates to the participant Inbox index records on GSI1 to keep metadata in sync.

## **Minor-Player Communication Guard**

Players whose membership record carries a `parentEmail` are treated as minors for messaging purposes. This guard is enforced server-side at the DM dispatch endpoint: the Lambda resolves the recipient's team memberships and rejects the request with `403 Forbidden` when any membership holds a `parentEmail`. The frontend mirrors this by suppressing the Message affordance for such players in the team roster UI, so the restriction is discoverable but never relied upon for enforcement.

# **4\. Querying Events via Sort Key Ordering**

Event records leverage compound sort keys with ISO-8601 timestamps to allow bounded chronological range queries:

* **Upcoming Events (Chronological):** Query `PK = TEAM#<teamId>` AND `SK >= EVENT#<currentISO>` with `ScanIndexForward = true` (delivers the nearest upcoming event first).  
* **Past Events (Reverse Chronological):** Query `PK = TEAM#<teamId>` AND `SK < EVENT#<currentISO>` with `ScanIndexForward = false` (delivers the most recently completed event first).

# **5\. Infrastructure Architecture (TypeScript CDK)**

## **Repository Organization**

```
infra/
├── bin/
│   └── app.ts
├── lib/
│   ├── database-stack.ts
│   ├── auth-stack.ts
│   ├── api-stack.ts
│   ├── media-stack.ts
│   └── main-stack.ts
└── cdk.json
```

## **Resource Manifest**

* `auth-stack.ts`: Configures Amazon Cognito User Pool with email sign-in, MFA support, and OAuth2/JWT issuance.  
* `database-stack.ts`: Defines `SportsAppTable` with provisioned GSI1, on-demand billing mode, and Point-in-Time Recovery (PITR) enabled.  
* `api-stack.ts`: Provisions API Gateway REST API with Cognito Authorizers, shared CORS rules, and Lambda proxy routes.
* `media-stack.ts`: Provisions an S3 bucket for user-uploaded images with presigned-URL issuance via Lambda; images are referenced from messages by object key.

# **6\. Backend Specification (Java 21 Lambdas)**

## **Maven Module Structure**

```
backend/
├── pom.xml
├── common-model/          # DTOs, Jackson serializers, DynamoDB Enhanced Client schemas
├── create-team-lambda/    # Handler for team creation and ownership bootstrapping
├── roster-lambda/         # Handler for listing and adding team members (incl. parent email)
├── events-lambda/         # Handler for event scheduling, retrieval, and aggregated RSVP metrics
├── post-message-lambda/   # Handler for publishing team-level broadcast chat
├── direct-message-lambda/ # Handler for DM dispatch, minor guard checks, and inbox updates
└── manage-rsvp-lambda/    # Handler for event RSVP states and audit timestamps
```

## **Core REST Endpoints**

| Method | Resource Path | Purpose |
| :---- | :---- | :---- |
| `POST` | `/teams` | Provision new team and initialize creator ownership record. Payload includes `teamName`, `sport`, `season`; when a sport or season outside the standard catalog is entered via the `Other` fallback, the free-text value is persisted as-is. |
| `POST` | `/teams/{teamId}/members` | Add a player to the team roster with optional `jerseyNumber` and `parentEmail`. Creating the membership with a `parentEmail` flags the player for the minor communication guard (see §3). |
| `GET` | `/teams/{teamId}/members` | Retrieve the team roster with roles, jersey numbers, and guardian links. |
| `GET` | `/teams/{teamId}/events` | Fetch chronologically sorted team schedule and RSVP summaries. |
| `POST` | `/teams/{teamId}/events` | Schedule a new team event (`title`, `location`, `eventType`, `startTime`, `endTime`). |
| `POST` | `/teams/{teamId}/events/{eventId}/rsvp` | Submit or update event attendance status. |
| `POST` | `/teams/{teamId}/messages` | Broadcast message to all members of the specified team. Accepts `content` plus optional `gifUrl` / `imageUrl`. `imageUrl` refers to an object previously uploaded to the media bucket. |
| `GET` | `/dms/{otherUserId}/messages` | Paginated retrieval of 1-to-1 direct message history (`limit=30`). |
| `POST` | `/dms/{otherUserId}/messages` | Transact new direct message and update recipient inbox pointers. Rejects with `403` when the recipient has a parent email on file. |

# **7\. Frontend Architecture (React \+ TypeScript)**

## **Application Layout**

```
frontend/
├── src/
│   ├── api/          # Axios HTTP client with Cognito Bearer Token interceptors
│   ├── components/   # Atomic UI primitives, chat feed widgets, GIF picker, image picker
│   ├── context/      # AuthContext (user session) and ServicesContext (service layer)
│   ├── pages/        # Dashboard, CreateTeam, TeamView, EventsCalendar, MessagingCenter
│   ├── services/     # AppServices interface + mock implementation (see §9)
│   ├── App.tsx       # Route definitions and authenticated shell layout
│   └── main.tsx      # Application entrypoint
└── package.json
```

## **Feature Notes**

* **Rich Messaging:** Team and DM composers offer Text, GIF (Giphy), and Image modes. GIFs are attached as `gifUrl`; images are uploaded to object storage and attached as `imageUrl`. Messages carry at most one attachment; a text message containing an image URL is auto-rendered as an inline image with the URL stripped from the displayed caption.
* **Team Creation:** A dedicated `/teams/create` route hosts the creation form. Sport and Season are dropdowns whose `Other` option reveals a free-text fallback input; the resolved value is sent to `POST /teams`.
* **Event Scheduling:** Events can be created from the global Events Calendar page and from the Events tab of a team, sharing one create-event form (title, location, type, start/end datetimes).
* **Roster & Parent Email:** The Team tab exposes an Add Player form (name, optional jersey number, optional parent email). Players flagged with a parent email display a guardian badge and have the direct-message affordance suppressed in the UI.

# **8\. Execution Plan for Coder Agents**

## **Implementation Phases**

* **Phase 1: Infrastructure & CDK Setup**  
  * Instantiate CDK directory layout within `infra/`.  
  * Provision DynamoDB single-table schema with composite partition/sort keys and GSI1.  
  * Configure Cognito User Pool and establish base API Gateway REST scaffolding.  
* **Phase 2: Backend Core & Data Models**  
  * Implement Maven parent project and shared `common-model` module in Java 21\.  
  * Define DynamoDB Enhanced Client mappings and DTOs with Jackson validation annotations.  
* **Phase 3: Lambda Handlers & API Routing**  
  * Write Lambda handlers for Team, Event, RSVP, Team Chat, and Direct Message workflows.  
  * Wire Lambda handlers to API Gateway endpoints with Cognito JWT authorization checks.  
* **Phase 4: Client Scaffolding & Authentication**  
  * Initialize React application via Vite using TypeScript and Tailwind CSS.  
  * Implement Cognito authentication layer using React Context and Axios request interceptors.  
* **Phase 5: Feature Integration & CI/CD Pipelines**  
  * Construct views for Team Dashboard, Schedule/RSVP tracking, and real-time DM chat.  
  * Configure `.github/workflows/deploy.yml` for automated static deployments to GitHub Pages (two-job build → deploy workflow deploying `frontend/dist` with `base: '/clipboard/'`).

# **9\. Current Implementation Status (Mock-First)**

The frontend is fully implemented against an in-memory mock service layer, allowing all features to be exercised on GitHub Pages without backend infrastructure. All frontend contracts are defined up front in `services/interfaces.ts` (`AppServices`), so the mock can be swapped for real HTTP implementations without touching page components.

## **What Ships Today**

* **Mock services** (`services/mock/mockServices.ts`): in-memory state cloned from `seed.ts`, simulated latency, and parity with the real API surface — including the minor DM guard (throws on send) and roster addMember with parent email.
* **Feature pages**: Dashboard, CreateTeam (dedicated page with Other-fallback dropdowns), TeamView (messages / events / team tabs), EventsCalendar, MessagingCenter.
* **Rich messaging**: Text, Giphy GIF picker (trending + search), image picker with a mocked 2-second upload that shows a spinner overlay on the in-chat placeholder, URL auto-rendering, and emoji reactions.
* **Seeded demo data**: two teams, players (two with parent emails to demonstrate the DM restriction), parents/guardians, events with RSVPs, and message history.

## **Swap Path to the Real Backend**

Each service interface maps 1:1 onto the REST endpoints in §6. Replacing the mock means implementing the same `AppServices` shape with Axios calls (auth token via interceptor), wiring the presigned image upload in place of the 2-second sleep, and switching `AuthContext` from the hardcoded `CURRENT_USER_ID` to Cognito session lookup.

