from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import Problem, HintResponse, ProblemMeta, Complexity, ChatMessage, ChatResponse
import re
import os
from typing import List
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="TUTORAI API", version="1.0.0")

openai_client = None
openai_client = None
api_key = os.getenv('OPENAI_API_KEY')
if api_key:
    openai_client = OpenAI(api_key=api_key)

def get_openai_client(user_api_key: str = None):
    """Get OpenAI client with either user-provided key or .env key"""
    if user_api_key:
        return OpenAI(api_key=user_api_key)
    elif api_key:
        return OpenAI(api_key=api_key)
    return None

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

def infer_tags(problem: Problem) -> List[str]:
    """Infer problem tags based on content analysis."""
    text = f"{problem.title} {problem.description}".lower()
    tags = []
    
    if any(word in text for word in ['array', 'list', 'sequence']):
        tags.append('array')
    if any(word in text for word in ['string', 'text', 'character']):
        tags.append('string')
    
    if any(word in text for word in ['hash', 'map', 'dictionary', 'key-value']):
        tags.append('hash map')
    if any(word in text for word in ['stack', 'push', 'pop']):
        tags.append('stack')
    if any(word in text for word in ['queue', 'heap', 'priority']):
        tags.append('heap')
    if any(word in text for word in ['tree', 'node', 'binary']):
        tags.append('tree')
    if any(word in text for word in ['graph', 'edge', 'vertex']):
        tags.append('graph')
    
    if any(word in text for word in ['two pointer', 'two-pointer', 'pointer']):
        tags.append('two pointers')
    if any(word in text for word in ['binary search', 'search']):
        tags.append('binary search')
    if any(word in text for word in ['bfs', 'breadth', 'level']):
        tags.append('BFS')
    if any(word in text for word in ['dfs', 'depth', 'recursion']):
        tags.append('DFS')
    if any(word in text for word in ['dynamic programming', 'dp', 'memoization']):
        tags.append('dynamic programming')
    if any(word in text for word in ['greedy', 'optimal']):
        tags.append('greedy')
    if any(word in text for word in ['math', 'mathematical', 'number']):
        tags.append('math')
    
    if not tags:
        tags = ['array', 'string']
    
    return tags[:5]

def generate_hints(problem: Problem, tags: List[str], client: OpenAI = None) -> List[str]:
    """Generate AI-powered hints based on problem analysis."""
    if not client:
        return ["AI hints not available - using fallback hints"]
    
    try:
        prompt = f"""Write 4-5 helpful hints for this coding problem.

Problem: {problem.title}
Description: {problem.description}
Tags: {', '.join(tags)}

Rules:
- Start with a general hint, then get more specific
- Don't give away the complete solution
- Mention useful data structures or algorithms
- Keep each hint short and clear

Write one hint per line."""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful programming tutor. Provide progressive hints that guide students toward solutions without giving away the complete answer."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=200,
            temperature=0.7
        )
        
        ai_hints = response.choices[0].message.content.strip().split('\n')
        return [hint.strip() for hint in ai_hints if hint.strip()][:5]
    
    except Exception as e:
        return ["AI hints not available - using fallback hints"]

def generate_plan(problem: Problem, tags: List[str], client: OpenAI = None) -> str:
    """Generate AI-powered step-by-step plan."""
    if not client:
        return "AI plan not available - using fallback plan"
    
    try:
        prompt = f"""Write a step-by-step plan to solve this coding problem.

Problem: {problem.title}
Description: {problem.description}
Tags: {', '.join(tags)}

Requirements:
- Break the solution into clear numbered steps
- Mention which data structures or algorithms to use
- Focus on the main solution approach and implementation steps
- Use simple, clear language

IMPORTANT: Write in plain text only. No HTML, no markdown, no special formatting.
Use numbered lists (1. 2. 3.) and simple headers.
DO NOT include edge cases - those belong in a separate section."""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful programming tutor. Create clear, educational step-by-step plans for solving coding problems. IMPORTANT: Always return plain text only - no HTML, no markdown, no special formatting."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=250,
            temperature=0.7
        )
        
        return response.choices[0].message.content.strip()
    
    except Exception as e:
        return "AI plan not available - using fallback plan"

def generate_edge_cases(problem: Problem, client: OpenAI = None) -> List[str]:
    """Generate AI-powered edge cases."""
    if not client:
        return ["AI edge cases not available - using fallback edge cases"]
    
    try:
        prompt = f"""Write 4-5 edge cases for this coding problem.

Problem: {problem.title}
Description: {problem.description}

Requirements:
- Write edge cases specific to this problem
- Include boundary conditions (empty input, single element, etc.)
- Include common failure scenarios
- Keep each edge case short and clear

Write one edge case per line."""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful programming tutor. Generate specific edge cases that help students think about boundary conditions and testing."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=200,
            temperature=0.7
        )
        
        ai_edge_cases = response.choices[0].message.content.strip().split('\n')
        return [edge.strip() for edge in ai_edge_cases if edge.strip()][:5]
    
    except Exception as e:
        return ["AI edge cases not available - using fallback edge cases"]

