from google.adk.agents import Agent, SequentialAgent

from diagnosis_agent.agent import root_agent as diagnosis_agent
from remediation_agent.agent import root_agent as remediation_agent
from cost_agent.agent import root_agent as cost_agent
from change_inspector_agent.agent import (
    root_agent as change_inspector_agent,
)


network_workflow = SequentialAgent(
    name="network_incident_workflow",
    description=(
        "Investigates cloud network and connectivity incidents, "
        "then prepares a safe remediation proposal requiring human approval."
    ),
    sub_agents=[
        diagnosis_agent,
        remediation_agent,
    ],
)


root_agent = Agent(
    name="cloud_police_root_agent",
    model="gemini-flash-latest",
    description=(
        "Coordinates Cloud Police investigations for network incidents, "
        "cloud cost anomalies and proposed infrastructure changes."
    ),
    instruction="""
You are the Cloud Police Root Agent.

Your job is to understand the user's request and send it to the correct workflow.

Routing rules:

1. For connectivity, firewall, blocked-port, network or outage investigations,
   delegate to network_incident_workflow.

2. For cloud spending, billing, unusual cost or cost-anomaly investigations,
   delegate to cloud_police_cost_agent.

3. For proposed Terraform changes, infrastructure change reviews,
   pre-deployment safety checks or predicted change risks,
   delegate to cloud_police_cloud_inspector_agent.

4. If the request is unclear, ask whether the user wants to investigate:
   - a network incident,
   - a cost anomaly, or
   - a proposed infrastructure change.

Do not invent evidence.
Do not apply Terraform changes.
Do not approve or reject proposed changes.
Do not modify, stop, resize or delete cloud resources.
All remediation and infrastructure-change proposals require human approval.
""",
    sub_agents=[
        network_workflow,
        cost_agent,
        change_inspector_agent,
    ],
)
