from langchain_google_genai import  ChatGoogleGenerativeAI
from dotenv import load_dotenv
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain.schema.runnable import RunnableBranch,RunnableLambda
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel,Field
from typing import Literal
import os


# load the api key  
os.environ['GOOGLE_API_KEY'] = 'AIzaSyCJW9oxbeyPtdRumJhtdwZODfkZrikZ_Rw'

# invoke the model
model=ChatGoogleGenerativeAI(model='gemini-2.5-flash')


# Creating a pydantic object so that LLM give answer exactly mentioned in Literal
class Classifier(BaseModel):
    problem: Literal['order_issue','refund_request','product_inquiry','general_feedback'] = Field(description='Give me classfication of problem into one of teh four category')
  
    
# Output-parser 
parser=StrOutputParser()
parser1=PydanticOutputParser(pydantic_object=Classifier)
    
    
# classifier template
classifier_template = PromptTemplate(
    template="""Classify the message into one of the following categories:
    - order_issue: Problems with delivery, damaged items, wrong/missing orders
    - refund_request: Asking for or following up on refunds
    - product_inquiry: Asking about availability, size, color, features
    - general_feedback: General help, policy questions, compliments, or complaints not about a specific product/order

    Message: {feedback}
    {format_instruction}
    """,
        input_variables=['feedback'],
        partial_variables={'format_instruction': parser1.get_format_instructions()}
    )


# creating a classifier chain
classifier_chain= classifier_template | model | parser1



# Templates for different types of responses
order_issue_template=PromptTemplate(
    template="""Act as a friendly, empathetic customer-support agent for an online store. The customer’s order has an issue (delay, damage, wrong item, etc.). Draft a concise, 50-word reply that apologizes, explains the next steps, offers a replacement or refund, gives a clear timeframe for follow-up, and reassures the customer. \n {feedback}""",
    input_variables=['feedback'],
)

refund_request_template=PromptTemplate(
    template="""Act as a polite and helpful customer support agent. The customer has requested a refund. Write a 50-word friendly and empathetic reply confirming the refund, providing the expected processing time, and expressing appreciation for their patience. Maintain a professional tone that reassures and encourages continued trust.\n {feedback}""",
    input_variables=['feedback'],
)

product_inquiry_template=PromptTemplate(
    template="""Act as a friendly and informative customer support agent. The customer has inquired about a product’s availability or features. Write a 50-word response confirming availability (if applicable), directing them to more details, and offering further help. Keep the tone welcoming, helpful, and focused on encouraging a purchase decision. \n {feedback}""",
    input_variables=['feedback'],
)

general_feedback_template=PromptTemplate(
    template="""Act as a courteous and supportive customer service agent. A customer has sent a general query (not tied to a specific order or complaint). Write a 50-word friendly response acknowledging the query, assuring assistance, and inviting further questions. Keep the tone warm, responsive, and professional. \n {feedback}""",
    input_variables=['feedback'],
)



# branch-chain(if-else type) to run a particular chains based on condition meet
branch_chain=RunnableBranch(
    (lambda x: x.problem=='order_issue', order_issue_template | model | parser),
    (lambda x: x.problem=='refund_request', refund_request_template | model | parser),
    (lambda x: x.problem=='product_inquiry', product_inquiry_template | model | parser),
    (lambda x: x.problem=='general_feedback', general_feedback_template | model | parser),
    RunnableLambda(lambda x: 'could not classify into any of menioned category. SOORY'),
)

# merging chains
main_chain= classifier_chain | branch_chain


# query of user
query=input("Enter your query here : ")


# to print which chain is running
classified = classifier_chain.invoke({'feedback': query})
print("Classified as: ", classified.problem)


# invoke the main chain
result=main_chain.invoke({'feedback':query})


# print the result
print(result)

# for printing structure of chains
# chain.get_graph().print_ascii()
