from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter
from sqlalchemy.orm import Session
from app.graphql import schema
from app.database import get_db
from app.config import CORS_ORIGINS

app = FastAPI(title="Admin API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GraphQL context
async def get_context(db: Session = Depends(get_db)):
    return {"db": db}

# GraphQL Router
graphql_app = GraphQLRouter(schema, context_getter=get_context)
app.include_router(graphql_app, prefix="/graphql")

@app.get("/")
def root():
    return {"message": "Admin API - Visit /graphql for GraphQL playground"}
