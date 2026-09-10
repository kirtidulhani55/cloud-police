<h1 align="center">Cloud Police</h1>

<p align="center">
  <strong>AI-Assisted Multi-Cloud Governance with Human Approval</strong>
</p>

<p align="center">
  Built with Google ADK, Gemini, BigQuery and Cloud Run
</p>

<p align="center">
  <a href="https://cloud-police-website-794315906908.us-east1.run.app">Open Live Application</a>
</p>

---

## Overview

Cloud Police is an AI-assisted operations and governance platform for AWS, Azure and Google Cloud. It brings incidents, cost anomalies, proposed infrastructure changes and supporting evidence into one authenticated review experience.

Gemini-powered Google ADK agents help investigate cases and prepare recommendations. Every high-impact decision remains under verified human control, and Cloud Police never applies infrastructure changes automatically.

## Core Capabilities

- Multi-cloud incident and connectivity monitoring
- Cloud cost-anomaly detection
- Infrastructure-change risk inspection
- Evidence-grounded Gemini diagnosis
- Admin, Approver and Operator role separation
- Approve, reject and request-evidence workflows
- BigQuery decision and evidence history
- Audited Admin reopening of finalized cases

## Multi-Agent System

### Diagnosis Agent

Investigates incident signals, firewall logs and connectivity failures.

### Cost Agent

Identifies unusual cloud spending against available baseline information.

### Change Inspector Agent

Assesses proposed infrastructure changes and their operational risks.

### Remediation Agent

Drafts non-executable Terraform guidance, validation tests and rollback plans.

### Root Orchestrator

Coordinates the four specialist agents and combines their findings into one review packet.

## Architecture

Multi-cloud signals → BigQuery evidence → Scheduled monitoring → Google ADK and Gemini analysis → Authenticated console → Human review and approval

| Google Cloud service | Role in Cloud Police |
| --- | --- |
| BigQuery | Stores telemetry, incidents, evidence and approval history |
| Cloud Run | Hosts the website, protected APIs and monitoring workload |
| Cloud Scheduler | Invokes monitoring on a controlled schedule |
| Vertex AI with Gemini | Generates evidence-grounded diagnoses and recommendations |
| Google ADK | Coordinates the five-agent workflow |
| Identity Platform | Authenticates console users |
| Cloud Build and Artifact Registry | Builds and stores container images |
| IAM and Cloud Logging | Restrict access and provide operational visibility |

## Human Approval Model

| Role | Responsibilities |
| --- | --- |
| Admin | Manages users and roles and can perform an audited reopen of finalized cases |
| Approver | Reviews evidence and can approve, reject or request additional evidence |
| Operator | Investigates incidents and evidence but cannot make approval decisions |

AI agents can detect, explain and recommend, but they cannot execute infrastructure changes or bypass the approval service.

## Demonstrated Scenario

A synthetic Azure connectivity signal was written to BigQuery. Scheduled monitoring detected the case, and Gemini produced a diagnosis connecting firewall, connectivity and Terraform evidence. The incident appeared in the Cloud Police console for human review without automatically changing infrastructure.

## Technology Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, TypeScript, Vite, Node.js and Express |
| Backend | Python, Flask, Gunicorn and REST APIs |
| AI | Google ADK and Gemini through Vertex AI |
| Data and infrastructure | BigQuery, Docker, Cloud Run and Cloud Scheduler |
| Authentication | Google Cloud Identity Platform |

## Repository Structure

```text
backend/   Python APIs, monitoring workflow, agents and automated tests
frontend/  React and TypeScript application
```

## Local Validation

Backend tests:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py" -v
```

Frontend validation:

```powershell
cd frontend
npm install
npm run lint
npm run build
```

## Application Access

The landing page is public. The console and protected APIs require an Identity Platform account with an assigned application role. Controlled reviewer credentials are provided separately to submission evaluators.

## Author

Kirti Dulhani
