\# Cloud Police



\### AI-Assisted Multi-Cloud Governance with Human Approval



Cloud Police detects operational risks across AWS, Azure and Google Cloud. It uses Google ADK and Gemini to connect supporting evidence and prepare recommendations for verified human review.



\[Open the Live Cloud Police Application](https://cloud-police-website-794315906908.us-east1.run.app)



\## What Cloud Police Does



\- Monitors multi-cloud incidents, cost anomalies and proposed changes

\- Generates evidence-grounded diagnoses using Gemini

\- Coordinates five specialized agents through Google ADK

\- Separates Admin, Approver and Operator permissions

\- Supports approval, rejection and additional-evidence requests

\- Records decisions, reviewer identity and timestamps in BigQuery

\- Prevents AI from automatically applying infrastructure changes



\## AI Agents



1\. Diagnosis Agent — investigates incidents, firewall logs and connectivity failures.

2\. Cost Agent — identifies unusual cloud spending.

3\. Change Inspector Agent — assesses proposed infrastructure changes.

4\. Remediation Agent — drafts non-executable Terraform plans, tests and rollback guidance.

5\. Root Orchestrator — coordinates the specialist agents and combines their findings.



\## Architecture



Multi-cloud signals → BigQuery evidence → Scheduled Cloud Run monitoring → Google ADK and Gemini analysis → Authenticated console → Human review and approval



\## Google Cloud Services



| Service | Purpose |

|---|---|

| BigQuery | Stores telemetry, incidents, evidence and decision history |

| Cloud Run | Hosts the website, APIs and monitoring workload |

| Cloud Scheduler | Invokes scheduled monitoring |

| Vertex AI with Gemini | Generates diagnoses and recommendations |

| Google ADK | Coordinates the five-agent system |

| Identity Platform | Authenticates console users |

| Cloud Build and Artifact Registry | Builds and stores container images |

| IAM and Cloud Logging | Controls access and provides operational visibility |



\## Technology Stack



| Layer | Technologies |

|---|---|

| Backend | Python, Flask, Gunicorn and REST APIs |

| Frontend | React, TypeScript, Vite, Node.js and Express |

| AI | Google ADK and Gemini through Vertex AI |

| Infrastructure | Docker, Cloud Run, BigQuery and Cloud Scheduler |

| Authentication | Google Cloud Identity Platform |



\## Safety Model



Cloud Police follows a human-in-the-loop governance model. AI agents can detect, explain and recommend, but cannot execute infrastructure changes.



Approvers can approve, reject or request additional evidence. Operators cannot make approval decisions. Only an Admin can reopen a finalized case, and every reopening action is recorded.



\## Demonstrated Scenario



A synthetic Azure connectivity signal was written to BigQuery. Scheduled monitoring detected the case, and Gemini generated a diagnosis connecting firewall, connectivity and Terraform evidence. The incident appeared in the console for human review without automatically changing infrastructure.



\## Repository Structure



```text

backend/   Python APIs, monitoring workflow, agents and automated tests

frontend/  React and TypeScript application

```



\## Local Validation



Backend tests:



```powershell

cd backend

py -m venv .venv

.\\.venv\\Scripts\\python.exe -m pip install -r requirements.txt

.\\.venv\\Scripts\\python.exe -m unittest discover -s tests -p "test\_\*.py" -v

```



Frontend validation:



```powershell

cd frontend

npm install

npm run lint

npm run build

```



\## Application Access



The landing page is publicly accessible. The protected console and APIs require an Identity Platform account with an assigned application role. Controlled reviewer credentials are provided separately to submission evaluators.



\## Author



Kirti Dulhani

