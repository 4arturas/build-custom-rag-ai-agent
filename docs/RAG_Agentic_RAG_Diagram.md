# Understanding RAG and Agentic RAG: A Visual Guide

https://www.youtube.com/watch?v=0z9_MhcYvcY

This document provides a visual explanation of Retrieval-Augmented Generation (RAG) and its evolution to Agentic RAG, based on the concepts discussed in the transcript.

## Traditional RAG Pipeline

Traditional RAG enhances responses from a large language model by incorporating relevant data retrieved from a vector database, adding it as context to the prompt, and sending it to the LLM for generation.

```plantuml
@startuml Traditional RAG
!theme plain
skinparam backgroundColor #FFFFFF
skinparam defaultFontSize 14
skinparam packageStyle rectangle

title Traditional RAG Pipeline

actor "User/Application" as User
rectangle "Query" as Query
rectangle "Prompt" as Prompt
database "Vector Database" as VectorDB
rectangle "LLM" as LLM
rectangle "Output" as Output

User --> Query : sends\nquery
Query --> Prompt : interpolates\ninto
Query --> VectorDB : query\nvector\ndatabase
VectorDB --> Prompt : returns\nrelevant\ndata
Prompt --> LLM : sends\nwith context
LLM --> Output : generates\nresponse

note right of VectorDB : Contains relevant\ndata
note right of LLM : Used only for\nresponse generation
@enduml
```

## Agentic RAG Pipeline

Agentic RAG uses the LLM as an agent that takes on an active role and can make decisions that improve both the relevance and accuracy of the retrieved data. It can intelligently decide which database to query based on the user's question.

```plantuml
@startuml Agentic RAG
!theme plain
skinparam backgroundColor #FFFFFF
skinparam defaultFontSize 14
skinparam packageStyle rectangle

title Agentic RAG Pipeline

actor "User/Application" as User
rectangle "Query" as Query
rectangle "LLM Agent" as Agent
database "Internal Documentation DB" as IntDB
database "General Industry Knowledge DB" as GenDB
database "Failsafe/External" as Failsafe
rectangle "Prompt" as Prompt
rectangle "LLM for Generation" as GenLLM
rectangle "Output" as Output

User --> Query : sends\nquery
Query --> Agent : send to\nLLM agent
Agent --> IntDB : route based\non analysis
Agent --> GenDB : route based\non analysis
Agent --> Failsafe : route for\nout-of-scope\nqueries

IntDB --> Prompt : returns\ninternal docs
GenDB --> Prompt : returns\nindustry info
Failsafe --> Output : return\nunhandled\nmessage

Prompt --> GenLLM : context +\noriginal query
GenLLM --> Output : generates\nresponse

note right of Agent : Interprets query\ncontext and decides\nwhich DB to use
note right of IntDB : Contains policies,\nprocedures, and\nguidelines
note right of GenDB : Contains industry\nstandards, best\npractices
note left of Failsafe : For queries\nnot relevant\nto other DBs
@enduml
```

## Use Cases for Agentic RAG

Here are some practical applications of the agentic RAG pipeline:

```plantuml
@startuml Use Cases
!theme plain
skinparam backgroundColor #FFFFFF
skinparam defaultFontSize 14
skinparam packageStyle rectangle

title Agentic RAG Use Cases

package "Customer Support System" as CS {
  rectangle "Customer Query" as CSQuery
  rectangle "Agent LLM" as CSAgent
  database "Product Docs DB" as CSDB1
  database "FAQ DB" as CSDB2
  rectangle "Response" as CSResponse
}

package "Legal Technology" as Legal {
  rectangle "Legal Query" as LQuery
  rectangle "Agent LLM" as LAgent
  database "Internal Briefs DB" as LDB1
  database "Public Case DB" as LDB2
  rectangle "Response" as LResponse
}

package "Healthcare System" as Health {
  rectangle "Medical Query" as HQuery
  rectangle "Agent LLM" as HAgent
  database "Patient Records DB" as HDB1
  database "Medical Knowledge DB" as HDB2
  rectangle "Response" as HResponse
}

CSQuery --> CSAgent
CSAgent --> CSDB1
CSAgent --> CSDB2
CSDB1 --> CSResponse
CSDB2 --> CSResponse

LQuery --> LAgent
LAgent --> LDB1
LAgent --> LDB2
LDB1 --> LResponse
LDB2 --> LResponse

HQuery --> HAgent
HAgent --> HDB1
HAgent --> HDB2
HDB1 --> HResponse
HDB2 --> HResponse

note top of CS : Agent routes customer\nqueries to appropriate\nknowledge base
note top of Legal : Agent can access both\ninternal briefs and\npublic caselaw as needed
note top of Health : Agent can pull from\nboth patient records\nand medical knowledge
@enduml
```

## Key Differences Between Traditional RAG and Agentic RAG

| Aspect | Traditional RAG | Agentic RAG |
|--------|----------------|-------------|
| **LLM Role** | Used solely for response generation | Used as an active agent for decision-making |
| **Data Source Decision** | Fixed single data source | Intelligent routing to multiple data sources |
| **Query Understanding** | Limited context understanding | Deep contextual analysis |
| **Flexibility** | Less flexible, single pipeline | Highly adaptable, multi-path pipeline |
| **Handling Out-of-Scope Queries** | May return irrelevant results | Routes to failsafe mechanism |

## Advantages of Agentic RAG

```plantuml
@startuml Advantages
!theme plain
skinparam backgroundColor #FFFFFF
skinparam defaultFontSize 14
skinparam packageStyle rectangle

title Advantages of Agentic RAG

rectangle "Contextual Understanding" as Context
rectangle "Intelligent Routing" as Routing
rectangle "Multi-Source Integration" as MultiSource
rectangle "Improved Accuracy" as Accuracy
rectangle "Adaptive Responses" as Adaptive

Context --> Routing : enables
Routing --> MultiSource : allows
MultiSource --> Accuracy : increases
Accuracy --> Adaptive : enables

note top of Context : LLM agent interprets\nquery context
note top of Routing : Chooses optimal\nDB based on context
note top of MultiSource : Accesses multiple\nrelevant sources
note top of Accuracy : More targeted\ninformation retrieval
note top of Adaptive : Adjusts approach\nbased on query type
@enduml
```

## Conclusion

Agentic RAG represents an evolution in how we enhance the RAG pipeline by moving beyond simple response generation to more intelligent decision making. By allowing an agent to choose the best data sources and potentially even incorporate external information like real-time data or third-party services, we create a pipeline that's more responsive, accurate, and adaptable. This approach opens up possibilities for applications in customer service, legal, tech, healthcare, and virtually any field as technology continues to evolve.