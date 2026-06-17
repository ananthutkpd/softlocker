from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: str
    filename: str
    original_filename: str
    mime_type: str
    file_size: int
    category: str
    extracted_text: str | None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class CategoryCount(BaseModel):
    category: str
    count: int


class CategoriesResponse(BaseModel):
    categories: list[CategoryCount]
    total: int
