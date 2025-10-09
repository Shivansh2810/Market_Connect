from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser, PydanticOutputParser
from langchain.schema.runnable import RunnableBranch, RunnableLambda
from pydantic import BaseModel, Field
from typing import Literal
import os

# Load environment variables
# load_dotenv()
os.environ['GOOGLE_API_KEY'] = 'AIzaSyAlrESrzXlWDKgTHc6ujWE8ZCcwRlzh9DI'

# Initialize model
model = ChatGoogleGenerativeAI(model='gemini-2.5-flash')

class Classifier(BaseModel):
    problem: Literal['leave_request', 'salary_query', 'job_opening', 'policy_feedback'] = Field(
        description='Classify the employee email into one of the four categories.'
    )

parser = StrOutputParser()
parser1 = PydanticOutputParser(pydantic_object=Classifier)

#  Classification Prompt

classifier_template = PromptTemplate(
    template="""
    Classify the employee email into one of the following categories:
    - leave_request: Requests for vacation, sick leave, or other absences.
    - salary_query: Questions about salary, deductions, bonuses, or payroll.
    - job_opening: Inquiries about current job vacancies or application status.
    - policy_feedback: Comments, suggestions, or questions about HR/company policies.

    Email: {feedback}
    {format_instruction}
    """,
    input_variables=['feedback'],
    partial_variables={'format_instruction': parser1.get_format_instructions()}
)

# Classifier chain
classifier_chain = classifier_template | model | parser1

#  Templates for Each Category

leave_request_template = PromptTemplate(
    template="""
    Act as a professional HR assistant. The employee is requesting leave. 
    Write a concise, friendly 50-word reply acknowledging the request, explaining the next steps for approval, and providing guidance on required documentation or forms.
    {feedback}
    """,
    input_variables=['feedback'],
)

salary_query_template = PromptTemplate(
    template="""
    Act as a professional HR assistant. The employee has a question about salary or payroll. 
    Write a 50-word clear and polite reply explaining how salary queries are handled, possible timelines for resolution, and contact points if needed.
    {feedback}
    """,
    input_variables=['feedback'],
)

job_opening_template = PromptTemplate(
    template="""
    Act as a professional HR assistant. The employee is asking about job openings or application status. 
    Write a 50-word informative and encouraging reply confirming how to check openings, application procedures, and where to find more details.
    {feedback}
    """,
    input_variables=['feedback'],
)

policy_feedback_template = PromptTemplate(
    template="""
    Act as a professional HR assistant. The employee has provided feedback or asked about HR/company policies. 
    Write a 50-word polite reply thanking them for the feedback, confirming it will be reviewed, and offering further assistance if needed.
    {feedback}
    """,
    input_variables=['feedback'],
)

# Branch Routing

branch_chain = RunnableBranch(
    (lambda x: x.problem == 'leave_request', leave_request_template | model | parser),
    (lambda x: x.problem == 'salary_query', salary_query_template | model | parser),
    (lambda x: x.problem == 'job_opening', job_opening_template | model | parser),
    (lambda x: x.problem == 'policy_feedback', policy_feedback_template | model | parser),
    RunnableLambda(lambda x: 'Could not classify the message into any of the mentioned categories. Sorry.')
)

#  Main Chain

main_chain = classifier_chain | branch_chain

query = input("Enter the employee email here: ")

# Classification step
classified = classifier_chain.invoke({'feedback': query})
print("Classified as:", classified.problem)

# Response generation step
result = main_chain.invoke({'feedback': query})
print(result)
