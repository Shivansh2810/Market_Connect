from langchain.prompts import ChatPromptTemplate
from langchain.schema.output_parser import StrOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI
import re

def sanitize(txt):
    if hasattr(txt, "content"):
        txt = txt.content
    txt = re.sub(r"```.*?```", "", txt, flags=re.DOTALL)
    return txt.strip()

api_key = "AIzaSyAxg8OKV5hMNTSmAGTgPT93xKf7JTJPVbk"
model = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=api_key)
out_parser = StrOutputParser()

actor_prompt = ChatPromptTemplate.from_template(
    "Identify all primary and secondary actors from the given description.\n\n"
    "-----------------\n"
    "Example 1:\n"
    "System: Food Delivery app where users place orders, track them, and restaurants prepare meals.\n"
    "Actors: Customer, Restaurant, Delivery Partner, Payment Gateway\n\n"
    "-----------------\n"
    "Example 2:\n"
    "System: Online Exam Portal where students take tests, teachers upload papers, and system auto-grades.\n"
    "Actors: Student, Teacher, Exam Server\n\n"
    "-----------------\n"
    "Example 3:\n"
    "System: Ride-Hailing app that matches passengers with drivers and processes payments.\n"
    "Actors: Passenger, Driver, Ride Matching Service, Payment Gateway\n\n"
    "-----------------\n"
    "Problem:\n{desc}\nActors:"
)
actor_chain = actor_prompt | model | out_parser

goal_prompt = ChatPromptTemplate.from_template(
    "List the main goals (use cases) of the system based on the description and actors.\n\n"
    "-----------------\n"
    "Example 1:\n"
    "System: Food Delivery\nActors: Customer, Restaurant, Delivery Partner, Payment Gateway\n"
    "Goals: Place Order, Accept Order, Prepare Food, Deliver Order, Track Delivery, Make Payment\n\n"
    "-----------------\n"
    "Example 2:\n"
    "System: Online Exam Portal\nActors: Student, Teacher, Exam Server\n"
    "Goals: Upload Question Paper, Attempt Exam, Auto-Grade Paper, View Results\n\n"
    "-----------------\n"
    "Example 3:\n"
    "System: Ride-Hailing\nActors: Passenger, Driver, Payment Gateway\n"
    "Goals: Request Ride, Match Ride, Accept Ride, Start Trip, End Trip, Pay Fare\n\n"
    "-----------------\n"
    "Problem:\n{desc}\nActors:\n{actors}\nGoals:"
)
goal_chain = goal_prompt | model | out_parser

uc_prompt = ChatPromptTemplate.from_template(
    "Write at least 3 detailed use case descriptions for this system.\n"
    "Each should include: Name, Goal, Preconditions, Postconditions, Main Flow, Alternate Flows.\n\n"
    "-----------------\n"
    "Example 1: Food Delivery\n"
    "Name: Place Order\n"
    "Goal: Customer orders food online\n"
    "Preconditions: Customer is logged in; Restaurant is available\n"
    "Postconditions: Order is recorded\n"
    "Main Flow:\n"
    "1. Customer browses menu\n"
    "2. Customer selects items and quantity\n"
    "3. Customer confirms order\n"
    "4. Payment is processed\n"
    "5. Order sent to restaurant\n"
    "Alternate Flows:\n"
    "4.1 Payment fails → Order cancelled\n\n"
    "-----------------\n"
    "Example 2: Online Exam\n"
    "Name: Attempt Exam\n"
    "Goal: Student completes test\n"
    "Preconditions: Exam scheduled; Student registered\n"
    "Postconditions: Answers saved\n"
    "Main Flow:\n"
    "1. Student logs into portal\n"
    "2. Student opens exam\n"
    "3. Student answers questions\n"
    "4. Student submits exam\n"
    "Alternate Flows:\n"
    "3.1 Connection lost → Auto-save responses\n\n"
    "-----------------\n"
    "Problem Goals:\n{goals}\n\nActors:\n{actors}\n\nUse Case Descriptions:"
)
uc_chain = uc_prompt | model | out_parser

uml_prompt = ChatPromptTemplate.from_template(
    "Generate a PlantUML Use Case Diagram using:\nActors: {actors}\nGoals: {goals}\n"
    "Return only the PlantUML code (@startuml ... @enduml)."
)
uml_chain = uml_prompt | model | out_parser

problem = """An Airline Ticketing System allows the Clerk to order tickets and 
search for flights. The Clerk enters traveler details and selected flight to book tickets.
The system lists flights between airports for a given date, supports multicity routes,
and allows flight lookup without booking. A help service is available to assist the Clerk
and can be accessed independently."""

actors = actor_chain.invoke({"desc": problem})
print("\n--- Actors ---\n", sanitize(actors))

goals = goal_chain.invoke({"desc": problem, "actors": actors})
print("\n--- Goals ---\n", sanitize(goals))

use_cases = uc_chain.invoke({"actors": actors, "goals": goals})
print("\n--- Use Cases ---\n", sanitize(use_cases))

uml = uml_chain.invoke({"actors": actors, "goals": goals})
print("\n--- Use Case Diagram (PlantUML) ---\n", sanitize(uml))