def analyze_complexity(problem: Problem, tags: List[str], client: OpenAI = None) -> Complexity:
    """Analyze AI-powered time and space complexity."""
    if not client:
        return Complexity(
            time="AI analysis not available",
            space="AI analysis not available",
            rationale="Complexity analysis not available when AI is not configured."
        )
    
    try:
        prompt = f"""Analyze the time and space complexity for this coding problem.

Problem: {problem.title}
Description: {problem.description}
Tags: {', '.join(tags)}

Write:
1. Time complexity with brief explanation
2. Space complexity with brief explanation
3. Simple explanation of why these complexities make sense

Format exactly as:
Time: [complexity] - [explanation]
Space: [complexity] - [explanation]
Rationale: [explanation]"""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful programming tutor. Provide accurate complexity analysis with clear explanations."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=250,
            temperature=0.7
        )
        
        content = response.choices[0].message.content.strip()
        
        lines = content.split('\n')
        time_complexity = "O(n) - AI analysis available"
        space_complexity = "O(n) - AI analysis available"
        rationale = "AI-generated complexity analysis"
        
        for line in lines:
            if line.startswith("Time:"):
                time_complexity = line.replace("Time:", "").strip()
            elif line.startswith("Space:"):
                space_complexity = line.replace("Space:", "").strip()
            elif line.startswith("Rationale:"):
                rationale = line.replace("Rationale:", "").strip()
        
        return Complexity(
            time=time_complexity,
            space=space_complexity,
            rationale=rationale
        )
    
    except Exception as e:
        return Complexity(
            time="AI analysis not available",
            space="AI analysis not available",
            rationale="Complexity analysis not available due to AI error."
        )

def generate_solution(problem: Problem, tags: List[str], client: OpenAI = None) -> str:
    """Generate AI-powered sample solution."""
    if not client:
        return "AI solution not available - using fallback solution"
    
    try:
        prompt = f"""Write a complete solution for this coding problem.

Problem: {problem.title}
Description: {problem.description}
Tags: {', '.join(tags)}

Requirements:
- Write a working Python solution
- Use clear variable names and add comments
- Handle edge cases properly
- Follow good coding practices

IMPORTANT: Write in plain text only. No HTML, no markdown, no special formatting.
Use simple headers and indented code."""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful programming tutor. Provide complete, working solutions with clear explanations and good coding practices. IMPORTANT: Always return plain text only - no HTML, no markdown, no special formatting."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        return response.choices[0].message.content.strip()
    
    except Exception as e:
        return "AI solution not available due to error."

def generate_solution_in_language(problem: Problem, tags: List[str], language: str, client: OpenAI = None) -> str:
    """Generate AI-powered sample solution in specific language."""
    if not client:
        return "AI solution not available - using fallback solution"
    
    try:
        language_map = {
            "python": "Python",
            "python3": "Python 3",
            "javascript": "JavaScript",
            "typescript": "TypeScript",
            "java": "Java",
            "cpp": "C++",
            "c": "C",
            "csharp": "C#",
            "php": "PHP",
            "swift": "Swift",
            "kotlin": "Kotlin",
            "dart": "Dart",
            "go": "Go",
            "ruby": "Ruby",
            "scala": "Scala",
            "rust": "Rust",
            "racket": "Racket",
            "erlang": "Erlang",
            "elixir": "Elixir"
        }
        
        language_name = language_map.get(language.lower(), language)
        
        prompt = f"""Write a complete solution for this coding problem in {language_name}.

Problem: {problem.title}
Description: {problem.description}
Tags: {', '.join(tags)}

Requirements:
- Write a working {language_name} solution
- Use clear variable names and add comments
- Handle edge cases properly
- Follow good coding practices for {language_name}
- Include proper syntax and language-specific conventions

IMPORTANT: Write in plain text only. No HTML, no markdown, no special formatting.
Use simple headers and indented code."""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": f"You are a helpful programming tutor. Provide complete, working {language_name} solutions with clear explanations and good coding practices. IMPORTANT: Always return plain text only - no HTML, no markdown, no special formatting."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        return response.choices[0].message.content.strip()
    
    except Exception as e:
        return f"AI solution not available due to error: {str(e)}"



