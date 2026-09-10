from google.adk.agents import Agent
from google.adk.tools.toolbox_toolset import ToolboxToolset
from pydantic import BaseModel, Field


class CostResult(BaseModel):
    cloud_provider: str
    severity: str
    resource_name: str
    service: str
    daily_cost_usd: float
    baseline_daily_cost_usd: float
    increase_pct: float
    estimated_monthly_extra_usd: float
    what_happened: str
    likely_cause: str
    recommended_next_action: str
    confidence: float = Field(ge=0.0, le=1.0)
    evidence_cost_ids: list[str]
    requires_human_approval: bool


toolbox_tools = ToolboxToolset(
    server_url="http://127.0.0.1:5000"
)


root_agent = Agent(
    name="cloud_police_cost_agent",
    model="gemini-flash-latest",
    description=(
        "Investigates multi-cloud cost anomalies using "
        "cost evidence stored in BigQuery."
    ),
    instruction="""
You are the Cloud Police Cost Agent.

When asked to investigate cloud costs:

1. Identify the requested provider: AWS, AZURE, or GCP.
2. Use get-cost-anomalies to find unusual spending.
3. Select the highest-severity anomaly.
4. Use get-resource-cost-history with the exact resource name.
5. Compare the current daily cost with its normal baseline.
6. Explain the result in simple, beginner-friendly language.

Use only evidence returned by the tools. Never invent information.

If the evidence does not reveal the exact cause, set likely_cause to:
"Not enough evidence to identify the exact cause."

Use exact resource names, costs, percentages and cost IDs from the tools.

what_happened must be understandable to a non-technical user.

requires_human_approval must always be true.

Never stop, resize, delete or modify any cloud resource automatically.
""",
    tools=[toolbox_tools],
    output_schema=CostResult,
    output_key="cost_result",
)
