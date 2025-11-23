# Top 7 AI Terms Explained Concisely

This document provides concise explanations with PlantUML diagrams for the top 7 AI terms as outlined in the transcript.

## 1. Agentic AI

AI agents reason and act autonomously to achieve goals through perception, reasoning, action, and observation cycles.

```plantuml
@startuml Agentic AI Cycle
!theme plain
skinparam backgroundColor #FFFFFF
skinparam defaultFontSize 12

title Agentic AI Cycle

(*) --> "Perceive Environment"
"Perceive Environment" --> "Reason"
"Reason" --> "Plan Actions"
"Plan Actions" --> "Act"
"Act" --> "Observe Results"
"Observe Results" --> "Perceive Environment"
"Act" --> (*)

note right: Autonomous operation\nthrough cyclical process
@enduml
```

## 2. Large Reasoning Models (LRM)

Specialized LLMs with reasoning-focused fine-tuning that process problems step by step rather than generating immediate responses.

```plantuml
@startuml Reasoning Model
!theme plain
skinparam backgroundColor #FFFFFF
skinparam defaultFontSize 12

title Large Reasoning Model vs Regular LLM

rectangle "Regular LLM" as RLLM {
  [Input] --> [Immediate Response]
}

rectangle "Reasoning Model" as LRM {
  [Input] --> [Step 1]
  [Step 1] --> [Step 2]
  [Step 2] --> [Step 3]
  [Step 3] --> [Final Response]
}

note right of LRM: Step-by-step processing\nInternal chain of thought
@enduml
```

## 3. Vector Database

Converts data into vectors (lists of numbers) that capture semantic meaning, enabling similarity searches as mathematical operations.

```plantuml
@startuml Vector Database
!theme plain
skinparam backgroundColor #FFFFFF
skinparam defaultFontSize 12

title Vector Database

rectangle "Raw Data" as Raw {
  [Image]
  [Text]
  [Audio]
}

Raw --> "Embedding Model"
"Embedding Model" --> "Vector Space"
rectangle "Vector Space" as VS {
  [Vector A]
  [Vector B]
  [Vector C]
}
[Vector A] -right-> [Vector Similarity Search]
[Vector B] -down-> [Vector Similarity Search]
[Vector C] -left-> [Vector Similarity Search]

note right: Semantic meaning\nencoded as numbers
@enduml
```

## 4. Retrieval Augmented Generation (RAG)

Uses vector databases to enrich LLM prompts with relevant external information.

```plantuml
@startuml RAG
!theme plain
skinparam backgroundColor #FFFFFF
skinparam defaultFontSize 12

title RAG System

actor "User" as User
rectangle "Input Query" as Query
database "Vector DB" as VDB
rectangle "LLM" as LLM
rectangle "Enriched Response" as Response

User --> Query : Ask question
Query --> VDB : Convert to vector\nSearch similarity
VDB --> LLM : Return relevant data
Query --> LLM : Original query
LLM --> Response : Generate response\nwith context
@enduml
```

## 5. Model Context Protocol (MCP)

Standardizes how applications provide context to LLMs, enabling standardized access to external tools and data sources.

```plantuml
@startuml MCP
!theme plain
skinparam backgroundColor #FFFFFF
skinparam defaultFontSize 12

title Model Context Protocol

rectangle "LLM" as LLM
rectangle "MCP Server" as MCP
rectangle "External DB" as DB
rectangle "Code Repository" as Repo
rectangle "Email Server" as Email

LLM --> MCP : Standardized connection
MCP --> DB : Connect to systems
MCP --> Repo : Connect to systems
MCP --> Email : Connect to systems

note right: Standardized access\nto external systems
@enduml
```

## 6. Mixture of Experts (MoE)

Divides a large language model into specialized neural subnetworks, activating only those needed for a specific task.

```plantuml
@startuml MoE
!theme plain
skinparam backgroundColor #FFFFFF
skinparam defaultFontSize 12

title Mixture of Experts

rectangle "Input" as Input
rectangle "Routing Mechanism" as Router
rectangle "Expert 1\nSpecialized Subnetwork" as E1
rectangle "Expert 2\nSpecialized Subnetwork" as E2
rectangle "Expert N\nSpecialized Subnetwork" as EN
rectangle "Merge Process" as Merge
rectangle "Output" as Output

Input --> Router
Router --> E1 : Activate relevant experts
Router --> E2 : Activate relevant experts
Router --> EN : Activate relevant experts
E1 --> Merge
E2 --> Merge
EN --> Merge
Merge --> Output

note right: Only needed experts\nactivated for efficiency
@enduml
```

## 7. Artificial Superintelligence (ASI)

Hypothetical AI system with intellectual capabilities beyond human level, potentially capable of recursive self-improvement.

```plantuml
@startuml ASI
!theme plain
skinparam backgroundColor #FFFFFF
skinparam defaultFontSize 12

title ASI vs AGI vs Current AI

rectangle "Current AI" as Current
rectangle "Artificial General Intelligence (AGI)\nSame level as human expert" as AGI
rectangle "Artificial Superintelligence (ASI)\nBeyond human level + self-improvement" as ASI

Current --> AGI : Theoretical advancement
AGI --> ASI : Beyond human level
ASI --> ASI : Self-improvement loop

note right: Theoretical, doesn't exist yet\nPotential for recursive improvement
@enduml
```

## Summary

These seven terms represent key concepts in modern AI development:

- **Agentic AI**: Autonomous systems that reason and act
- **Large Reasoning Models**: LLMs that process step-by-step
- **Vector Databases**: Semantic search using mathematical representations
- **RAG**: Enhancing LLMs with external knowledge
- **MCP**: Standardized access to external systems
- **MoE**: Efficient model scaling through specialized subnetworks
- **ASI**: Hypothetical superhuman-level intelligence

Each concept addresses different challenges in AI development and deployment.