# Understanding Multi-Agent Systems: A Visual Guide

This document provides a visual explanation of multi-agent systems, based on the concepts discussed in the transcript. It covers what multi-agent systems are, common architectures, and communication patterns.

## Single Agent vs. Multi-Agent Systems

### Single Agent System
A single agent system consists of an LLM that calls multiple tools. While great for getting started, it can have some downsides as complexity increases.

```plantuml
@startuml Single Agent System
!theme plain
skinparam backgroundColor #FFFFFF
skinparam defaultFontSize 14
skinparam packageStyle rectangle

title Single Agent System

actor "User" as User
rectangle "LLM Agent" as Agent
rectangle "Tool 1" as Tool1
rectangle "Tool 2" as Tool2
rectangle "Tool 3" as Tool3
rectangle "Tool N" as ToolN
rectangle "Output" as Output

User --> Agent : Query
Agent --> Tool1 : Tool Call
Agent --> Tool2 : Tool Call
Agent --> Tool3 : Tool Call
Agent --> ToolN : Tool Call
Tool1 --> Agent
Tool2 --> Agent
Tool3 --> Agent
ToolN --> Agent
Agent --> Output : Response

note right of Agent : Agent decides which tool\nto call next\n(max 5-10 tools recommended)
note right of ToolN : Too many tools can\nlead to poor decisions
@enduml
```

### Issues with Single Agent Systems
- **Too many tools**: Around 5-10 tools is the sweet spot; more can lead to poor decisions
- **Complex context**: Growing context can overwhelm the LLM
- **Lack of specialization**: All capabilities need to be in one agent

## Multi-Agent Systems Benefits

Multi-agent systems address the limitations of single agent systems by distributing responsibilities across multiple specialized agents.

```plantuml
@startuml Multi-Agent Benefits
!theme plain
skinparam backgroundColor #FFFFFF
skinparam defaultFontSize 14
skinparam packageStyle rectangle

title Benefits of Multi-Agent Systems

rectangle "Modular Architecture" as Modularity
rectangle "Specialized Agents" as Specialization
rectangle "Controlled Communication" as Control

note top of Modularity : Easier to develop,\ntest, and maintain
note top of Specialization : Expert agents focused\non particular domains
note top of Control : Explicit control of\ncommunication patterns

@enduml
```

## Common Multi-Agent Architectures

### 1. Network of Agents
Agents communicate with each other by deciding who goes next. Frameworks like swarm and crewAI are known for this architecture.

```plantuml
@startuml Network of Agents
!theme plain
skinparam backgroundColor #FFFFFF
skinparam defaultFontSize 14
skinparam packageStyle rectangle

title Network of Agents Architecture

rectangle "Agent A" as AgentA
rectangle "Agent B" as AgentB
rectangle "Agent C" as AgentC
rectangle "Agent D" as AgentD

AgentA --> AgentB : Decide & Route
AgentA --> AgentC : Decide & Route
AgentB --> AgentC : Decide & Route
AgentB --> AgentD : Decide & Route
AgentC --> AgentD : Decide & Route
AgentC --> AgentA : Decide & Route

note top : Each agent has its own\nindividual tools and\ncan route to any other agent

note right of AgentA : Individual\nTools
note right of AgentB : Individual\nTools
note right of AgentC : Individual\nTools
note right of AgentD : Individual\nTools

@enduml
```

> **Note**: This architecture can be unreliable, costly, and lacks good control due to loose communication patterns.

### 2. Supervisor Agent Architecture
One agent is responsible for routing to other agents. Sub-agents focus solely on their tasks.

