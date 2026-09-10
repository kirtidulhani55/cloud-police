\# Cloud Police



Cloud Police is an AI-assisted multi-cloud operations and governance platform built with Google Cloud, Gemini and Google Agent Development Kit (ADK). It detects operational risks across AWS, Azure and Google Cloud, connects supporting evidence and presents recommendations for verified human review.



\## Live Application



https://cloud-police-website-794315906908.us-east1.run.app



\## Key Features



\* Multi-cloud incident, cost and infrastructure-change monitoring

\* Gemini-generated, evidence-grounded diagnoses

\* Five-agent Google ADK architecture

\* Admin, Approver and Operator role separation

\* Approve, reject and request-evidence workflows

\* Audited Admin reopening of finalized cases

\* BigQuery evidence and decision history

\* No automatic infrastructure changes



\## AI Agents



1\. \*\*Diagnosis Agent\*\* investigates incidents, firewall logs and connectivity failures.

2\. \*\*Cost Agent\*\* identifies cloud-spending anomalies.

3\. \*\*Change Inspector Agent\*\* assesses proposed infrastructure changes.

4\. \*\*Remediation Agent\*\* drafts non-executable Terraform plans, tests and rollback guidance.

5\. \*\*Root Orchestrator\*\* coordinates the specialist agents and combines their findings.



\## Architecture Flow



Multi-cloud signals → BigQuery evidence → Scheduled Cloud Run monitoring → Google ADK and Gemini analysis → Authenticated Cloud Police console → Human review and approval



\## Google Cloud Services



\* BigQuery

\* Cloud Run

\* Cloud Scheduler

\* Vertex AI with Gemini

\* Google Agent Development Kit

\* Identity Platform

\* Cloud Build

\* Artifact Registry

\* IAM

\* Cloud Logging



\## Technology Stack



\* \*\*Backend:\*\* Python, Flask, Gunicorn and REST APIs

\* \*\*Frontend:\*\* React, TypeScript, Vite, Node.js and Express

\* \*\*AI:\*\* Google ADK and Gemini through Vertex AI

\* \*\*Infrastructure:\*\* Docker, Cloud Run, BigQuery and Cloud Scheduler

\* \*\*Authentication:\*\* Google Cloud Identity Platform



\## Safety Model



Cloud Police uses a human-in-the-loop governance model. AI agents can detect, explain and recommend, but cannot execute infrastructure changes. Approvers can approve, reject or request additional evidence. Operators cannot make approval decisions. Only an Admin can reopen a finalized case, and the action is recorded.



\## Demonstrated Scenario



A synthetic Azure connectivity signal was written to BigQuery. Scheduled monitoring detected the case, and Gemini generated a diagnosis linking firewall, connectivity and Terraform evidence. The incident appeared in the console for human review without automatically changing infrastructure.



\## Repository Structure



\* `backend/` — Python APIs, monitoring workflow, agents and automated tests

\* `frontend/` — React and TypeScript website



\## Local Validation



Backend:



```powershell

cd backend

py -m venv .venv

.\\.venv\\Scripts\\python.exe -m pip install -r requirements.txt

.\\.venv\\Scripts\\python.exe -m unittest discover -s tests -p "test\_\*.py" -v

```



Frontend:



```powershell

cd frontend

npm install

npm run lint

npm run build

```



\## Access



The landing page is publicly accessible. The protected console and APIs require an Identity Platform account and an assigned application role. Controlled reviewer credentials are supplied separately to submission evaluators.



\## Author



Kirti Dulhani



