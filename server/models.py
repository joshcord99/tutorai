from pydantic import BaseModel
from typing import List, Optional

class Problem(BaseModel):
    title: str
    description: str
    examples: Optional[str] = None
    constraints: Optional[str] = None
    url: str

class ProblemMeta(BaseModel):
    title: str
    url: str
    tags: List[str]

class Complexity(BaseModel):
    time: str
    space: str
    rationale: str

class HintResponse(BaseModel):
    problem_meta: ProblemMeta
    hints: List[str]
    plan: str
    edge_cases: List[str]
    complexity: Complexity
    solution: Optional[str] = None
    disclaimer: str

class ChatMessage(BaseModel):
    content: str
    problem_context: str
    current_language: Optional[str] = None
    dom_elements: Optional[dict] = None
    timestamp: Optional[str] = None
    user_api_key: Optional[str] = None

class ChatResponse(BaseModel):
    message: str
    timestamp: Optional[str] = None