```plantuml
@startuml Supervisor Agent
!theme plain
skinparam backgroundColor #FFFFFF
skinparam defaultFontSize 14
skinparam packageStyle rectangle

title Supervisor Agent Architecture

rectangle "Supervisor Agent" as Supervisor
rectangle "Sub-Agent 1\n(Planner)" as Sub1
rectangle "Sub-Agent 2\n(Researcher)" as Sub2
rectangle "Sub-Agent 3\n(Math Expert)" as Sub3
rectangle "Sub-Agent N\n(Coder)" as SubN
actor "User" as User
rectangle "Output" as Output

User --> Supervisor : Query
Supervisor --> Sub1 : Route
Supervisor --> Sub2 : Route
Supervisor --> Sub3 : Route
Supervisor --> SubN : Route
Sub1 --> Supervisor : Response
Sub2 --> Supervisor : Response
Sub3 --> Supervisor : Response
SubN --> Supervisor : Response
Supervisor --> Output : Final Response

note right of Supervisor : Decides which sub-agent\nto call next
note right of Sub1 : Focuses only\non planning
note right of Sub2 : Focuses only\non research
note right of Sub3 : Focuses only\non math
note right of SubN : Focuses only\non coding

@enduml
```

### 3. Supervisor with Tools Architecture
Sub-agents are treated as tools for a central LLM. Communication happens only through tool parameters.

```plantuml
@startuml Supervisor with Tools
!theme plain
skinparam backgroundColor #FFFFFF
skinparam defaultFontSize 14
skinparam packageStyle rectangle

title Supervisor with Tools Architecture

rectangle "Central LLM" as Central
rectangle "Agent 1 as\nTool" as Tool1
rectangle "Agent 2 as\nTool" as Tool2
rectangle "Agent 3 as\nTool" as Tool3
actor "User" as User
rectangle "Output" as Output

User --> Central : Query
Central --> Tool1 : Tool Call\n(parameters)
Central --> Tool2 : Tool Call\n(parameters)
Central --> Tool3 : Tool Call\n(parameters)
Tool1 --> Central : Tool Response
Tool2 --> Central : Tool Response
Tool3 --> Central : Tool Response
Central --> Output : Final Response

note right of Central : Treats sub-agents\nas tools, only passes\ntool call parameters
note right of Tool1 : Receives only\nparameters from\ntool call
note right of Tool2 : Processes parameters\nand returns response
note right of Tool3 : No shared state\nbeyond tool params
@enduml
```

### 4. Hierarchical Architecture
Layering supervisor agents where sub-agents themselves can be supervisors.

```plantuml
@startuml Hierarchical Architecture
!theme plain
skinparam backgroundColor #FFFFFF
skinparam defaultFontSize 14
skinparam packageStyle rectangle

title Hierarchical Architecture

rectangle "Top-Level\nSupervisor" as TopSupervisor
rectangle "Mid-Level\nSupervisor" as MidSupervisor
rectangle "Specialized\nAgents" as Specialized

rectangle "Sub-Team 1\nPlanning" as Team1
rectangle "Sub-Team 2\nResearch" as Team2
rectangle "Sub-Team 3\nDevelopment" as Team3

TopSupervisor --> MidSupervisor : Route
TopSupervisor --> Specialized : Route
MidSupervisor --> Team1 : Route
MidSupervisor --> Team2 : Route
MidSupervisor --> Team3 : Route

Team1 --> MidSupervisor : Response
Team2 --> MidSupervisor : Response
Team3 --> MidSupervisor : Response
Specialized --> TopSupervisor : Response
MidSupervisor --> TopSupervisor : Response

note top of TopSupervisor : Top-level routing
note top of MidSupervisor : Team-level routing
note top of Team1 : Specialized\nsub-teams
@enduml
```

### 5. Custom Cognitive Architecture
Most common in production: custom architectures that borrow aspects of other approaches.