@app.post("/hints", response_model=HintResponse)
async def get_hints(problem: Problem, user_api_key: str = None):
    """Generate AI-powered hints and guidance for a coding problem."""
    try:
        tags = infer_tags(problem)
        
        client = get_openai_client(user_api_key)
        
        hints = generate_hints(problem, tags, client)
        plan = generate_plan(problem, tags, client)
        edge_cases = generate_edge_cases(problem, client)
        complexity = analyze_complexity(problem, tags, client)
        solution = generate_solution(problem, tags, client)
        
        return HintResponse(
            problem_meta=ProblemMeta(
                title=problem.title,
                url=problem.url,
                tags=tags
            ),
            hints=hints,
            plan=plan,
            edge_cases=edge_cases,
            complexity=complexity,
            solution=solution,
            disclaimer="This guidance is for personal educational use only. Not affiliated with LeetCode."
        )
    except Exception as e:
        try:
            tags = infer_tags(problem)
            fallback_hints = ["Consider the problem step by step", "Think about the data structures you might need", "Start with a simple approach"]
            fallback_plan = "1. Understand the problem\n2. Choose appropriate data structures\n3. Implement the solution\n4. Test with edge cases"
            fallback_edge_cases = ["Empty input", "Single element", "Large input", "Negative numbers"]
            fallback_complexity = Complexity(
                time="O(n) - typically linear time",
                space="O(n) - typically linear space",
                rationale="Most problems require at least one pass through the data."
            )
            
            return HintResponse(
                problem_meta=ProblemMeta(
                    title=problem.title,
                    url=problem.url,
                    tags=tags
                ),
                hints=fallback_hints,
                plan=fallback_plan,
                edge_cases=fallback_edge_cases,
                complexity=fallback_complexity,
                solution="",
                disclaimer="This guidance is for personal educational use only. Not affiliated with LeetCode."
            )
        except Exception:
            raise HTTPException(status_code=500, detail=f"Failed to generate hints: {str(e)}")

@app.post("/chat", response_model=ChatResponse)
async def chat_with_ai(message: ChatMessage):
    """Chat with AI for problem-solving guidance."""
    user_api_key = getattr(message, 'user_api_key', None)
    client = get_openai_client(user_api_key)
    if not client:
        raise HTTPException(status_code=503, detail="OpenAI API not available")
    
    try:
        current_language = getattr(message, 'current_language', 'python')
        
        system_prompt = f"""You are a helpful programming tutor specializing in {current_language}. Your job is to:

1. Guide students through problem-solving in {current_language}
2. Give hints without giving away complete solutions
3. Ask questions to understand their approach
4. Help them think step by step
5. Point out useful patterns and concepts specific to {current_language}
6. Only give code snippets if specifically asked, and ALWAYS use {current_language} syntax
7. NEVER provide code examples in other languages - only {current_language}

CRITICAL: Always respond with guidance and code examples in {current_language} only. If the student is working in {current_language}, do not show them solutions in other languages.

Goal: Help students learn {current_language}, don't solve for them."""
        
        dom_context = ""
        if message.dom_elements:
            dom_context = f"""
DOM Context:
- Title: {message.dom_elements.get('title', 'Not available')}
- Description: {message.dom_elements.get('description', 'Not available')}
- Examples: {message.dom_elements.get('examples', 'Not available')}
- Constraints: {message.dom_elements.get('constraints', 'Not available')}
- Code Editor Content: {message.dom_elements.get('codeEditor', 'Not available')}
- Test Cases: {message.dom_elements.get('testCases', 'Not available')}
"""
        
        user_prompt = f"""Problem Context: {message.problem_context}{dom_context}
Current Language: {current_language}

Student's Question: {message.content}

IMPORTANT: The student is working in {current_language}. Provide ALL guidance and code examples in {current_language} only.

Give helpful guidance that:
1. References the problem details when relevant
2. Points toward the solution without giving it away
3. References their code if they share it
4. Gives specific, actionable advice for {current_language}
5. Provides guidance specific to {current_language} syntax and conventions
6. If providing code examples, use ONLY {current_language} syntax

Remember: The student is coding in {current_language}, so all examples and guidance must be in {current_language}."""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=400,
            temperature=0.7
        )
        
        ai_response = response.choices[0].message.content.strip()
        
        return ChatResponse(
            message=ai_response,
            timestamp=message.timestamp
        )
    
    except Exception as e:
        print(f"OpenAI chat error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate chat response: {str(e)}")

@app.post("/solution")
async def get_solution(request: dict):
    """Generate AI-powered solution in specific language."""
    problem = Problem(**request.get("problem", {}))
    language = request.get("language", "python")
    user_api_key = request.get("user_api_key")
    
    client = get_openai_client(user_api_key)
    if not client:
        raise HTTPException(status_code=503, detail="OpenAI API not available")
    
    try:
        tags = infer_tags(problem)
        solution = generate_solution_in_language(problem, tags, language, client)
        
        return {"solution": solution}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate solution: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "TUTORAI API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5050)
