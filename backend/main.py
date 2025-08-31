from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from database import SessionLocal, engine, Base
from models import Bill, BillItem
from schemas import BillCreate, BillResponse, BillItemResponse
import models
import schemas

app = FastAPI()

# CORS setup to allow frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/bills/", response_model=schemas.BillResponse)
def create_bill(bill: schemas.BillCreate, db: Session = Depends(get_db)):
    db_bill = models.Bill(
        customer_name=bill.customer_name,
        phone=bill.phone,
        address=bill.address,
        date=bill.date,
        subtotal=bill.subtotal,
        tax_rate=bill.tax_rate,
        tax_amount=bill.tax_amount,
        grand_total=bill.grand_total
    )
    db.add(db_bill)
    db.commit()
    db.refresh(db_bill)

    for item in bill.items:
        db_item = models.BillItem(
            bill_id=db_bill.id,
            description=item.description,
            karat=item.karat,
            weight=item.weight,
            rate=item.rate,
            amount=item.amount
        )
        db.add(db_item)
    db.commit()
    return db_bill

@app.get("/bills/", response_model=List[schemas.BillResponse])
def get_bills(
    customer_name: str = None,
    date: str = None,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    query = db.query(models.Bill)
    if customer_name:
        query = query.filter(models.Bill.customer_name.ilike(f"%{customer_name}%"))
    if date:
        query = query.filter(models.Bill.date.like(f"{date}%"))
    bills = query.order_by(models.Bill.date.desc()).limit(limit).all()
    return bills

@app.get("/bills/{bill_id}", response_model=schemas.BillResponse)
def get_bill(bill_id: int, db: Session = Depends(get_db)):
    bill = db.query(models.Bill).filter(models.Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    return bill

@app.get("/reports/monthly/", response_model=dict)
def get_monthly_report(month: int, year: int, db: Session = Depends(get_db)):
    start_date = datetime(year, month, 1).isoformat()[:7]
    bills = db.query(models.Bill).filter(models.Bill.date.like(f"{start_date}%")).all()
    
    num_bills = len(bills)
    total_sales = sum(bill.grand_total for bill in bills)
    total_tax = sum(bill.tax_amount for bill in bills)
    avg_bill = total_sales / num_bills if num_bills > 0 else 0.0

    return {
        "num_bills": num_bills,
        "total_sales": total_sales,
        "total_tax": total_tax,
        "avg_bill": avg_bill
    }

@app.get("/bills/export/", response_model=List[schemas.BillResponse])
def export_bills(db: Session = Depends(get_db)):
    return db.query(models.Bill).all()