```plantuml
@startuml Custom Cognitive Architecture
!theme plain
skinparam backgroundColor #FFFFFF
skinparam defaultFontSize 14
skinparam packageStyle rectangle

title Custom Cognitive Architecture

rectangle "Custom\nOrchestrator" as Orchestrator
rectangle "Domain Expert\nAgent 1" as DE1
rectangle "Domain Expert\nAgent 2" as DE2
rectangle "Domain Expert\nAgent 3" as DE3
rectangle "Domain Expert\nAgent N" as DEN

rectangle "Specialized\nTools 1" as ST1
rectangle "Specialized\nTools 2" as ST2
rectangle "Specialized\nTools 3" as ST3
rectangle "Specialized\nTools N" as STN

actor "User" as User
rectangle "Output" as Output

User --> Orchestrator : Query
Orchestrator --> DE1 : Route
Orchestrator --> DE2 : Route
Orchestrator --> DE3 : Route
Orchestrator --> DEN : Route

DE1 --> ST1 : Use
DE2 --> ST2 : Use
DE3 --> ST3 : Use
DEN --> STN : Use

ST1 --> DE1 : Response
ST2 --> DE2 : Response
ST3 --> DE3 : Response
STN --> DEN : Response

DE1 --> Orchestrator : Response
DE2 --> Orchestrator : Response
DE3 --> Orchestrator : Response
DEN --> Orchestrator : Response

Orchestrator --> Output : Final Response

note right of Orchestrator : Custom logic tailored\nto specific domain needs
@enduml
```

## Communication Patterns in Multi-Agent Systems

### 1. Shared State Communication
Agents communicate by sharing a common state object.

```plantuml
@startuml Shared State Communication
!theme plain
skinparam backgroundColor #FFFFFF
skinparam defaultFontSize 14
skinparam packageStyle rectangle

title Shared State Communication

rectangle "Agent 1" as Agent1
rectangle "Agent 2" as Agent2
rectangle "Shared State" as SharedState {
  rectangle "Messages\n[ ]" as Messages
  rectangle "Artifacts\n{ }" as Artifacts
  rectangle "Other Keys\n{ }" as OtherKeys
}

Agent1 --> SharedState : Write to state
Agent2 --> SharedState : Read from state
SharedState --> Agent1 : Update from state
SharedState --> Agent2 : Update from state

note right of Agent1 : Writes to shared\nstate
note right of Agent2 : Reads from shared\nstate
note bottom of SharedState : All agents can\naccess same state\nobject
@enduml
```

### 2. Tool-Call Communication
Agents communicate only through tool call parameters.

```plantuml
@startuml Tool-Call Communication
!theme plain
skinparam backgroundColor #FFFFFF
skinparam defaultFontSize 14
skinparam packageStyle rectangle

title Tool-Call Communication

rectangle "Agent 1" as Agent1
rectangle "Agent 2\n(As Tool)" as Agent2

Agent1 --> Agent2 : Tool Call\n(parameters)
Agent2 --> Agent1 : Tool Response

note top of Agent1 : Generates tool call\nwith specific params
note top of Agent2 : Receives only the\nparameters from tool\ncall, processes, returns\nresponse
@enduml
```

### 3. Different States Communication
Agents with different internal states can still communicate through shared keys.

```plantuml
@startuml Different States Communication
!theme plain
skinparam backgroundColor #FFFFFF
skinparam defaultFontSize 14
skinparam packageStyle rectangle

title Communication with Different States

rectangle "Agent 1 State" as State1 {
  rectangle "fu: value" as Fu
  rectangle "bar: value" as Bar
  rectangle "baz: value" as Baz
  rectangle "foar: unset" as Foar1
}

rectangle "Agent 2 State" as State2 {
  rectangle "foar: value" as Foar2
  rectangle "abc: value" as Abc
  rectangle "xyz: value" as Xyz
  rectangle "fubar: unset" as Fubar1
}

rectangle "Final State" as Final {
  rectangle "fu: value" as FuFinal
  rectangle "bar: value" as BarFinal
  rectangle "baz: value" as BazFinal
  rectangle "foar: value" as FoarFinal
  rectangle "fubar: value" as FubarFinal
}

State1 --> State2 : Agent 1 reads 'fu',\nAgent 2 reads 'foar'
State2 --> Final : Agent 2 writes 'fubar',\nbecomes available to Agent 1

note top of State1 : Agent 1 has internal\nkeys (fu, bar, baz)\nand shared key (foar)
note top of State2 : Agent 2 has internal\nkeys (abc, xyz)\nand shared keys (foar, fubar)
@enduml
```

