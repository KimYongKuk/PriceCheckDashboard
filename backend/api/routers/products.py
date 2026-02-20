from supabase import Client
from postgrest.exceptions import APIError

from fastapi import APIRouter, Depends, HTTPException, Query, status

from backend.api.dependencies import get_db
from backend.api.schemas import ProductCreate, ProductUpdate, ProductResponse
from backend import models

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductResponse])
def list_products(
    search: str | None = Query(None, description="키워드 검색 필터"),
    product_status: str | None = Query(None, alias="status", description="상태 필터: goal_reached, monitoring, no_target"),
    db: Client = Depends(get_db),
):
    return models.get_all_products(db, search=search, status=product_status)


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    body: ProductCreate,
    db: Client = Depends(get_db),
):
    try:
        product = models.create_product(db, keyword=body.keyword, target_price=body.target_price, memo=body.memo)
    except APIError as e:
        if "23505" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="동일 키워드가 이미 존재합니다.",
            )
        raise
    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    body: ProductUpdate,
    db: Client = Depends(get_db),
):
    update_kwargs = {}
    provided = body.model_fields_set
    if "target_price" in provided:
        update_kwargs["target_price"] = body.target_price
    if "memo" in provided:
        update_kwargs["memo"] = body.memo
    if "is_active" in provided:
        update_kwargs["is_active"] = body.is_active

    result = models.update_product(db, product_id, **update_kwargs)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 상품을 찾을 수 없습니다.",
        )
    return result


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Client = Depends(get_db),
):
    deleted = models.delete_product(db, product_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 상품을 찾을 수 없습니다.",
        )
