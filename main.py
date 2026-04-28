from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.db import engine
from database import models
from routers import pipe_table, allowable_stress, calculation

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="pipe-calc API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pipe_table.router)
app.include_router(allowable_stress.router)
app.include_router(calculation.router)


@app.get("/")
def root():
    return {"status": "ok"}