### 4. Message List Communication Patterns
Different strategies for handling messages between agents.

```plantuml
@startuml Message Communication
!theme plain
skinparam backgroundColor #FFFFFF
skinparam defaultFontSize 14
skinparam packageStyle rectangle

package "Communication Strategy 1: Full Messages" as Strategy1 {
  rectangle "Agent 1" as A1S1
  rectangle "Shared Message List" as SMLS1
  rectangle "Agent 2" as A2S1
  
  A1S1 --> SMLS1 : Add tool calls\nand final response
  A2S1 --> SMLS1 : Add tool calls\nand final response
  SMLS1 --> A1S1 : Read all messages
  SMLS1 --> A2S1 : Read all messages
  
  note bottom of SMLS1 : Grows large with\nall tool calls and\nresponses
}

package "Communication Strategy 2: Final Responses Only" as Strategy2 {
  rectangle "Agent 1" as A1S2
  rectangle "Shared Message List" as SMLS2
  rectangle "Agent 2" as A2S2
  rectangle "Internal Tool Call\nTracking" as ITCT2
  
  A1S2 --> SMLS2 : Add only\nfinal response
  A2S2 --> SMLS2 : Add only\nfinal response
  A2S2 --> ITCT2 : Track internal\ntool calls separately
  SMLS2 --> A1S2 : Read final\nresponses only
  SMLS2 --> A2S2 : Read final\nresponses only
  
  note bottom of SMLS2 : Only final responses\non shared list
  note bottom of ITCT2 : Internal calls\nseparately tracked
}

note top of Strategy1 : All messages\nincluding tool calls\nin shared list
note top of Strategy2 : Only final\nresponses in shared list\nInternal calls tracked\nseparately
@enduml
```

## Choosing the Right Architecture

Based on the transcript, the most common architecture seen in production is custom cognitive architectures. While it's valuable to understand supervisor and hierarchical systems, it's best to consider what system works best for your specific domain and build that using common techniques.

```plantuml
@startuml Architecture Choice
!theme plain
skinparam backgroundColor #FFFFFF
skinparam defaultFontSize 14
skinparam packageStyle rectangle

title Multi-Agent Architecture Selection

rectangle "Understand Domain Requirements" as Requirement
rectangle "Analyze Complexity Needs" as Complexity
rectangle "Consider Agent Specialization" as Specialization
rectangle "Select Communication Pattern" as Communication
rectangle "Build Custom Architecture" as Custom
rectangle "Test and Iterate" as Iteration

Requirement --> Complexity
Complexity --> Specialization
Specialization --> Communication
Communication --> Custom
Custom --> Iteration

note right of Requirement : What does your\nspecific domain need?
note right of Complexity : How complex\nare the tasks?
note right of Specialization : What expertise\nis required?
note right of Communication : How should agents\ncommunicate?
note right of Custom : Build tailored\nsolution
note right of Iteration : Refine based\non performance
@enduml
```

## Summary

Multi-agent systems represent a powerful evolution from single agent architectures. They address issues like:

- Tool overload in single agents
- Complex context management
- Need for specialized expertise

Key architectures include:
- Network of agents (less recommended for production)
- Supervisor agents (more manageable)
- Supervisor with tools (simpler but with communication limitations)
- Hierarchical systems (for complex organizations)
- Custom cognitive architectures (most common in production)

The communication approach you choose (shared state vs. tool call parameters) will impact how your agents interact and share information. For production systems, custom architectures that leverage these concepts but are tailored to specific domains tend to be most effective.