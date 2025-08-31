from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class BillItemCreate(BaseModel):
    description: str
    karat: str
    weight: float
    rate: float
    amount: float

class BillCreate(BaseModel):
    customer_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    date: str
    subtotal: float
    tax_rate: float
    tax_amount: float
    grand_total: float
    items: List[BillItemCreate]

class BillItemResponse(BaseModel):
    id: int
    bill_id: int
    description: str
    karat: str
    weight: float
    rate: float
    amount: float

    class Config:
        from_attributes = True

class BillResponse(BaseModel):
    id: int
    customer_name: str
    phone: Optional[str]
    address: Optional[str]
    date: str
    subtotal: float
    tax_rate: float
    tax_amount: float
    grand_total: float
    items: List[BillItemResponse]

    class Config:
        from_attributes = True